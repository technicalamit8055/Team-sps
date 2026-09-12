/**
 * Client for the local Baileys WhatsApp server (see server/index.js).
 *
 * In dev, Vite proxies /api/whatsapp to that server. In other environments
 * point VITE_WHATSAPP_API_URL at wherever the server runs.
 */

const API_BASE = (import.meta.env.VITE_WHATSAPP_API_URL || '').replace(/\/$/, '');
const API_TOKEN = import.meta.env.VITE_WHATSAPP_API_TOKEN || '';

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

/** Shown whenever the WhatsApp server process isn't reachable. */
const SERVER_DOWN_MESSAGE =
  'WhatsApp सर्वर नहीं चल रहा है। टर्मिनल में `npm run dev:all` चलाएँ (या अलग से `npm run server`), फिर दोबारा कोशिश करें।';

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
    throw new WhatsAppError(SERVER_DOWN_MESSAGE, 'SERVER_UNREACHABLE');
  }

  const body = await res.json().catch(() => ({}) as Record<string, unknown>);

  if (!res.ok) {
    // A dev-proxy 502/504 — or a 500 with no JSON body — means nothing was
    // listening on the WhatsApp port, not that the request itself failed.
    const proxyFailed =
      res.status === 502 || res.status === 504 || (res.status === 500 && !(body as { error?: string }).error);

    if (proxyFailed) {
      throw new WhatsAppError(SERVER_DOWN_MESSAGE, 'SERVER_UNREACHABLE');
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
