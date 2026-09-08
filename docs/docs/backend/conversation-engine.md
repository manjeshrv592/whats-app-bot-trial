---
sidebar_position: 2
---

# The Survey State Machine

This is the core of the bot: `src/flow/content.js` (what to say) and `src/flow/conversation.js` (what to do next). Together they drive a ~20-step branching survey without a giant `switch` statement.

## Why a config table instead of a switch

An earlier, 3-question trial version of this bot used a plain `switch (currentStep)` block — fine for 3 linear steps, unworkable for 20 steps with branches, "Others" free-text fallbacks, and two languages. The current design is data-driven: each step is an entry in a `STEPS` object, and one generic interpreter (`handleIncomingMessage`) walks it. Adding a step later means adding a table entry, not new branching logic.

## `content.js` — bilingual text, separate from logic

```js title="backend/src/flow/content.js (shape)"
const STATIONS = { en: [...], kn: [...] };      // option sets, keyed by language
const TRAVEL_MODES = { en: [...], kn: [...] };
const FREQUENCY = { en: [...], kn: [...] };
const YES_NO = { en: [...], kn: [...] };

const OPTION_SETS = { stations: STATIONS, travelModes: TRAVEL_MODES, frequency: FREQUENCY, yesNo: YES_NO };

const CONTENT = {
  askConsent: {
    en: { body: "We'd appreciate a minute...", options: "yesNo" },
    kn: { body: "ನಿಮ್ಮ ಕೊನೆಯ ಮೈಲಿ...", options: "yesNo" },
  },
  // ...one entry per step
};

function render(stepContentKey, language, vars = {}) {
  // looks up CONTENT[stepContentKey][language], interpolates {vars} into the body,
  // and resolves `options: "yesNo"` into the actual option rows for that language
}
```

`render()` is the only way `conversation.js` ever touches text — it never has an `if (language === "kn")` branch itself. This is what makes the whole flow bilingual "for free": every step just calls `render(step.contentKey, language, vars)`.

**WhatsApp's interactive message limits shape the content**, not just the design: button titles must be ≤ 20 characters and list row titles ≤ 24 characters. A couple of the sample survey's option labels didn't fit — e.g. "Private Vehicle (Car/Bike)" became title `"Private Vehicle"` with the detail moved into the row's `description` field (WhatsApp list rows support both).

## `conversation.js` — the step table

Each entry in `STEPS` declares:

