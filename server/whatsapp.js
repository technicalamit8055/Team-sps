/**
 * Lightweight WhatsApp sender built on Baileys (no paid API).
 *
 * Owns exactly one socket for the whole process: Baileys keeps a live
 * WebSocket to WhatsApp, so this module must run inside a long-lived Node
 * server (see server/index.js), never in a serverless function.
 */
import fs from 'node:fs';
import path from 'node:path';
import pino from 'pino';
import QRCode from 'qrcode';
import {
  makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
  Browsers,
} from '@whiskeysockets/baileys';

const AUTH_DIR = path.resolve(process.env.WHATSAPP_AUTH_DIR || './whatsapp_auth');
const COUNTRY_CODE = (process.env.WHATSAPP_COUNTRY_CODE || '91').replace(/\D/g, '');
const DEFAULT_PHONE = process.env.WHATSAPP_DEFAULT_PHONE || '';
const BUSINESS_NAME = process.env.WHATSAPP_BUSINESS_NAME || 'श्री दुर्गा पूजा समिति';

/** Anti-ban: minimum gap between two outgoing messages. */
const MIN_SEND_GAP_MS = Number(process.env.WHATSAPP_MIN_GAP_MS || 2500);

/** Give up reconnecting (and wipe likely-corrupt creds) after this many tries. */
const MAX_RECONNECT_ATTEMPTS = Number(process.env.WHATSAPP_MAX_RECONNECT || 6);

const logger = pino({ level: process.env.WHATSAPP_LOG_LEVEL || 'warn' });

/**
 * Single mutable connection record. `state` drives the UI:
 * closed -> connecting -> qr -> open.
 */
const conn = {
  sock: null,
  state: 'closed',
  qr: null,
  error: null,
  me: null,
  starting: null,
  /** Set when the user asked to log out, so we don't auto-reconnect. */
  intentionalLogout: false,
  reconnectAttempts: 0,
};

/* ------------------------------------------------------------------ *
 * Phone normalization
 * ------------------------------------------------------------------ */

/**
 * Normalize a loosely typed phone number to bare digits in international
 * form. Returns null when the result cannot be a real number.
 *
 *   "+91 98350-12345" -> "919835012345"
 *   "098350 12345"    -> "919835012345"
 *   "9835012345"      -> "919835012345"
 */
export function normalizePhone(input, countryCode = COUNTRY_CODE) {
  if (input === undefined || input === null) return null;

  let digits = String(input).replace(/\D/g, '');
  if (!digits) return null;

  // Strip an international prefix typed as 00 (e.g. 0091...).
  if (digits.startsWith('00')) digits = digits.slice(2);

  // Strip national trunk zeros (e.g. 0 98350 12345).
  digits = digits.replace(/^0+/, '');
  if (!digits) return null;

  // A local-length number gets the default country code prepended.
  if (digits.length <= 10) digits = `${countryCode}${digits}`;

  // Shortest real E.164 subscriber numbers are ~8 digits incl. country code.
  if (digits.length < 8 || digits.length > 15) return null;

  return digits;
}

/** Convert any accepted phone input into a WhatsApp JID. */
export function toJid(input, countryCode = COUNTRY_CODE) {
  const digits = normalizePhone(input, countryCode);
  return digits ? `${digits}@s.whatsapp.net` : null;
}

/* ------------------------------------------------------------------ *
 * Anti-ban send queue
 * ------------------------------------------------------------------ */

/**
 * Serializes every outgoing send and spaces them out, so a burst of
 * receipts never looks like automated spam to WhatsApp.
 */
