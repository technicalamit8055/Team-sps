// One-time migration: create real Supabase Auth accounts for existing
// master_staff rows that were previously "authenticated" only through the
// insecure localStorage fallback in src/hooks/useAuth.tsx.
//
// Safe to re-run: any master_staff row that already has a user_id is skipped.
//
// Usage:
//   1. Apply the RLS migration's `ALTER TABLE master_staff ADD COLUMN user_id`
//      step first (supabase/migrations/20260911185203_fix_rls_policies.sql),
//      OR run this script before that migration — either order is fine, this
//      script only needs the user_id column to exist, which that migration
//      adds with IF NOT EXISTS.
//   2. Set two environment variables (do NOT commit these anywhere):
//        SUPABASE_URL=https://<project-ref>.supabase.co
//        SUPABASE_SERVICE_ROLE_KEY=<service role key, from Supabase dashboard>
//      (the service role key is found in Project Settings -> API -> service_role;
//      never put it in .env / VITE_ prefixed vars, and never ship it client-side)
//   3. Run:
//        node scripts/migrate-staff-to-auth.mjs
//   4. The script prints each staff member's username + a freshly generated
//      temporary password. Share these with each staff member out of band
//      (e.g. in person, or via the existing WhatsApp-share flow in
//      StaffKaryakartaView.tsx) and ask them to change their password after
//      first login.
//   5. Once every staff member has confirmed they can log in with the new
//      credentials, clear the plaintext password column in master_staff:
//        UPDATE public.master_staff SET password_hash = NULL;
//      (run in the Supabase SQL editor) so no plaintext password remains
//      anywhere in the database.

import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    'Missing environment variables. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running this script.'
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// primary_role values seen in seeded/created data -> app_role enum used by user_roles.
// Adjust this mapping if your staff roster uses different primary_role values.
const ROLE_MAP = {
  admin: 'admin',
  accountant: 'manager',
  manager: 'manager',
  collector: 'worker',
  karyakarta: 'worker',
  observer: 'worker',
};

function mapRole(primaryRole) {
  return ROLE_MAP[primaryRole] ?? 'worker';
}

function generateTempPassword() {
  // 16 random bytes -> base64url, trimmed to a readable, sufficiently strong length.
  return crypto.randomBytes(16).toString('base64url').slice(0, 20);
}

function toProxyEmail(username) {
  return `${username.toLowerCase().replace(/[^a-z0-9]/g, '')}@victory.local`;
}

async function main() {
  const { data: staffRows, error: staffError } = await supabase
    .from('master_staff')
    .select('id, name, username, phone, primary_role, user_id')
    .is('user_id', null);

  if (staffError) {
    console.error('Failed to fetch master_staff rows:', staffError.message);
    process.exit(1);
  }

  if (!staffRows || staffRows.length === 0) {
    console.log('No unmigrated staff rows found — every master_staff row already has a user_id.');
    return;
  }

  console.log(`Found ${staffRows.length} staff member(s) to migrate.\n`);

  const results = [];

  for (const staff of staffRows) {
    const proxyEmail = toProxyEmail(staff.username);
    const tempPassword = generateTempPassword();
    const role = mapRole(staff.primary_role);

    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email: proxyEmail,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { username: staff.username, full_name: staff.name },
    });

    if (createError || !created?.user) {
      console.error(`[FAILED] ${staff.username}: ${createError?.message ?? 'unknown error'}`);
      continue;
    }

    const authUserId = created.user.id;

    const { error: profileError } = await supabase.from('profiles').insert({
      id: authUserId,
      username: staff.username,
      full_name: staff.name,
      phone: staff.phone ?? null,
    });

    if (profileError) {
      console.error(`[FAILED] ${staff.username}: profile insert failed (${profileError.message}) — rolling back auth user`);
      await supabase.auth.admin.deleteUser(authUserId).catch(() => {});
      continue;
    }

    const { error: roleError } = await supabase.from('user_roles').insert({
      user_id: authUserId,
      role,
    });

    if (roleError) {
      console.error(`[FAILED] ${staff.username}: role insert failed (${roleError.message}) — rolling back`);
      await supabase.from('profiles').delete().eq('id', authUserId).catch(() => {});
      await supabase.auth.admin.deleteUser(authUserId).catch(() => {});
      continue;
    }

    const { error: linkError } = await supabase
      .from('master_staff')
      .update({ user_id: authUserId })
      .eq('id', staff.id);

    if (linkError) {
      console.error(`[FAILED] ${staff.username}: could not link master_staff.user_id (${linkError.message})`);
      continue;
    }

    results.push({ username: staff.username, name: staff.name, role, tempPassword });
    console.log(`[OK] ${staff.username} (${staff.name}) -> role: ${role}`);
  }

  console.log('\n=== Migration complete ===');
  console.log('Share each temporary password with its staff member out of band, then ask them to sign in and change it.\n');
  for (const r of results) {
    console.log(`  username: ${r.username}   role: ${r.role}   temp password: ${r.tempPassword}`);
  }
  console.log(
    '\nOnce everyone has confirmed login, clear plaintext passwords with:\n' +
    "  UPDATE public.master_staff SET password_hash = NULL;\n" +
    '(run in the Supabase SQL editor)'
  );
}

main().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
