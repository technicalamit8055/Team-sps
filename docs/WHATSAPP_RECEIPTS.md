# WhatsApp Receipts (Baileys)

Sends donation/payment receipts straight to WhatsApp using
[`@whiskeysockets/baileys`](https://github.com/WhiskeySockets/Baileys) — no Twilio,
no paid gateway. It pairs with a regular WhatsApp account through the
**Linked Devices** QR flow, exactly like WhatsApp Web.

## Why a separate server

Baileys holds a **persistent WebSocket** and writes session files to disk. That
cannot run in a Vercel serverless function (no long-lived process, ephemeral
filesystem). So the API lives in `server/` and runs as its own Node process.

```
browser ──/api/whatsapp/*──► Vite dev proxy ──► server/index.js ──► WhatsApp
                                                (Baileys socket)
```

## Setup

```bash
npm install
cp .env.example .env      # fill in the WHATSAPP_* values you need
npm run dev:all           # runs Vite (8080) + the WhatsApp server (8787)
```

Run them separately if you prefer: `npm run dev` and `npm run server`.

### Pairing

1. Open **Master OS → Integrations** (or **Settings** → *व्हाट्सएप रसीद कनेक्शन*).
2. Click **WhatsApp जोड़ें** — a QR appears.
3. On your phone: WhatsApp → **Settings → Linked Devices → Link a device** → scan.

The session is saved to `whatsapp_auth/` and restored automatically on every
later server start, so you only scan once. That directory is gitignored —
**never commit it**; it grants full send access to the linked account.

## When receipts go out

There are three send paths in the app, all sharing the same receipt text from
[`src/lib/samitiReceipt.ts`](../src/lib/samitiReceipt.ts):

| Path | Trigger |
| --- | --- |
| **Automatic** | Saving a new entry in the quick donation dialog |
| One-tap | The send button on a row in the donation grid |
| Manual | *सीधे भेजें* / *व्हाट्सएप खोलें* in the receipt modal |

The quick donation dialog has an **auto-send toggle** (on by default). With it
on, saving a new entry immediately sends the receipt to the donor's saved
number in the background — the dialog closes right away so the collector can
carry on entering. A toast reports progress and the result.

The receipt modal opens as a fallback, never as the happy path: when the donor
has no usable 10-digit number, or when the automatic send fails (no linked
session, server down, number not on WhatsApp). From there the number can be
corrected and the receipt resent, or sent by hand through `wa.me`.

Editing an existing entry never sends anything — only new entries do.

## Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `WHATSAPP_SERVER_PORT` | `8787` | Port for the API server |
| `WHATSAPP_AUTH_DIR` | `./whatsapp_auth` | Where session credentials live |
| `WHATSAPP_COUNTRY_CODE` | `91` | Prepended to numbers of 10 digits or fewer |
| `WHATSAPP_DEFAULT_PHONE` | — | Fallback recipient when a request omits `phone` |
| `WHATSAPP_BUSINESS_NAME` | `श्री दुर्गा पूजा समिति` | Default name in the receipt footer |
| `WHATSAPP_MIN_GAP_MS` | `2500` | Minimum gap between two sends (anti-ban) |
| `WHATSAPP_MAX_RECONNECT` | `6` | Consecutive failures before creds are wiped |
| `WHATSAPP_API_TOKEN` | — | If set, callers must send `x-whatsapp-token` |
| `WHATSAPP_ALLOWED_ORIGINS` | all | Comma-separated CORS allowlist |
| `VITE_WHATSAPP_API_URL` | — | Leave blank in dev (the proxy handles it) |

## API

| Method | Endpoint | Returns |
| --- | --- | --- |
| `GET` | `/api/whatsapp/status` | `{ state, connected, qr, error, user, hasSession }` |
| `POST` | `/api/whatsapp/connect` | Same shape, with `qr` as a PNG data URL |
| `POST` | `/api/whatsapp/logout` | Unlinks the device and deletes the session |
| `POST` | `/api/whatsapp/send-receipt` | `{ ok, jid, messageId, withPdf }` |
| `GET` | `/api/whatsapp/settings` | Effective server config (read-only) |
| `POST` | `/api/whatsapp/test` | Sends a short test message |

`state` is one of `closed` → `connecting` → `qr` → `open`.

### Sending a receipt

```bash
curl -X POST http://localhost:8787/api/whatsapp/send-receipt \
  -H 'Content-Type: application/json' \
  -d '{
    "phone": "9835012345",
    "customerName": "Ramesh Kumar",
    "amount": 2500,
    "receiptNo": "0042",
    "itemName": "दुर्गा पूजा चंदा",
    "date": "12/09/2026",
    "businessName": "श्री दुर्गा पूजा समिति"
  }'
```

Every field except `amount` is optional. Omit `phone` to fall back to
`WHATSAPP_DEFAULT_PHONE`. Pass `pdfBuffer` (base64, with or without the
`data:application/pdf;base64,` prefix) to send the receipt as a PDF document
with the text as its caption.

From the frontend, use the typed client in [`src/lib/whatsapp.ts`](../src/lib/whatsapp.ts):

```ts
import { sendWhatsAppReceipt } from '@/lib/whatsapp';
await sendWhatsAppReceipt({ phone, customerName, amount, receiptNo });
```

### Error codes

Failures return `{ ok: false, code, error }` with a matching HTTP status:

| Code | Status | Meaning |
| --- | --- | --- |
| `NOT_CONNECTED` | 409 | No linked session — scan the QR first |
| `INVALID_PHONE` | 400 | Number could not be normalized |
| `NO_RECIPIENT` | 400 | No `phone` and no `WHATSAPP_DEFAULT_PHONE` |
| `NOT_ON_WHATSAPP` | 422 | Number is not registered on WhatsApp |
| `SERVER_UNREACHABLE` | — | Client-side: the server isn't running |

## Phone normalization

Input is stripped to digits, `00` international prefixes and leading trunk
zeros are removed, and `WHATSAPP_COUNTRY_CODE` is prepended when the result is
10 digits or fewer. Anything outside 8–15 digits is rejected.

```
"+91 98350-12345" → 919835012345      "9835012345"   → 919835012345
"098350 12345"    → 919835012345      "+1 415 555 2671" → 14155552671
```

The result becomes a JID: `919835012345@s.whatsapp.net`.

## Anti-ban behaviour

This drives an ordinary WhatsApp account, not the Business API, so it is
rate-limited deliberately:

- **Sequential queue** — sends never run in parallel, with a **2.5 s minimum
  gap** between consecutive messages.
- **Recipient check** — `sock.onWhatsApp()` confirms the number is registered
  before sending, so unregistered numbers never produce a send attempt.
- **Not marked online** — `markOnlineOnConnect: false` keeps the footprint small.

Blasting large volumes can still get a number banned. Keep to real receipts
sent to people who expect them.

## Deployment note

The SPA deploys to Vercel, but **this server does not** — it needs a persistent
process and a writable disk (a small VPS, Railway, Fly.io, or an always-on
machine at the office). Point `VITE_WHATSAPP_API_URL` at it, set
`WHATSAPP_API_TOKEN` plus `WHATSAPP_ALLOWED_ORIGINS`, and add the host to the
`connect-src` directive in [`vercel.json`](../vercel.json) so the CSP allows it.
