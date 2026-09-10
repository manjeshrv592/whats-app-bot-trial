---
sidebar_position: 4
---

# Analytics Dashboard

The Overview page (`OverviewPage.jsx`) is two things stacked vertically: the four stat cards (Total / Completed / In progress / Declined), then seven charts. Both sections read from the database, not from whatever page of `/api/admin/responses` happens to be loaded — a distinction that mattered in practice, covered below.

## Two endpoints, both real aggregates

| Endpoint | Returns | Used for |
|---|---|---|
| `GET /api/admin/stats` | `{ total, completed, inProgress, declined, notStarted }` | The four stat cards, and the completion funnel chart |
| `GET /api/admin/analytics` | `{ daily, stations, modes, frequency, hours, weekday }` | The other six charts |

Both are implemented in `backend/src/services/analytics.js` as plain functions (`getStats()`, `getAnalytics()`) that the route handlers in `adminData.js` just call and return — the aggregation logic isn't inline in the route, so it's independently testable and the route file stays a thin HTTP layer.

## The bug this replaced: counting a page instead of counting the table

The stat cards originally worked by fetching `/api/admin/responses?pageSize=1000` and counting `status` values in whatever array came back — with a **43-row test dataset**, that "worked," because every row fit on one page. Two problems compounded once the dataset grew to several thousand seeded rows:

1. `pageSize` is capped at `100` server-side (`Math.min(..., 100)` in the responses route), so the "1000" the frontend asked for silently became 100.
2. The stat cards therefore showed counts from an arbitrary 100 rows, while the "Total responses" card (which *did* use `prisma.user.count()`) correctly showed the full total — so the numbers visibly didn't add up (e.g. "8726 total" next to "80 completed + 8 in progress + 12 declined").

The fix was `getStats()` doing the counting in the database — `prisma.user.count()` plus `prisma.session.groupBy({ by: ["currentStep"], _count: true })` — so it's correct regardless of dataset size, and doesn't care what page size the frontend happens to request.

## Folding Kannada answers onto their English label

A respondent's answer is saved as whichever language's option title they saw — `"MG Road"` or `"ಎಂಜಿ ರೋಡ್"` depending on `language` (see [Conversation Engine](../backend/conversation-engine.md)). Grouped raw, that's two separate bars for the same real station. `buildNormalizer()` in `analytics.js` builds a lookup from `content.js`'s `OPTION_SETS` — English and Kannada arrays are the same length and same order, so index `i` in `en` and index `i` in `kn` are always the same underlying option — and maps any label (either language) back to its English title before counting:

```js title="backend/src/services/analytics.js"
function buildNormalizer(setKey) {
  const { en, kn } = OPTION_SETS[setKey];
  const map = new Map();
  en.forEach((row, i) => {
    map.set(row.title, row.title);
    if (kn[i]) map.set(kn[i].title, row.title);
  });
  return (label) => map.get(label) || label; // free-text "Others" answers pass through
}
```

This runs for stations, travel modes, and frequency — the three fields with a fixed bilingual option set. Free-text answers (someone who picked "Others" and typed their own station name) aren't in the map, so they pass through unchanged and just don't get merged with anything.

## The timezone gotcha in the time-based charts

`users.created_at` is a Postgres `timestamp` **without** time zone. node-postgres serializes a JS `Date` into that column using the Date's **UTC** field getters, regardless of the column type or the server's local timezone — so a `Date` whose local (IST) wall-clock read 8:30am got written into the column as the literal digits `03:00:00` (8:30 − 5:30).

This only bites the queries that bucket by day/hour/weekday. Read back naively, "time of day" looked bimodal around 2–3am and 12–1pm instead of the real 8am/6pm commute peaks — a 5.5-hour shift, exactly IST's UTC offset. Rather than change the column type (a migration, for something that only matters for three read queries), the three time-bucketing queries in `getAnalytics()` add the offset back before extracting:

```sql
SELECT extract(hour from created_at + interval '5 hours 30 minutes')::int AS hour, count(*)::int AS count
FROM users GROUP BY 1 ORDER BY 1
```

Applies to the `daily` (day-string), `hours`, and `weekday` (day-of-week) queries. If this project ever needs to support users outside IST, this hardcoded offset would need to become a per-request or per-org timezone instead.

## Chart architecture

Every chart is its own component under `admin-frontend/src/components/charts/`, taking already-normalized data as a prop — no fetching, no business logic, just Recharts. They all share one visual language from `admin-frontend/src/lib/chart-theme.js`: a fixed color palette (`INDIGO`, `VIOLET`, `EMERALD`, `AMBER`, `ROSE`, `TEAL`, `SKY`, plus a `CATEGORY_COLORS` cycle for multi-slice pies), a `chartTooltipStyle`, a `chartAxisTick` style, and the `formatDayLabel()`/`formatHourLabel()` formatters — so a color or tooltip tweak happens in one file, not seven.

`ChartCard.jsx` is the shared wrapper (title + description + a shadcn `Card`) every chart renders inside, matching the rest of the dashboard's card styling.

| Component | Chart | Data field |
|---|---|---|
| `ResponseVolumeChart` | Area chart, submissions per day | `analytics.daily` |
| `CompletionFunnelChart` | Donut — completed/in progress/declined | `stats` (not `analytics`) |
| `TravelFrequencyChart` | Donut — how often respondents commute | `analytics.frequency` |
| `WeeklyPatternChart` | Bar — responses by day of week | `analytics.weekday` |
| `StationPopularityChart` | Horizontal bar, top 8 | `analytics.stations` |
| `ModeOfTravelChart` | Grouped bar — feeder vs. distribution mode | `analytics.modes` |
| `TimeOfDayChart` | Bar, 24 hourly buckets | `analytics.hours` |

`OverviewPage.jsx` runs both queries with `@tanstack/react-query` (`["stats", "overview"]` and `["analytics"]`) and composes the stat cards plus all seven chart components underneath — there's no separate Analytics route or page; everything lives on the dashboard's single Overview screen.

## Generating a realistic dataset to test against

Small hand-entered test data makes every chart look flat. `backend/scripts/seed-large-dataset.js` bulk-inserts a pattern-realistic synthetic dataset (growth trend over N days, weekday-heavy volume, bimodal commute-hour peaks, station/mode popularity skew, a consistent completion funnel) instead of pure random noise — see the comments at the top of that file for the exact distributions. `backend/scripts/seed-test-data.js` is the smaller, simpler version (a few dozen rows) for quick UI smoke-testing. Both wipe `ConversationLog`/`Session`/`User` first; neither touches the `AdminUser` login.
