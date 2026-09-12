/**
 * Long-lived API server for WhatsApp receipt sending.
 *
 * Baileys holds a persistent WebSocket and writes session files to disk, so
 * this cannot run as a serverless function — run it as its own process
 * (`npm run server`, or both at once with `npm run dev:all`).
 */
import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import {
  connect,
  logout,
  getStatus,
  restoreIfLinked,
  sendReceipt,
  config,
} from './whatsapp.js';

const app = express();

// Cloud hosts (Railway, Render, Fly) inject the port to bind as PORT and
// route external traffic to it; WHATSAPP_SERVER_PORT stays the local default.
const PORT = Number(process.env.PORT || process.env.WHATSAPP_SERVER_PORT || 8787);

// Those platforms route to the container's external interface, so binding to
// localhost would make the service unreachable and fail their health checks.
const HOST = process.env.WHATSAPP_SERVER_HOST || '0.0.0.0';

// Behind a platform proxy, so req.ip / secure reflect the real client.
app.set('trust proxy', 1);

// PDFs arrive as base64 in JSON, so allow a generous body size.
app.use(express.json({ limit: '15mb' }));

// In dev the SPA is proxied through Vite (same origin); CORS covers the case
// where the UI is served from a different host/port.
const allowedOrigins = (process.env.WHATSAPP_ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

// Vercel builds a new preview origin per deployment, so match those by
// pattern rather than listing every one in WHATSAPP_ALLOWED_ORIGINS.
const originPatterns = (process.env.WHATSAPP_ALLOWED_ORIGIN_PATTERNS || '')
  .split(',')
  .map((p) => p.trim())
  .filter(Boolean)
  .map((p) => new RegExp(`^${p.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^.]+')}$`));

app.use(
  cors({
    origin(origin, cb) {
      // Same-origin/curl/server-to-server requests send no Origin header.
      if (!origin) return cb(null, true);
      // Nothing configured: dev default, reflect whatever asks.
      if (!allowedOrigins.length && !originPatterns.length) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      if (originPatterns.some((re) => re.test(origin))) return cb(null, true);
      return cb(new Error(`Origin not allowed: ${origin}`));
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'x-whatsapp-token'],
  }),
);

// Unauthenticated liveness probe for the platform's health check. Must stay
// above the token gate, and must not leak session details.
app.get('/health', (_req, res) => res.json({ ok: true, state: getStatus().state }));

/**
 * Optional shared-secret gate. Set WHATSAPP_API_TOKEN to require callers to
 * send `x-whatsapp-token`; unset (the default for local dev) leaves it open.
 */
const API_TOKEN = process.env.WHATSAPP_API_TOKEN || '';

app.use('/api/whatsapp', (req, res, next) => {
  if (!API_TOKEN) return next();
  if (req.get('x-whatsapp-token') === API_TOKEN) return next();
  return res.status(401).json({ ok: false, error: 'Unauthorized' });
});

/** Shape every failure the same way so the UI can render it directly. */
function fail(res, err, fallbackStatus = 500) {
  const status =
    err?.code === 'NOT_CONNECTED'
      ? 409
      : err?.code === 'INVALID_PHONE' || err?.code === 'NO_RECIPIENT'
        ? 400
        : err?.code === 'NOT_ON_WHATSAPP'
          ? 422
          : fallbackStatus;

  res.status(status).json({
    ok: false,
    code: err?.code || 'ERROR',
    error: err?.message || String(err),
  });
}

app.get('/api/whatsapp/status', (_req, res) => {
  res.json({ ok: true, ...getStatus() });
});

/**
 * Effective server-side configuration, so the admin panel can show what is
 * actually in force rather than restating the .env file. Read-only: these come
 * from the environment and a running socket must not be reconfigured midflight.
 */
app.get('/api/whatsapp/settings', (_req, res) => {
  res.json({
    ok: true,
    countryCode: config.COUNTRY_CODE,
    defaultPhone: config.DEFAULT_PHONE || null,
    businessName: config.BUSINESS_NAME,
    minGapMs: config.MIN_SEND_GAP_MS,
    authDir: config.AUTH_DIR,
    tokenRequired: Boolean(API_TOKEN),
  });
});

/** Send a short test message to verify the link end to end. */
app.post('/api/whatsapp/test', async (req, res) => {
  try {
    const { phone } = req.body || {};
    const result = await sendReceipt({
      phone,
      message:
        '✅ *WhatsApp सेटअप सफल!*\n\n' +
        'यह एक परीक्षण संदेश है। अब रसीदें सीधे भेजी जा सकती हैं।\n\n' +
        `_${config.BUSINESS_NAME}_`,
    });
    res.json(result);
  } catch (err) {
    fail(res, err);
  }
});

app.post('/api/whatsapp/connect', async (_req, res) => {
  try {
    res.json({ ok: true, ...(await connect()) });
  } catch (err) {
    fail(res, err);
  }
});

app.post('/api/whatsapp/logout', async (_req, res) => {
  try {
    res.json({ ok: true, ...(await logout()) });
  } catch (err) {
    fail(res, err);
  }
});

app.post('/api/whatsapp/send-receipt', async (req, res) => {
  try {
    const result = await sendReceipt(req.body || {});
    res.json(result);
  } catch (err) {
    fail(res, err);
  }
});

app.listen(PORT, HOST, () => {
  console.log(`[whatsapp] API listening on ${HOST}:${PORT}`);
  console.log(`[whatsapp] session dir: ${config.AUTH_DIR}`);

  // An open server on a public host lets anyone send messages from the linked
  // WhatsApp account — and get it banned. Make that impossible to miss.
  if (!API_TOKEN) {
    console.warn(
      '[whatsapp] WARNING: WHATSAPP_API_TOKEN is not set — the API is UNAUTHENTICATED.\n' +
        '[whatsapp]          Fine on localhost; never deploy publicly like this.',
    );
  }
  if (!allowedOrigins.length && !originPatterns.length) {
    console.warn('[whatsapp] WARNING: no WHATSAPP_ALLOWED_ORIGINS set — all origins accepted.');
  }
  console.log(`[whatsapp] country code: +${config.COUNTRY_CODE}, min gap: ${config.MIN_SEND_GAP_MS}ms`);

  // Reconnect automatically if the device was linked in a previous run.
  restoreIfLinked().then((s) => console.log(`[whatsapp] initial state: ${s.state}`));
});
