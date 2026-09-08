---
sidebar_position: 1
---

# Architecture Overview

## Stack

- **Express 5** — HTTP server
- **Prisma 7** (with `@prisma/adapter-pg`, the driver-adapter pattern Prisma 7 requires) — ORM over Postgres
- **Better Auth** — session-based auth for the admin dashboard only (not the WhatsApp side)
- **WhatsApp Cloud API** (Meta Graph API) — the actual message transport

## Folder structure

```
backend/
  src/
    index.js              Express app entry point
    auth.js                Better Auth instance
    services/
      db.js                 Prisma client
      whatsapp.js            Graph API send helpers (text/buttons/list)
    middleware/
      requireAdmin.js        Session-check gate for admin routes
    routes/
      webhook.js              Meta-facing webhook (GET verify, POST receive)
      adminData.js            /api/admin/* — protected, used by the dashboard
    flow/
      content.js              Bilingual (EN/KN) prompt + option text
      conversation.js         The survey's step-config state machine
  prisma/
    schema.prisma
    migrations/
  scripts/
    seed-admin.js            One-time admin account seeder
    generate-qr.js           Branded QR card generator
```

## Request flow

**Incoming survey message:**

```
Meta → POST /webhook → normalizeIncomingMessage() → handleIncomingMessage()
  (src/flow/conversation.js reads/writes Prisma: User, Session, ConversationLog)
  → sendReply() → Meta Graph API (services/whatsapp.js)
```

**Admin dashboard request:**

```
Browser → GET /api/admin/responses (cookie attached)
  → requireAdmin middleware (checks Better Auth session via auth.api.getSession)
  → Prisma query → JSON response
```

## `src/index.js` — middleware order matters

```js title="backend/src/index.js"
app.use(
  cors({
    origin: process.env.ADMIN_FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

// Better Auth needs the raw request stream, so it must be mounted before express.json().
app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());

app.use("/webhook", webhookRouter);
app.use("/api/admin", adminDataRouter);
```

Two things here are load-bearing, not stylistic:

1. **Better Auth's handler is mounted *before* `express.json()`.** Better Auth reads the raw request body stream itself; if `express.json()` runs first, it consumes the stream and Better Auth gets nothing.
2. **The wildcard route is `/api/auth/*splat`, not `/api/auth/*`.** Express 5 (via path-to-regexp v6+) requires a *named* wildcard — a bare `*` throws `Missing parameter name` at startup. This tripped us up once already; if you're on Express 5 anywhere else in this codebase, remember the same rule applies.

`cors({ credentials: true })` is required because the dashboard's session lives in an HttpOnly cookie — without `credentials: true` on both the server's CORS config and the frontend's `fetch` calls, the cookie never gets sent cross-origin (backend on :3000, frontend on :5173).

## `src/services/db.js` — Prisma client

```js title="backend/src/services/db.js"
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

module.exports = prisma;
```

Prisma 7 removed the `url = env("DATABASE_URL")` line from `schema.prisma`'s `datasource` block — the connection string is no longer read automatically by the client. Instead, a driver adapter (`@prisma/adapter-pg` for Postgres) is constructed explicitly and passed into `PrismaClient`. The CLI (`prisma migrate`, `prisma generate`) still needs to know the URL too, which is why `prisma.config.ts` exists separately at the project root — it's config for the *CLI*, this file is config for the *runtime client*. They're not redundant; they serve different consumers.

Every file that talks to the database imports this same singleton — `require("../services/db")` — never a fresh `new PrismaClient()`.

## `src/services/whatsapp.js` — sending messages

Three functions, all thin wrappers over Meta's Graph API `/messages` endpoint:

- `sendTextMessage(to, body)` — plain text
- `sendButtonMessage(to, body, buttons)` — up to 3 quick-reply buttons (WhatsApp's `interactive` → `button` type)
- `sendListMessage(to, body, buttonLabel, rows)` — up to 10 selectable rows (`interactive` → `list` type)

See [API Reference → WhatsApp Webhook](../api-reference/webhook-api.md) for the exact payload shapes each one sends.
