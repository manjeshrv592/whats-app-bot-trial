---
sidebar_position: 1
---

# Getting Started

## What this repo is

A WhatsApp chatbot that runs the "Namma Transit" last-mile commuter survey (built on the WhatsApp Cloud API), plus an internal admin dashboard for viewing the responses it collects.

## Repo layout

```
whats-app-bot-trial/
  backend/          Express + Prisma + Postgres — the WhatsApp bot and admin API
  admin-frontend/   React + Vite + shadcn/ui — the dashboard that reads survey data
  docs/             This documentation site (Docusaurus)
```

Each folder is its own independent npm project with its own `package.json`, `node_modules`, and dev server. Nothing is a monorepo workspace — you `cd` into a folder and run its scripts directly.

| App | Dev command | Default port |
|---|---|---|
| `backend/` | `npm run dev` | 3000 |
| `admin-frontend/` | `npm run dev` | 5173 |
| `docs/` | `npm start` | 3100 |

## Prerequisites

- Node.js 20+
- A local PostgreSQL server
- A Meta developer account with a WhatsApp Cloud API test app (for the bot to actually send/receive messages)
- [ngrok](https://ngrok.com) (or similar) to tunnel your local server to a public HTTPS URL, since Meta's webhook needs to reach your machine

## 1. Backend setup

```bash
cd backend
npm install
```

Copy `.env.example` to `.env` and fill in every value. Here's what each one is for:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `WHATSAPP_TOKEN` | Meta Graph API access token (temporary tokens from the "Try it out" flow expire roughly daily — see [Known Limitations](./known-limitations.md)) |
| `WHATSAPP_PHONE_NUMBER_ID` | The WhatsApp Business phone number ID from the Meta dashboard |
| `WHATSAPP_VERIFY_TOKEN` | A string you choose yourself; Meta echoes it back during webhook verification |
| `WHATSAPP_WA_LINK_NUMBER` | The actual WhatsApp number in international format (no `+`), used to build the `wa.me` QR code link |
| `WHATSAPP_WA_LINK_TEXT` | The pre-filled message the QR code opens WhatsApp with (default `Hi`, which triggers the bot's greeting) |
| `ALLOW_MULTIPLE_SUBMISSIONS` | `true`/`false` (default `false`). When `true`, a respondent who already completed (or cancelled) gets a fresh survey on their next message instead of "you've already completed it" — see [Known Limitations](./known-limitations.md) |
| `PORT` | Express server port (default `3000`) |
| `BETTER_AUTH_SECRET` | Random secret Better Auth uses to sign sessions — generate with `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `BETTER_AUTH_URL` | The backend's own base URL (`http://localhost:3000` locally) |
| `ADMIN_FRONTEND_URL` | The dashboard's origin, used for CORS + Better Auth's `trustedOrigins` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Credentials for the one seeded admin account (see [Authentication](./backend/authentication.md)) |

Then run the database migrations and seed the admin account:

```bash
npx prisma migrate dev
npx prisma generate
node scripts/seed-admin.js
npm run dev
```

## 2. Expose the webhook publicly

Meta needs a public HTTPS URL to send webhook events to. With the backend running on port 3000:

```bash
ngrok http 3000
```

Take the `https://...ngrok-free.dev` URL it gives you and register it in the Meta dashboard under **WhatsApp → Configuration → Webhook**:

- **Callback URL:** `https://<your-ngrok-url>/webhook`
- **Verify token:** whatever you set as `WHATSAPP_VERIFY_TOKEN`

You also need to subscribe your app to the WhatsApp Business Account's events (this is separate from the app-level webhook config):

```bash
curl -X POST "https://graph.facebook.com/v20.0/<WABA_ID>/subscribed_apps" \
  -H "Authorization: Bearer <WHATSAPP_TOKEN>"
```

## 3. Generate the QR code

A branded, scannable QR card (pointing at the `wa.me` link) can be generated anytime:

```bash
npm run qr
```

This writes `backend/qr-code.png` — a click-to-chat card that opens WhatsApp with the greeting pre-filled, immediately starting the survey.

### Optional: seed a realistic dataset for the dashboard

A handful of real responses makes every chart on the admin dashboard look flat. Two scripts bulk-insert synthetic data instead (wiping `ConversationLog`/`Session`/`User` first, leaving `AdminUser` login data untouched):

```bash
node scripts/seed-test-data.js       # ~45 rows, a few WhatsApp-style transcripts — quick UI smoke test
node scripts/seed-large-dataset.js   # thousands of rows over a 6-month span, with real-looking
                                      # growth/weekday/commute-hour/station-popularity patterns
```

See [Analytics Dashboard](./frontend/analytics-dashboard.md) for what the dashboard does with this data.

## 4. Admin frontend setup

```bash
cd admin-frontend
npm install
```

Copy `.env.example` to `.env` — it just needs `VITE_API_URL` pointing at the backend (`http://localhost:3000` locally).

```bash
npm run dev
```

Open `http://localhost:5173`, sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from the backend's `.env`.

## 5. This documentation site

```bash
cd docs
npm install
npm start
```

Opens at `http://localhost:3100`.
