---
sidebar_position: 1
---

# Architecture Overview

## Stack

- **Vite + React 19**
- **Tailwind CSS v4** (via `@tailwindcss/vite`, no separate PostCSS config)
- **shadcn/ui** (Nova preset, Radix primitives) — component library, generated into `src/components/ui/`
- **@tanstack/react-query** — all server data fetching
- **react-router-dom** — client-side routing
- **better-auth/react** — the auth client (see [Auth & Data Fetching](./auth-and-data-fetching.md))

This is a plain SPA talking to the `backend/` API over HTTP — no server-side rendering, no meta-framework.

## Folder structure

```
admin-frontend/src/
  main.jsx                Entry point
  App.jsx                  Providers + route table
  index.css                 Design tokens, Tailwind import, global styles
  lib/
    auth-client.js           Better Auth React client instance
    api.js                    fetch wrapper for /api/admin/* + query functions
    query-client.js          React Query client instance
    utils.js                  shadcn's cn() helper
    chart-theme.js            Shared colors/tooltip/axis style for every chart
  context/
    AuthContext.jsx           Thin wrapper around authClient.useSession()
  components/
    ProtectedRoute.jsx         Redirects to /login if not authenticated
    DashboardLayout.jsx        Sidebar + header shell for authenticated routes
    AppSidebar.jsx              Categorized nav (Overview / Survey Data groups)
    ResponsesTable.jsx           The responses data table
    ResponseDetailSheet.jsx       Slide-over panel: full record + transcript
    WhatsAppTranscript.jsx        WhatsApp-style chat bubble transcript renderer
    StatCard.jsx / StatusBadge.jsx  Small reusable display components
    charts/                       One component per dashboard chart (see below)
    ui/                          shadcn-generated primitives (button, table, sidebar, sheet, ...)
  pages/
    LoginPage.jsx               Split-screen login (form + branded photo panel)
    OverviewPage.jsx             Dashboard home — stat cards + all analytics charts
    ResponsesPage.jsx             Paginated responses table page
```

## Routing (`App.jsx`)

```js title="admin-frontend/src/App.jsx"
<Routes>
  <Route path="/login" element={<LoginPage />} />
  <Route
    element={
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    }
  >
    <Route index element={<OverviewPage />} />
    <Route path="responses" element={<ResponsesPage />} />
  </Route>
</Routes>
```

`DashboardLayout` renders the sidebar shell once and an `<Outlet />` for whichever child route is active — both `/` and `/responses` share the same sidebar/header without re-mounting it.

## Sidebar navigation pattern

`AppSidebar.jsx` uses shadcn's `Sidebar` primitive with grouped sections (`SidebarGroup` / `SidebarGroupLabel`), not a flat link list — "Overview" contains the Dashboard link, "Survey Data" contains Responses. Active-state detection is done explicitly with `useLocation()` rather than relying on `NavLink`'s function-as-`className` prop:

```js title="admin-frontend/src/components/AppSidebar.jsx"
const isActive = item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to);
```

**Why not `<NavLink className={({isActive}) => ...}>`:** `SidebarMenuButton` uses `asChild` (Radix `Slot`) to merge its own classes onto the `NavLink` it wraps. Radix's `Slot` merge expects `className` to be a plain string; when `NavLink`'s `className` is a function (its normal render-prop API), the merge silently fails to apply it, so neither the active-state styling nor a safe text color ever actually renders — the bug briefly showed as sidebar links rendering in real state indistinguishable, washed-out text. Computing `isActive` up front in plain JS and passing a plain string avoids the Slot/function-prop interaction entirely.

## Response detail: WhatsApp-style transcript

`ResponseDetailSheet.jsx` opens a `Sheet` on row click, showing the respondent's full record plus `WhatsAppTranscript.jsx` — a deliberately literal recreation of a WhatsApp chat screen (dark header bar, wallpaper-colored chat background, green bubbles for the respondent's own messages on the right with delivery ticks, white bubbles for the bot's replies on the left), built from the same `conversationLogs` array the [admin API](../api-reference/admin-api.md) returns. This is presentation-only — it doesn't re-fetch or transform the data beyond formatting timestamps.

**Shared locations render as an actual map, not raw coordinates.** `webhook.js` logs a location message as the literal text `"12.9716,77.5946"` (see [Webhook API](../api-reference/webhook-api.md)) — `WhatsAppTranscript.jsx` detects that exact `lat,lng` shape with a regex and swaps the bubble for a small stitched map image instead of showing the raw string. There's no Google Maps API key involved: it fetches a 2×2 grid of tiles directly from OpenStreetMap's standard tile server (`tile.openstreetmap.org`), computed with the Slippy Map pixel-math formula, and crops/positions them so the shared point sits exactly under a pin drawn in the center — a 2×2 tile grid is always enough to cover the fixed 220×140 thumbnail regardless of where the point falls within its home tile. Clicking the thumbnail opens the precise location in Google Maps in a new tab (`google.com/maps?q=lat,lng`), so the OSM tiles only need to be "close enough to recognize," not pixel-accurate.

## Analytics charts

The Overview page's charts (response volume, completion funnel, station/mode popularity, time-of-day, ...) are documented separately — see [Analytics Dashboard](./analytics-dashboard.md) for the chart component architecture and two non-obvious backend bugs their data uncovered.
