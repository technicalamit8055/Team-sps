# WhatsApp (Baileys) receipt server — deployed to Fly.io, separate from the
# Vercel frontend. Baileys holds a long-lived WebSocket and writes session
# files to disk, so it needs a real always-on process with a persistent
# volume; it cannot run as a serverless function. See docs/WHATSAPP_RECEIPTS.md.

FROM node:22-slim

# dumb-init gives PID 1 proper signal handling, so Fly's SIGTERM on deploy or
# restart reaches Node and the WhatsApp socket closes cleanly instead of being
# killed mid-write (which can corrupt creds.json and force a QR re-scan).
RUN apt-get update \
  && apt-get install -y --no-install-recommends dumb-init \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
WORKDIR /app

# Copy manifests first so `npm ci` is cached while only server code changes.
COPY package.json package-lock.json ./

# Only the server runs here — the frontend is built by Vercel. --omit=dev
# skips Vite/React/etc, and --omit=optional skips Baileys' sharp/jimp peers,
# which are only needed for image thumbnails (we send text + PDF).
RUN npm ci --omit=dev --omit=optional --ignore-scripts \
  && npm cache clean --force

COPY server/ ./server/

# Session store. Must match WHATSAPP_AUTH_DIR and the volume mount in
# fly.toml — if it is not on the volume, every redeploy wipes the login.
RUN mkdir -p /data/whatsapp_auth

# Drop root. The volume is chowned so the session stays writable.
RUN chown -R node:node /app /data
USER node

EXPOSE 8787

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server/index.js"]
