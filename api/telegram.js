// api/telegram.js
// Vercel Serverless Function to control Fly.io WhatsApp machine via Telegram Bot

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ALLOWED_USER_ID = process.env.TELEGRAM_ALLOWED_USER_ID;
const FLY_API_TOKEN = process.env.FLY_API_TOKEN;
const FLY_APP_NAME = process.env.FLY_APP_NAME || 'team-sps-whatsapp';
const FLY_MACHINE_ID = process.env.FLY_MACHINE_ID || 'e8207e7a257748';

const FLY_API_BASE = `https://api.machines.dev/v1/apps/${FLY_APP_NAME}/machines/${FLY_MACHINE_ID}`;

async function sendTelegram(method, payload) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${method}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

async function getFlyStatus() {
  const res = await fetch(FLY_API_BASE, {
    headers: {
      Authorization: `Bearer ${FLY_API_TOKEN}`,
    },
  });
  if (!res.ok) {
    throw new Error(`Fly API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

async function runFlyAction(action) {
  if (action === 'status') {
    return getFlyStatus();
  }

  const endpoint = `${FLY_API_BASE}/${action}`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${FLY_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to ${action}: ${res.status} ${text}`);
  }

  // Brief pause to allow state transition, then fetch updated status
  await new Promise((resolve) => setTimeout(resolve, 1500));
  return getFlyStatus();
}

function buildDashboard(machineData, notice = '') {
  const state = machineData?.state || 'unknown';
  const stateEmoji = state === 'started' ? '🟢' : state === 'stopped' ? '🔴' : '🟡';
  const timeStr = new Date().toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const check = machineData?.checks?.[0];
  const healthStatus = check ? `${check.status === 'passing' ? '✅' : '⚠️'} ${check.status}` : 'N/A';

  let text = `⚡ *Fly.io WhatsApp Controller*\n\n`;
  if (notice) {
    text += `${notice}\n\n`;
  }
  text += `📦 *App:* \`${FLY_APP_NAME}\`\n`;
  text += `🖥️ *Machine:* \`${FLY_MACHINE_ID}\`\n`;
  text += `📊 *State:* ${stateEmoji} *${state.toUpperCase()}*\n`;
  text += `🩺 *Health:* ${healthStatus}\n`;
  text += `🕒 *Time:* ${timeStr} IST\n`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: '▶️ Start Server', callback_data: 'start' },
        { text: '⏹️ Stop Server', callback_data: 'stop' },
      ],
      [
        { text: '🔄 Restart', callback_data: 'restart' },
        { text: '📊 Refresh Status', callback_data: 'status' },
      ],
    ],
  };

  return { text, reply_markup: keyboard };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).json({ ok: true, message: 'Telegram Webhook is alive.' });
  }

  if (!TELEGRAM_BOT_TOKEN || !FLY_API_TOKEN) {
    return res.status(500).json({ error: 'Missing TELEGRAM_BOT_TOKEN or FLY_API_TOKEN in environment.' });
  }

  const update = req.body || {};
  const message = update.message;
  const callbackQuery = update.callback_query;

  const fromUser = message?.from || callbackQuery?.from;
  const chatId = message?.chat?.id || callbackQuery?.message?.chat?.id;
  const messageId = callbackQuery?.message?.message_id;

  if (!chatId) {
    return res.status(200).send('No chat ID');
  }

  // Security check: restrict access to authorized user ID
  if (ALLOWED_USER_ID && String(fromUser?.id) !== String(ALLOWED_USER_ID)) {
    await sendTelegram('sendMessage', {
      chat_id: chatId,
      text: `⛔ *Access Denied*\nYour Telegram ID (\`${fromUser?.id}\`) is not authorized to control this server.`,
      parse_mode: 'Markdown',
    });
    return res.status(200).send('Unauthorized');
  }

  try {
    if (callbackQuery) {
      const action = callbackQuery.data;
      await sendTelegram('answerCallbackQuery', {
        callback_query_id: callbackQuery.id,
        text: `Executing ${action}...`,
      });

      let notice = '';
      if (action === 'start') notice = '🚀 *Start command sent.*';
      else if (action === 'stop') notice = '🛑 *Stop command sent.*';
      else if (action === 'restart') notice = '🔄 *Restart command sent.*';
      else if (action === 'status') notice = '🔄 *Status refreshed.*';

      const machineData = await runFlyAction(action);
      const dashboard = buildDashboard(machineData, notice);

      await sendTelegram('editMessageText', {
        chat_id: chatId,
        message_id: messageId,
        text: dashboard.text,
        parse_mode: 'Markdown',
        reply_markup: dashboard.reply_markup,
      });

      return res.status(200).json({ ok: true });
    }

    if (message) {
      const text = (message.text || '').trim().toLowerCase();
      let action = 'status';
      let notice = '';

      if (text.startsWith('/start_server') || text === 'start') {
        action = 'start';
        notice = '🚀 *Start command initiated.*';
      } else if (text.startsWith('/stop_server') || text === 'stop') {
        action = 'stop';
        notice = '🛑 *Stop command initiated.*';
      } else if (text.startsWith('/restart') || text === 'restart') {
        action = 'restart';
        notice = '🔄 *Restart command initiated.*';
      }

      const machineData = await runFlyAction(action);
      const dashboard = buildDashboard(machineData, notice);

      await sendTelegram('sendMessage', {
        chat_id: chatId,
        text: dashboard.text,
        parse_mode: 'Markdown',
        reply_markup: dashboard.reply_markup,
      });

      return res.status(200).json({ ok: true });
    }
  } catch (err) {
    console.error('Telegram bot error:', err);
    await sendTelegram('sendMessage', {
      chat_id: chatId,
      text: `❌ *Error executing request:*\n\`${err.message || String(err)}\``,
      parse_mode: 'Markdown',
    });
  }

  return res.status(200).json({ ok: true });
}