let queueTail = Promise.resolve();
let lastSentAt = 0;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function enqueue(task) {
  const run = queueTail.then(async () => {
    const waitFor = MIN_SEND_GAP_MS - (Date.now() - lastSentAt);
    if (waitFor > 0) await sleep(waitFor);
    try {
      return await task();
    } finally {
      lastSentAt = Date.now();
    }
  });

  // Keep the chain alive even when one task rejects.
  queueTail = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

/* ------------------------------------------------------------------ *
 * Connection lifecycle
 * ------------------------------------------------------------------ */

function hasStoredSession() {
  try {
    return fs.existsSync(path.join(AUTH_DIR, 'creds.json'));
  } catch {
    return false;
  }
}

function clearAuthDir() {
  try {
    fs.rmSync(AUTH_DIR, { recursive: true, force: true });
  } catch (err) {
    logger.warn({ err }, 'failed to clear whatsapp auth dir');
  }
}

/**
 * Create the socket and wire up its lifecycle events. Resolves as soon as
 * the socket exists — callers poll `getStatus()` for the QR / open state.
 */
async function startSocket() {
  if (conn.starting) return conn.starting;
  if (conn.sock && conn.state === 'open') return conn.sock;

  conn.starting = (async () => {
    fs.mkdirSync(AUTH_DIR, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    const { version } = await fetchLatestBaileysVersion();

    conn.state = 'connecting';
    conn.error = null;
    conn.intentionalLogout = false;

    const sock = makeWASocket({
      version,
      auth: state,
      logger,
      // We only ever send; never mark ourselves online to reduce footprint.
      markOnlineOnConnect: false,
      browser: Browsers.appropriate('Chrome'),
      syncFullHistory: false,
      generateHighQualityLinkPreview: false,
    });

    conn.sock = sock;

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        try {
          conn.qr = await QRCode.toDataURL(qr, { margin: 1, width: 320 });
          conn.state = 'qr';
        } catch (err) {
          logger.error({ err }, 'failed to render whatsapp qr');
        }
      }

      if (connection === 'open') {
        conn.state = 'open';
        conn.qr = null;
        conn.error = null;
        conn.reconnectAttempts = 0;
        conn.me = sock.user?.id ? { id: sock.user.id, name: sock.user.name || null } : null;
        logger.info({ user: conn.me }, 'whatsapp connected');
      }

      if (connection === 'close') {
        const statusCode =
          lastDisconnect?.error?.output?.statusCode ?? lastDisconnect?.error?.status;
        const loggedOut = statusCode === DisconnectReason.loggedOut;

        conn.sock = null;
        conn.me = null;
        conn.qr = null;

        if (loggedOut || conn.intentionalLogout) {
          // Phone unlinked this device — stored creds are dead weight.
          clearAuthDir();
          conn.state = 'closed';
          conn.error =
            loggedOut && !conn.intentionalLogout
              ? 'WhatsApp से डिवाइस अनलिंक हो गया। दोबारा QR स्कैन करें।'
              : null;
          conn.reconnectAttempts = 0;
          return;
        }

        conn.state = 'closed';
        conn.error = lastDisconnect?.error?.message || 'Connection closed';

        conn.reconnectAttempts += 1;

        // Creds that never complete a handshake are corrupt, not flaky:
        // retrying forever would just spin. Wipe them and ask for a new QR.
        if (conn.reconnectAttempts > MAX_RECONNECT_ATTEMPTS) {
          logger.error('whatsapp reconnect gave up; clearing session for re-pairing');
          clearAuthDir();
          conn.reconnectAttempts = 0;
          conn.error = 'WhatsApp सेशन अमान्य हो गया। कृपया दोबारा QR स्कैन करें।';
          return;
        }

        // Back off a little more on each retry, capped, then reconnect.
        const attempt = Math.min(conn.reconnectAttempts, 5);
        const delay = Math.min(2000 * 2 ** (attempt - 1), 30000);
        logger.warn({ statusCode, attempt, delay }, 'whatsapp disconnected, reconnecting');
        setTimeout(() => {
          if (!conn.sock && !conn.intentionalLogout) {
            startSocket().catch((err) => logger.error({ err }, 'reconnect failed'));
          }
        }, delay);
      }
    });

    return sock;
  })();

  try {
    return await conn.starting;
  } catch (err) {
    conn.state = 'closed';
    conn.error = err?.message || String(err);
    throw err;
  } finally {
    conn.starting = null;
  }
}

/** Public: begin pairing / connecting. */
export async function connect() {
  await startSocket();

  // Give Baileys a moment to emit the first QR so /connect can return it
  // directly instead of forcing the client into an immediate poll.
  for (let i = 0; i < 20 && conn.state === 'connecting'; i += 1) await sleep(250);

  return getStatus();
}

/** Restore a previous session on boot, but never force a new pairing. */
export async function restoreIfLinked() {
  if (!hasStoredSession()) {
    logger.info('no stored whatsapp session; waiting for QR pairing');
    return getStatus();
  }
  try {
    await startSocket();
  } catch (err) {
    logger.error({ err }, 'failed to restore whatsapp session');
  }
  return getStatus();
}

export function getStatus() {
  return {
    state: conn.state,
    connected: conn.state === 'open',
    qr: conn.state === 'open' ? null : conn.qr,
    error: conn.error,
    user: conn.me,
    hasSession: hasStoredSession(),
    defaultPhone: DEFAULT_PHONE ? normalizePhone(DEFAULT_PHONE) : null,
  };
}

/** Unlink this device and wipe local credentials. */
export async function logout() {
  conn.intentionalLogout = true;
  const sock = conn.sock;

  if (sock) {
    try {
      await sock.logout();
    } catch (err) {
      logger.warn({ err }, 'logout call failed; clearing local session anyway');
      try {
        sock.end(undefined);
      } catch {
        /* socket already dead */
      }
    }
  }

  conn.sock = null;
  conn.state = 'closed';
  conn.qr = null;
  conn.error = null;
  conn.me = null;
  conn.reconnectAttempts = 0;
  clearAuthDir();

  return getStatus();
}

/* ------------------------------------------------------------------ *
 * Receipt sending
 * ------------------------------------------------------------------ */

function formatAmount(amount) {
  const num = Number(amount);
  if (!Number.isFinite(num)) return String(amount ?? '');
  return `₹${num.toLocaleString('en-IN')}`;
}

