/**
 * Client for the Baileys WhatsApp server (see server/index.js).
 *
 * Baileys holds a long-lived WebSocket and writes session files to disk, so
 * the server can never be a serverless function — it runs as its own process
 * on a host that allows those (Railway / Render / Fly / a VPS).
 *
 * In dev, Vite proxies /api/whatsapp to it on localhost. In a deployed build
 * (Vercel) there is no proxy, so VITE_WHATSAPP_API_URL must point at the
 * public URL of that server. Vite inlines these at BUILD time — changing them
 * in the Vercel dashboard requires a redeploy, not just a restart.
 */

const API_BASE = (import.meta.env.VITE_WHATSAPP_API_URL || '').replace(/\/$/, '');
const API_TOKEN = import.meta.env.VITE_WHATSAPP_API_TOKEN || '';

/**
 * True when requests can actually reach a server. The relative /api/whatsapp
 * path only resolves in dev (via the Vite proxy); in a deployed SPA it falls
 * through the host's catch-all rewrite and returns index.html, so a deployed
 * build with no VITE_WHATSAPP_API_URL is simply not wired up.
 */
export const isWhatsAppConfigured = Boolean(API_BASE) || import.meta.env.DEV;

export type WhatsAppState = 'closed' | 'connecting' | 'qr' | 'open';

export interface WhatsAppStatus {
  state: WhatsAppState;
  connected: boolean;
  /** Data-URL PNG of the pairing QR; null once connected. */
  qr: string | null;
  error: string | null;
  user?: { id: string; name: string | null } | null;
  hasSession?: boolean;
  defaultPhone?: string | null;
}

export interface SendReceiptPayload {
  /** Omit to fall back to the server's WHATSAPP_DEFAULT_PHONE. */
  phone?: string;
  customerName?: string;
  amount: number | string;
  receiptNo?: string | number;
  itemName?: string;
  date?: string;
  businessName?: string;
  /** Prebuilt receipt body; overrides the server's default formatting. */
  message?: string;
  /** Base64 PDF (with or without the data: prefix). */
  pdfBuffer?: string;
}

export interface SendReceiptResult {
  ok: true;
  jid: string;
  messageId?: string;
  withPdf: boolean;
}

/** Shown whenever the WhatsApp server process isn't reachable in dev. */
const SERVER_DOWN_MESSAGE =
  'WhatsApp सर्वर नहीं चल रहा है। टर्मिनल में `npm run dev:all` चलाएँ (या अलग से `npm run server`), फिर दोबारा कोशिश करें।';

/** Shown in a deployed build that has no WhatsApp server URL configured. */
const NOT_CONFIGURED_MESSAGE =
  'इस साइट पर WhatsApp सर्वर कॉन्फ़िगर नहीं है। Vercel में VITE_WHATSAPP_API_URL सेट करके दोबारा डिप्लॉय करें।';

/** Deployed build, unreachable server — the URL is wrong or the host is down. */
const REMOTE_DOWN_MESSAGE =
  'WhatsApp सर्वर से संपर्क नहीं हो पा रहा। सर्वर बंद हो सकता है, या URL/CORS सेटिंग ग़लत है।';

/** Error carrying the server's machine-readable code for UI branching. */
export class WhatsAppError extends Error {
  code: string;
  constructor(message: string, code = 'ERROR') {
    super(message);
    this.name = 'WhatsAppError';
    this.code = code;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  // A deployed build with no server URL would request /api/whatsapp on the
  // static host itself, which serves index.html back. Fail with something
  // actionable instead of a confusing JSON parse error.
  if (!isWhatsAppConfigured) {
    throw new WhatsAppError(NOT_CONFIGURED_MESSAGE, 'NOT_CONFIGURED');
  }

  const unreachableMessage = API_BASE ? REMOTE_DOWN_MESSAGE : SERVER_DOWN_MESSAGE;

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/whatsapp${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(API_TOKEN ? { 'x-whatsapp-token': API_TOKEN } : {}),
        ...init?.headers,
      },
    });
  } catch {
    // Also where a CSP violation or a blocked CORS preflight lands.
    throw new WhatsAppError(unreachableMessage, 'SERVER_UNREACHABLE');
  }

  // An SPA catch-all rewrite answers 200 with HTML. Treat any non-JSON
  // response as "no server here" rather than letting it parse to {}.
  if (!res.headers.get('content-type')?.includes('application/json')) {
    throw new WhatsAppError(
      API_BASE ? REMOTE_DOWN_MESSAGE : NOT_CONFIGURED_MESSAGE,
      'SERVER_UNREACHABLE',
    );
  }

  const body = await res.json().catch(() => ({}) as Record<string, unknown>);

  if (!res.ok) {
    // A dev-proxy 502/504 — or a 500 with no JSON body — means nothing was
    // listening on the WhatsApp port, not that the request itself failed.
    const proxyFailed =
      res.status === 502 || res.status === 504 || (res.status === 500 && !(body as { error?: string }).error);

    if (proxyFailed) {
      throw new WhatsAppError(unreachableMessage, 'SERVER_UNREACHABLE');
    }

    throw new WhatsAppError(
      (body as { error?: string }).error || `अनुरोध विफल (${res.status})`,
      (body as { code?: string }).code || 'ERROR',
    );
  }

  return body as T;
}

/** Effective server-side config, as reported by the running server. */
export interface WhatsAppSettings {
  countryCode: string;
  defaultPhone: string | null;
  businessName: string;
  minGapMs: number;
  authDir: string;
  tokenRequired: boolean;
}

export const getWhatsAppStatus = () => request<WhatsAppStatus>('/status');

export const getWhatsAppSettings = () => request<WhatsAppSettings>('/settings');

/** Send a test message to confirm the link works end to end. */
export const sendWhatsAppTest = (phone?: string) =>
  request<SendReceiptResult>('/test', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  });

export const connectWhatsApp = () => request<WhatsAppStatus>('/connect', { method: 'POST' });

export const logoutWhatsApp = () => request<WhatsAppStatus>('/logout', { method: 'POST' });

export const sendWhatsAppReceipt = (payload: SendReceiptPayload) =>
  request<SendReceiptResult>('/send-receipt', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

/** Strip a data-URL prefix so a generated PDF can be posted as raw base64. */
export const toBase64Pdf = (dataUrl: string) =>
  dataUrl.replace(/^data:application\/pdf(;[^,]*)?,/, '');
