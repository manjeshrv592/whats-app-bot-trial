---
sidebar_position: 3
---

# Admin Authentication (Better Auth)

The WhatsApp bot side has no authentication — anyone who messages the number can take the survey, by design. The **admin dashboard** is the only thing gated, using [Better Auth](https://www.better-auth.com/) with email/password sign-in.

## The model-name collision, and why config looks the way it does

Before Better Auth was added, the schema already had models named `User` and `Session` — survey respondents and their conversation state, nothing to do with admin login. Better Auth's Prisma adapter wants to own models literally named `User`, `Session`, `Account`, `Verification` by default. Colliding these would have been a mess (two completely different concepts fighting over one table).

The fix: configure Better Auth with custom model names so its tables are distinct and additive.

```js title="backend/src/auth.js"
const { betterAuth } = require("better-auth");
const { prismaAdapter } = require("better-auth/adapters/prisma");
const prisma = require("./services/db");

const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  user: { modelName: "adminUser" },
  session: { modelName: "adminSession" },
  account: { modelName: "adminAccount" },
  verification: { modelName: "adminVerification" },
  emailAndPassword: { enabled: true },
  trustedOrigins: [process.env.ADMIN_FRONTEND_URL || "http://localhost:5173"],
});

module.exports = { auth };
```

This generates `AdminUser` / `AdminSession` / `AdminAccount` / `AdminVerification` Prisma models (see [Database Schema](../database/schema.md)) sitting alongside `users` / `sessions` / `conversation_logs`, with zero changes to any survey code.

### A real bug we hit here, worth knowing about

The `modelName` values are deliberately **lowercase-first** (`"adminUser"`, not `"adminUser"` capitalized as `"AdminUser"`). This isn't a style choice — it works around an actual bug in this version of Better Auth's schema-consistency check.

Internally, Better Auth compares an *expected* table name (taken verbatim from your `modelName` config) against the *actual* table name it reads off the generated Prisma client (which it derives by lowercasing the first letter of the real Prisma model name — i.e. how Prisma exposes it as a client property, like `prisma.adminUser`). If you configure `modelName: "AdminUser"` (capital A), the expected side stays `"AdminUser"` while the actual side comes out `"adminUser"` — they never match, and every request throws `SchemaMismatchError` even though the database is completely correct. Using a lowercase-first `modelName` sidesteps the mismatch, because both sides land on the same string. The Prisma model itself still gets generated with a proper capitalized name (`model AdminUser { ... }`) — only the config value's casing matters here.

If you ever bump the Better Auth version, it's worth re-checking whether this is still necessary.

## Generating and migrating the schema

Better Auth ships a CLI that writes its models straight into `schema.prisma`:

```bash
npx @better-auth/cli generate -y
npx prisma migrate dev --name add_admin_auth
npx prisma generate
```

It only *adds* to the schema file — it doesn't touch the existing `User`/`Session`/`ConversationLog` models.

## Seeding the one admin account

There's no signup UI. Exactly one admin account exists, and it's created from `.env` values by a script that calls Better Auth's own server-side signup API — not a manual database insert — so Better Auth's own password hashing is used rather than us reimplementing it:

```js title="backend/scripts/seed-admin.js (core logic)"
const existing = await prisma.adminUser.findUnique({ where: { email } });
if (existing) {
  console.log(`Admin account already exists for ${email}, skipping.`);
  process.exit(0);
}

await auth.api.signUpEmail({
  body: { email, password, name: "Admin" },
});
```

Idempotent — safe to run again; it just skips if the email already exists. See [Getting Started](../getting-started.md) for when to run it.

## Protecting the admin API

```js title="backend/src/middleware/requireAdmin.js"
async function requireAdmin(req, res, next) {
  const session = await auth.api.getSession({ headers: toFetchHeaders(req.headers) });

  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  req.adminUser = session.user;
  next();
}
```

`auth.api.getSession()` expects a web-standard `Headers` object, not Express's plain header object — `toFetchHeaders()` converts it. This middleware is mounted on the whole `/api/admin` router (see [Admin API](../api-reference/admin-api.md)), so every route under it is gated the same way.

## Frontend side

The dashboard uses Better Auth's React client (`better-auth/react`'s `createAuthClient`), which handles the cookie-based session automatically via `credentials: "include"` on its own requests. See [Frontend → Auth & Data Fetching](../frontend/auth-and-data-fetching.md).
