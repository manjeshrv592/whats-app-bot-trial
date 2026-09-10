---
sidebar_position: 3
---

# Admin Data API

`backend/src/routes/adminData.js`, mounted at `/api/admin`. Every route here is behind [`requireAdmin`](../backend/authentication.md) — no cookie, no data.

```json title="GET /api/admin/responses with no session cookie"
// 401
{ "error": "Unauthorized" }
```

## `GET /api/admin/stats`

Aggregate counts for the dashboard's four stat cards, computed with `prisma.user.count()` and `prisma.session.groupBy()` — actual database aggregates, not a count of whatever page of `/responses` happens to be loaded (see [Analytics Dashboard](../frontend/analytics-dashboard.md) for why that distinction mattered in practice).

**Response** — real example, captured from a seeded dataset of ~8,700 responses:

```json
{
  "total": 8727,
  "completed": 6830,
  "inProgress": 895,
  "declined": 1002,
  "notStarted": 0
}
```

`notStarted` is `total` minus every `User` row that has a `Session` at all — in practice always `0`, since a `Session` is created on a respondent's very first message (see [Conversation Engine](../backend/conversation-engine.md)), but computed rather than assumed in case that ever changes.

## `GET /api/admin/analytics`

Six pre-aggregated datasets, one per chart on the Overview dashboard. All computed in `backend/src/services/analytics.js` — see [Analytics Dashboard](../frontend/analytics-dashboard.md) for the two non-obvious things this endpoint handles: merging bilingual (English/Kannada) answers onto one label, and correcting a timezone offset in the time-bucketed fields.

**Response shape**, with a real example for each field:

```json
{
  "daily": [
    { "day": "2026-03-15", "count": 12 },
    { "day": "2026-03-16", "count": 24 }
  ],
  "stations": [
    { "label": "Whitefield (Kadugodi)", "count": 1910 },
    { "label": "Majestic (KSR)", "count": 1655 }
  ],
  "modes": [
    { "label": "Walk", "feeder": 1513, "distribution": 1524 },
    { "label": "Auto-rickshaw", "feeder": 1388, "distribution": 1345 }
  ],
  "frequency": [
    { "label": "Daily", "count": 3429 },
    { "label": "Few times a week", "count": 2361 }
  ],
  "hours": [
    { "hour": 0, "count": 0 },
    { "hour": 8, "count": 3830 },
    { "hour": 18, "count": 2187 }
  ],
  "weekday": [
    { "day": "Mon", "count": 1496 },
    { "day": "Sat", "count": 671 }
  ]
}
```

- `daily` — every calendar day that has at least one response, oldest first (not zero-filled for gap days).
- `stations` — top 8 only, English/Kannada answers for the same station already merged.
- `modes` — `feeder` (home → nearest station) vs. `distribution` (station → final destination), for every mode either was ever answered with.
- `hours` — always all 24 entries, `0`-filled for hours with no responses (unlike `daily`).
- `weekday` — always all 7 entries, ordered Monday → Sunday.

## `GET /api/admin/responses`

Paginated list of every survey respondent, newest first.

**Query params:** `page` (default `1`), `pageSize` (default `25`, capped at `100`)

**Response** — real example captured from a local run with two completed responses (one English, one Kannada):

```json
{
  "responses": [
    {
      "id": 9,
      "phoneNumber": "919731400613",
      "language": "kn",
      "consented": true,
      "name": "Manjesh",
      "travelFrequency": "ವಾರಕ್ಕೆ ಕೆಲವು ಬಾರಿ",
      "homeArea": "Hemandanahalli",
      "originLat": 12.9930073,
      "originLng": 77.6621704,
      "nearestStation": "ಎಂಜಿ ರೋಡ್",
      "feederMode": "ಸ್ವಂತ ವಾಹನ",
      "destinationStation": "ಬಾಯಪ್ಪನಹಳ್ಳಿ",
      "distributionMode": "ಸ್ವಂತ ವಾಹನ",
      "destinationArea": "Whitefield",
      "destLat": 12.9930067,
      "destLng": 77.6621831,
      "email": "manjeshrv53@gmail.com",
      "smartCardNumber": "1234567890",
      "createdAt": "2026-09-08T10:33:38.939Z",
      "updatedAt": "2026-09-08T10:36:51.185Z",
      "status": "COMPLETED"
    },
    {
      "id": 8,
      "phoneNumber": "916302409485",
      "language": "en",
      "name": "Pavan",
      "travelFrequency": "Daily",
      "nearestStation": "Baiyappanahalli",
      "destinationStation": "Whitefield (Kadugodi)",
      "status": "COMPLETED"
    }
  ],
  "total": 2,
  "page": 1,
  "pageSize": 25
}
```

Note the saved values are the **human-readable option titles** in whichever language the respondent chose (e.g. `"ಎಂಜಿ ರೋಡ್"` for MG Road), not internal ids like `"MG_ROAD"` — that's what `conversation.js` stores (see [Conversation Engine](../backend/conversation-engine.md)).

`status` is derived, not a stored column — computed from the respondent's `Session.currentStep`:

```js title="backend/src/routes/adminData.js"
function deriveStatus(currentStep) {
  if (currentStep === "DONE") return "COMPLETED";
  if (currentStep === "CANCELLED") return "DECLINED";
  if (!currentStep) return "NOT_STARTED";
  return "IN_PROGRESS";
}
```

## `GET /api/admin/responses/:phoneNumber`

One respondent's full record, plus their complete message-by-message transcript.

```json title="Response shape"
{
  "id": 9,
  "phoneNumber": "919731400613",
  "...": "all User fields, same as the list endpoint",
  "status": "COMPLETED",
  "conversationLogs": [
    { "id": 1, "phoneNumber": "919731400613", "direction": "in", "messageText": "Hi", "createdAt": "2026-09-08T10:33:38.129Z" },
    { "id": 2, "phoneNumber": "919731400613", "direction": "out", "messageText": "Welcome! What's your name?", "createdAt": "2026-09-08T10:33:38.939Z" }
  ]
}
```

`404` with `{ "error": "Not found" }` if the phone number doesn't exist. `conversationLogs` is ordered oldest-first (`createdAt: "asc"`) — this exact shape is what powers the dashboard's WhatsApp-style transcript view (see [Frontend Overview](../frontend/overview.md)).
