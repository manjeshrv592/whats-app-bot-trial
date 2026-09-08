---
sidebar_position: 3
---

# Admin Data API

`backend/src/routes/adminData.js`, mounted at `/api/admin`. Every route here is behind [`requireAdmin`](../backend/authentication.md) — no cookie, no data.

```json title="GET /api/admin/responses with no session cookie"
// 401
{ "error": "Unauthorized" }
```

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
