---
sidebar_position: 2
---

# Auth & Data Fetching

## Auth: `AuthContext` wraps Better Auth's own hook

```js title="admin-frontend/src/context/AuthContext.jsx"
export function AuthProvider({ children }) {
  const { data: session, isPending } = authClient.useSession();

  const value = {
    session: session?.session ?? null,
    user: session?.user ?? null,
    isPending,
    signIn: (email, password) => authClient.signIn.email({ email, password }),
    signOut: () => authClient.signOut(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
```

`authClient` (from `lib/auth-client.js`) is Better Auth's React client:

```js title="admin-frontend/src/lib/auth-client.js"
export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
});
```

`authClient.useSession()` already does the reactive session-state work (it's backed by Better Auth's own store) — `AuthContext` doesn't duplicate that logic, it just re-shapes the return value into a slightly friendlier `{ session, user, isPending, signIn, signOut }` object so components don't need to know Better Auth's exact API surface.

`ProtectedRoute.jsx` is the only consumer that gates on this:

```js title="admin-frontend/src/components/ProtectedRoute.jsx"
if (isPending) return <Loading />;
if (!user) return <Navigate to="/login" replace />;
return children;
```

## Data fetching: React Query + a thin `fetch` wrapper

`lib/api.js` is not a generic HTTP client — it's specifically the two admin endpoints the dashboard needs, each returning a `Promise` that React Query hooks wrap directly:

```js title="admin-frontend/src/lib/api.js"
async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",   // <-- required: sends the Better Auth session cookie cross-origin
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed with status ${res.status}`);
  }
  return res.json();
}

export function fetchResponses({ page = 1, pageSize = 25 } = {}) {
  return apiFetch(`/api/admin/responses?page=${page}&pageSize=${pageSize}`);
}

export function fetchResponseDetail(phoneNumber) {
  return apiFetch(`/api/admin/responses/${encodeURIComponent(phoneNumber)}`);
}
```

`credentials: "include"` is the part that's easy to forget and breaks everything silently if missing — without it, the browser won't attach the `HttpOnly` session cookie to a cross-origin request (backend `:3000`, frontend `:5173`), and every admin API call 401s even though the user is genuinely logged in.

### Usage pattern (every data-fetching component looks like this)

```js title="admin-frontend/src/pages/ResponsesPage.jsx (excerpt)"
const { data, isLoading, isError } = useQuery({
  queryKey: ["responses", page],
  queryFn: () => fetchResponses({ page, pageSize: PAGE_SIZE }),
});
```

`OverviewPage.jsx`'s stat counts are **not** a separate backend aggregate endpoint — they're computed client-side from a `fetchResponses({ page: 1, pageSize: 1000 })` call under a distinct query key (`["responses", "overview"]`), a deliberate simplification appropriate at the current data scale rather than building a dedicated `/stats` endpoint for four numbers.

`ResponseDetailSheet.jsx` fetches lazily — the detail query is `enabled: !!phoneNumber`, so it only fires once a row is actually clicked, keyed by `["response", phoneNumber]` so React Query caches each respondent's detail independently.
