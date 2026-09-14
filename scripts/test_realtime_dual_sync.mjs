/**
 * Two-client Realtime check: does an entry made at one counter reach another
 * without a refresh?
 *
 * Counter A writes; Counter B only listens. The assertion that matters is on
 * B -- a write that succeeds locally proves nothing about what the other
 * tablets in the pandal can see, which is exactly the failure this feature
 * exists to prevent.
 *
 * Run:
 *   node scripts/test_realtime_dual_sync.mjs
 *
 * Reads VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY from .env. Needs a
 * database where APPLY_REALTIME_SYNC.sql has been run, and RLS that permits the
 * anon key to read and write samiti_donations -- otherwise use a service-role
 * key via SUPABASE_SERVICE_ROLE_KEY.
 *
 * Writes one donation with a `__realtime_test__` marker and deletes it in a
 * finally block, including on failure.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

const MARKER = '__realtime_test__';
/** Generous next to the <100ms target: a cold WebSocket plus WAL is the slow path. */
const EVENT_TIMEOUT_MS = 10000;
const EVENT_ID = process.env.REALTIME_TEST_EVENT_ID || 'evt-durga-2026';

function loadEnv() {
  const env = { ...process.env };
  try {
    for (const line of readFileSync(new URL('../.env', import.meta.url), 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !env[m[1]]) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch {
    // No .env: fall back to the real environment.
  }
  return env;
}

const env = loadEnv();
const url = env.VITE_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY (check .env).');
  process.exit(1);
}

/** Resolves on the first event for `id` matching `type`. */
function waitForEvent(received, id, type) {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const poll = setInterval(() => {
      const hit = received.find(e => e.type === type && e.id === id);
      if (hit) {
        clearInterval(poll);
        resolve(Date.now() - started);
      } else if (Date.now() - started > EVENT_TIMEOUT_MS) {
        clearInterval(poll);
        reject(new Error(`Counter B never received ${type} for ${id} within ${EVENT_TIMEOUT_MS}ms`));
      }
    }, 25);
  });
}

const counterA = createClient(url, key, { auth: { persistSession: false } });
const counterB = createClient(url, key, { auth: { persistSession: false } });

const received = [];
const donationId = randomUUID();
let channel;
let failures = 0;

function report(label, ok, detail) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures++;
}

try {
  console.log('Counter B: subscribing...');
  channel = counterB.channel('samiti-realtime-sync-test');
  channel.on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'samiti_donations' },
    payload => {
      received.push({
        type: payload.eventType,
        id: payload.new?.id ?? payload.old?.id,
        row: payload.new,
      });
    }
  );

  await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('Counter B could not subscribe within 15s')), 15000);
    channel.subscribe(status => {
      if (status === 'SUBSCRIBED') { clearTimeout(t); resolve(); }
      else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        clearTimeout(t);
        reject(new Error(`Counter B subscribe failed: ${status}`));
      }
    });
  });
  console.log('Counter B: subscribed.\n');

  // --- INSERT -------------------------------------------------------------
  console.log('Counter A: inserting donation...');
  const { error: insErr } = await counterA.from('samiti_donations').insert({
    id: donationId,
    event_id: EVENT_ID,
    serial_number: 999000 + Math.floor(Math.random() * 999),
    category: 'OTH',
    name: `परीक्षण दानदाता #Realtime ${MARKER}`,
    accepted_amount: 2100,
    received_amount: 2100,
    balance_amount: 0,
    payment_mode: 'CASH',
    date: new Date().toISOString().slice(0, 10),
  });
  if (insErr) {
    // The anon key cannot write donations -- correctly, that is what the RLS
    // policies are for. It is a limitation of running this script unattended,
    // not a Realtime fault, so say so rather than reporting a sync failure.
    if (/row-level security/i.test(insErr.message)) {
      console.error(
        '\nCannot write as the anon key: samiti_donations RLS requires a signed-in\n' +
        'worker or admin. Re-run with a service-role key to exercise the write path:\n' +
        '  SUPABASE_SERVICE_ROLE_KEY=<key> node scripts/test_realtime_dual_sync.mjs\n' +
        '(Counter B did subscribe successfully, so the channel itself is reachable.)'
      );
    }
    throw new Error(`Counter A insert failed: ${insErr.message}`);
  }

  const insertMs = await waitForEvent(received, donationId, 'INSERT');
  report('Counter B sees the INSERT without refreshing', true, `${insertMs}ms`);

  // --- UPDATE -------------------------------------------------------------
  // The one REPLICA IDENTITY FULL actually gates: without it this is the step
  // that silently never arrives.
  console.log('Counter A: editing the donation...');
  const { error: updErr } = await counterA
    .from('samiti_donations')
    .update({ address1: 'नया पता — realtime edit', updated_at: new Date().toISOString() })
    .eq('id', donationId);
  if (updErr) throw new Error(`Counter A update failed: ${updErr.message}`);

  const updateMs = await waitForEvent(received, donationId, 'UPDATE');
  const updated = received.find(e => e.type === 'UPDATE' && e.id === donationId);
  report('Counter B sees the UPDATE without refreshing', true, `${updateMs}ms`);
  report(
    'UPDATE payload carries non-key columns (REPLICA IDENTITY FULL)',
    updated?.row?.address1 === 'नया पता — realtime edit',
    updated?.row?.address1 === undefined
      ? 'address1 missing — table is not REPLICA IDENTITY FULL'
      : `address1="${updated?.row?.address1}"`
  );
} catch (err) {
  report(err.message, false);
} finally {
  console.log('\nCleaning up...');
  const { error: delErr } = await counterA.from('samiti_donations').delete().eq('id', donationId);
  if (delErr) console.error(`  WARNING: could not delete test row ${donationId}: ${delErr.message}`);
  else console.log(`  Deleted test row ${donationId}`);

  if (channel) await counterB.removeChannel(channel);
  counterA.realtime.disconnect();
  counterB.realtime.disconnect();

  console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) failed.`);
  process.exit(failures === 0 ? 0 : 1);
}
