---
sidebar_position: 1
---

# WhatsApp Webhook

`backend/src/routes/webhook.js`, mounted at `/webhook`. This is the only part of the API that Meta itself calls — not the frontend, not a developer's browser.

## `GET /webhook` — verification handshake

Meta calls this exactly once, when you register (or re-verify) the webhook URL in the dashboard.

**Request** (query string, sent by Meta):

```
GET /webhook?hub.mode=subscribe&hub.verify_token=trial_verify_token_123&hub.challenge=1234567
```

**Response:** if `hub.mode === "subscribe"` and `hub.verify_token` matches `WHATSAPP_VERIFY_TOKEN`, respond `200` with the raw challenge string as the body (not JSON). Otherwise `403`.

```js title="backend/src/routes/webhook.js"
router.get("/", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});
```

## `POST /webhook` — incoming messages

Meta calls this every time a message arrives for the subscribed WhatsApp Business Account. The route **acks immediately** (`res.sendStatus(200)`) before doing any work — Meta retries aggressively if it doesn't get a fast 200, and processing happens after the response is already sent.

### Request body shapes (from Meta)

**Free text:**

```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "<WABA_ID>",
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "metadata": { "display_phone_number": "15552035939", "phone_number_id": "1379406498577906" },
        "contacts": [{ "profile": { "name": "Ramesh" }, "wa_id": "919731400613" }],
        "messages": [{
          "from": "919731400613",
          "id": "wamid.xxx",
          "timestamp": "1234567890",
          "type": "text",
          "text": { "body": "Hi" }
        }]
      },
      "field": "messages"
    }]
  }]
}
```

**Button/list reply** (`interactive` type — the `messages[0]` entry differs):

```json
{
  "type": "interactive",
  "interactive": {
    "type": "list_reply",
    "list_reply": { "id": "MG_ROAD", "title": "MG Road" }
  }
}
```

or for a quick-reply button, `interactive.button_reply` instead of `list_reply` with the same `{ id, title }` shape.

**Location share:**

```json
{
  "type": "location",
  "location": { "latitude": 12.9352, "longitude": 77.6146 }
}
```

### How the route normalizes these

All three shapes get collapsed into one internal `input` object before reaching the conversation engine — see [Conversation Engine](../backend/conversation-engine.md):

```js title="backend/src/routes/webhook.js"
function normalizeIncomingMessage(message) {
  if (message.type === "text") {
    return { type: "text", value: message.text.body };
  }
  if (message.type === "interactive") {
    const reply = message.interactive.button_reply || message.interactive.list_reply;
    if (!reply) return null;
    return { type: "interactive", id: reply.id, title: reply.title };
  }
  if (message.type === "location") {
    return { type: "location", lat: message.location.latitude, lng: message.location.longitude };
  }
  return null;
}
```

### Outbound: what gets sent back

`handleIncomingMessage()` returns a "send spec" (`{ kind, body, buttons?, rows?, buttonLabel? }`), and the route dispatches it to the matching Graph API call:

```js title="backend/src/routes/webhook.js"
async function sendReply(phoneNumber, reply) {
  if (reply.kind === "buttons") return sendButtonMessage(phoneNumber, reply.body, reply.buttons);
  if (reply.kind === "list") return sendListMessage(phoneNumber, reply.body, reply.buttonLabel, reply.rows);
  return sendTextMessage(phoneNumber, reply.body);
}
```

Each of those, in turn, is a `POST` to Meta's own API — `https://graph.facebook.com/v20.0/<phone_number_id>/messages`:

```json title="sendTextMessage payload"
{
  "messaging_product": "whatsapp",
  "to": "919731400613",
  "type": "text",
  "text": { "body": "Welcome! What's your name?" }
}
```

```json title="sendListMessage payload"
{
  "messaging_product": "whatsapp",
  "to": "919731400613",
  "type": "interactive",
  "interactive": {
    "type": "list",
    "body": { "text": "Please select your nearest Transit station:" },
    "action": {
      "button": "Select",
      "sections": [{
        "rows": [
          { "id": "MAJESTIC", "title": "Majestic (KSR)" },
          { "id": "MG_ROAD", "title": "MG Road" },
          { "id": "OTHERS", "title": "Others" }
        ]
      }]
    }
  }
}
```

Every inbound and outbound message is also logged to `conversation_logs` (see [Database Schema](../database/schema.md)) — that's what powers the dashboard's transcript view.