/** Build the plain-text receipt body shared by text and PDF caption. */
export function formatReceiptMessage({
  customerName,
  amount,
  receiptNo,
  itemName,
  date,
  businessName,
} = {}) {
  const business = businessName || BUSINESS_NAME;
  const when = date || new Date().toLocaleDateString('en-IN');

  const lines = [
    `🧾 *${business}*`,
    '━━━━━━━━━━━━━━━━━━━━',
    '*भुगतान रसीद / PAYMENT RECEIPT*',
    '',
  ];

  if (receiptNo) lines.push(`*रसीद सं० / Receipt No:* ${receiptNo}`);
  lines.push(`*दिनांक / Date:* ${when}`);
  if (customerName) lines.push(`*नाम / Name:* ${customerName}`);
  if (itemName) lines.push(`*विवरण / Item:* ${itemName}`);
  lines.push(`*राशि / Amount Paid:* ${formatAmount(amount)}`);

  lines.push('', '━━━━━━━━━━━━━━━━━━━━', '🙏 धन्यवाद! / Thank you.', `_${business}_`);

  return lines.join('\n');
}

/** Ensure the socket is usable before we try to send. */
async function requireSocket() {
  if (conn.sock && conn.state === 'open') return conn.sock;

  // A stored session that simply hasn't reconnected yet is worth one retry.
  if (hasStoredSession()) {
    await startSocket().catch(() => {});
    // Give the handshake a brief window to complete.
    for (let i = 0; i < 20 && conn.state !== 'open'; i += 1) await sleep(500);
  }

  if (!conn.sock || conn.state !== 'open') {
    const err = new Error('WhatsApp जुड़ा नहीं है। पहले QR स्कैन करके लिंक करें।');
    err.code = 'NOT_CONNECTED';
    throw err;
  }
  return conn.sock;
}

/**
 * Send a receipt over WhatsApp. When `pdfBuffer` is supplied the PDF is sent
 * on its own with no caption; `message`/the default format is used only for
 * text-only sends.
 *
 * @param {object} params
 * @param {string} [params.phone]            Recipient; falls back to WHATSAPP_DEFAULT_PHONE.
 * @param {string} [params.message]          Prebuilt body; overrides the default format.
 * @param {Buffer|string} [params.pdfBuffer] PDF bytes or a base64 string.
 * @returns {Promise<{ok: true, jid: string, messageId: string|undefined, withPdf: boolean}>}
 */
export async function sendReceipt({
  phone,
  customerName,
  amount,
  receiptNo,
  itemName,
  date,
  businessName,
  message,
  pdfBuffer,
} = {}) {
  const target = phone || DEFAULT_PHONE;
  if (!target) {
    const err = new Error('कोई मोबाइल नंबर नहीं मिला (और WHATSAPP_DEFAULT_PHONE सेट नहीं है)।');
    err.code = 'NO_RECIPIENT';
    throw err;
  }

  const jid = toJid(target);
  if (!jid) {
    const err = new Error(`अमान्य मोबाइल नंबर: ${target}`);
    err.code = 'INVALID_PHONE';
    throw err;
  }

  // Callers with their own receipt layout (e.g. the Samiti donation receipt)
  // pass `message`; everyone else gets the standard format.
  const text =
    typeof message === 'string' && message.trim()
      ? message
      : formatReceiptMessage({ customerName, amount, receiptNo, itemName, date, businessName });

  let pdf = null;
  if (pdfBuffer) {
    pdf = Buffer.isBuffer(pdfBuffer)
      ? pdfBuffer
      : Buffer.from(String(pdfBuffer).replace(/^data:application\/pdf;base64,/, ''), 'base64');
    if (!pdf.length) pdf = null;
  }

  return enqueue(async () => {
    const sock = await requireSocket();

    // Never send blind: confirm the number actually exists on WhatsApp.
    const [found] = (await sock.onWhatsApp(jid)) || [];
    if (!found?.exists) {
      const err = new Error(`यह नंबर WhatsApp पर पंजीकृत नहीं है: ${normalizePhone(target)}`);
      err.code = 'NOT_ON_WHATSAPP';
      throw err;
    }

    const recipient = found.jid || jid;

    // The PDF is the receipt. When one is attached it goes out on its own,
    // with no caption, so the donor gets a single document and no wall of
    // duplicated text. Text-only sends (e.g. the setup test) still use it.
    const payload = pdf
      ? {
          document: pdf,
          mimetype: 'application/pdf',
          fileName: `receipt-${receiptNo || Date.now()}.pdf`,
        }
      : { text };

    const sent = await sock.sendMessage(recipient, payload);

    return {
      ok: true,
      jid: recipient,
      messageId: sent?.key?.id,
      withPdf: Boolean(pdf),
    };
  });
}

export const config = { AUTH_DIR, COUNTRY_CODE, DEFAULT_PHONE, BUSINESS_NAME, MIN_SEND_GAP_MS };