| Key | Meaning |
|---|---|
| `contentKey` | Which `CONTENT` entry renders this step's prompt |
| `type` | Expected input: `"text"`, `"buttons"`, `"list"`, or `"location"` |
| `field` | Which `User` column the answer is saved to (omitted for steps that don't save, like `ASK_CONSENT`) |
| `next(answerId, user)` | Computes the next step key — this is where branching lives |
| `skipSaveWhen(answerId)` | Optional — for list steps with an "Others" row, skip saving the placeholder id since the next step (a `_OTHER` text step) will overwrite it with the real value |
| `validate(value)` | Optional — e.g. `ASK_EMAIL` regex-validates before advancing |
| `vars(user)` | Optional — template variables for the prompt, e.g. `` `"Awesome {name}! Let's begin."` `` |

```js title="backend/src/flow/conversation.js — a representative slice"
ASK_NEAREST_STATION: {
  contentKey: "askNearestStation",
  type: "list",
  field: "nearestStation",
  skipSaveWhen: (id) => id === "OTHERS",
  next: (answerId) => (answerId === "OTHERS" ? "ASK_NEAREST_STATION_OTHER" : "ASK_FEEDER_MODE"),
},
ASK_NEAREST_STATION_OTHER: {
  contentKey: "askNearestStationOther",
  type: "text",
  field: "nearestStation",           // same field — this step's free-text answer replaces the placeholder
  next: () => "ASK_FEEDER_MODE",
},
```

## Full step sequence

```
ASK_LANGUAGE → ASK_CONSENT →(NO)→ CANCELLED
             →(YES)→ ASK_NAME → ASK_FREQUENCY → ASK_HOME_AREA
             → ASK_SHARE_ORIGIN_GEO →(YES)→ ASK_ORIGIN_LOCATION ─┐
                                    →(NO)──────────────────────┴→ ASK_NEAREST_STATION (→ _OTHER if "Others")
             → ASK_FEEDER_MODE (→ _OTHER if "Others")
             → ASK_DESTINATION_STATION (→ _OTHER if "Others")
             → ASK_DISTRIBUTION_MODE (→ _OTHER if "Others")
             → ASK_DEST_AREA
             → ASK_SHARE_DEST_GEO →(YES)→ ASK_DEST_LOCATION ─┐
                                  →(NO)─────────────────────┴→ ASK_EMAIL
             → ASK_SMART_CARD → DONE
```

`ASK_LANGUAGE` isn't in the `STEPS` table — it's a special bootstrap case (see below), since its prompt shows both languages at once (we don't know the user's preference yet).

## `handleIncomingMessage(phoneNumber, input)` — the interpreter

The `input` is a normalized shape the webhook route builds from Meta's payload (see [Webhook API](../api-reference/webhook-api.md)): `{ type: "text", value }`, `{ type: "interactive", id, title }`, or `{ type: "location", lat, lng }`.

Walking through what happens on each call:

1. **Upsert the `User` row** for this phone number (creates it on first contact).
2. **No `Session` row yet?** This is truly the first message ever — create a session at `ASK_LANGUAGE` and send the bilingual welcome + language buttons. Nothing else runs.
3. **`currentStep` is `DONE` or `CANCELLED`?** Terminal states — reply with "already completed" and stop. (See [Known Limitations](../known-limitations.md) — there's no restart/resume handling here, which has one real gap: a returning user's free-text answer on a *paused* step, like typing "Hi" again, gets saved as literal survey data rather than being recognized as a greeting.)
4. **`currentStep` is `ASK_LANGUAGE`?** Special-cased outside the `STEPS` table — validates the reply is `en` or `kn`, saves `user.language`, advances to `ASK_CONSENT`.
5. **Otherwise, look up `STEPS[currentStep]`** and call `validateInput(step, input, language)`.
   - Wrong input type for what the step expects (e.g. free text where a button tap was expected) → `buildMismatchReply()` re-sends the same prompt with a short nudge, **without advancing the session**.
   - `ASK_EMAIL`'s `validate()` failing counts as a mismatch too (`reason: "invalid_value"`).
6. **`ASK_CONSENT` is special-cased** right after validation: it writes `user.consented` (a boolean) and branches to either `CANCELLED` (with a goodbye message) or `ASK_NAME` — this couldn't be expressed as a plain `field` save because the branch target depends on the answer, and the field itself is a derived boolean, not the raw answer text.
7. **Location steps** write both lat/lng columns from `step.locationFields`, then advance.
8. **Everything else**: save the answer to `step.field` (unless `skipSaveWhen` says not to), compute `next()`, persist `session.currentStep`, and render that next step's prompt.

The reply shape returned all the way up is a **send spec** — `{ kind: "text" | "buttons" | "list", body, buttons?, rows?, buttonLabel? }` — which `webhook.js` dispatches to the matching `services/whatsapp.js` function. `conversation.js` never imports the WhatsApp service directly; it only describes *what* to send.

## Restart / greeting handling gap

Worth calling out explicitly for anyone extending this: greeting keywords (`Hi`, `Hello`, etc.) are **not** treated as a global "restart" command. They're only meaningful as the very first message when no session exists yet. If a user abandons the survey mid-flow on a free-text step and later sends "Hi" hoping to start over, that text gets saved as the literal answer to whatever question they'd paused on. A real fix would check for a small set of greeting words *before* the normal step-input handling, regardless of current step — not built yet.
