---
sidebar_position: 2
---

# Admin Auth API (Better Auth)

Mounted at `/api/auth/*splat` in `backend/src/index.js` via Better Auth's own Express handler (`toNodeHandler(auth)`) — these routes aren't hand-written; Better Auth generates the whole set from the config in `src/auth.js`. Only the two actually used by the dashboard are documented in depth here; see [Authentication](../backend/authentication.md) for the config itself.

Sessions are cookie-based (`better-auth.session_token`, `HttpOnly`), not bearer tokens — the frontend never handles the token directly, the browser just sends the cookie automatically on same-site requests (`credentials: "include"` is what makes it ride along cross-origin from `:5173` to `:3000`).

## `POST /api/auth/sign-in/email`

**Request:**

```json
{
  "email": "admin@example.com",
  "password": "••••••••"
}
```

**Response** (`200`, plus a `Set-Cookie` header) — captured from an actual local run:

```
Set-Cookie: better-auth.session_token=LhzTJsrJUKaxOsmYvohtu0xnlZBa4eCc...; Max-Age=604800; Path=/; HttpOnly; SameSite=Lax
```

```json
{
  "redirect": false,
  "token": "LhzTJsrJUKaxOsmYvohtu0xnlZBa4eCc",
  "user": {
    "name": "Admin",
    "email": "admin@example.com",
    "emailVerified": false,
    "image": null,
    "createdAt": "2026-09-08T11:24:51.729Z",
    "updatedAt": "2026-09-08T11:24:51.729Z",
    "id": "oiRkeypyqtTI4EEVLaEcuXWOKzizzRNA"
  }
}
```

Wrong credentials return a non-2xx response with an `error` object instead — the frontend surfaces `error.message` directly under the password field (see [`LoginPage.jsx`](../frontend/overview.md)).

## `GET /api/auth/get-session`

Called internally by `requireAdmin` (server-side, via `auth.api.getSession()`) and by the frontend's `authClient.useSession()` hook on load. With a valid session cookie, returns:

```json
{
  "session": {
    "id": "...",
    "userId": "oiRkeypyqtTI4EEVLaEcuXWOKzizzRNA",
    "expiresAt": "2026-09-15T11:24:51.729Z"
  },
  "user": {
    "id": "oiRkeypyqtTI4EEVLaEcuXWOKzizzRNA",
    "name": "Admin",
    "email": "admin@example.com"
  }
}
```

Without a valid cookie, it returns `null` rather than an error — that's what `ProtectedRoute` checks to decide whether to redirect to `/login`.

## `POST /api/auth/sign-out`

Clears the session cookie server-side. No meaningful request body; called by the frontend's `signOut()` (exposed via `AuthContext`).
