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
| `dynamicOptions(user, language)` | Optional — computes list rows at send/validate time instead of using the static `CONTENT` option set; return `null` to fall back to the static list. See [Dynamic nearest-station suggestions](#dynamic-nearest-station-suggestions) below. |

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
             → ASK_DEST_AREA
             → ASK_SHARE_DEST_GEO →(YES)→ ASK_DEST_LOCATION ─┐
                                  →(NO)─────────────────────┴→ ASK_DESTINATION_STATION (→ _OTHER if "Others")
             → ASK_DISTRIBUTION_MODE (→ _OTHER if "Others")
             → ASK_EMAIL → ASK_SMART_CARD → DONE
```

`ASK_LANGUAGE` isn't in the `STEPS` table — it's a special bootstrap case (see below), since its prompt shows both languages at once (we don't know the user's preference yet).

Note the destination side mirrors the origin side's shape on purpose (area → share geo? → location → station picker) — the destination sequence was reordered from an earlier version (which asked "which destination station?" before asking for destination location) specifically so dynamic nearest-station suggestions could work on both legs, not just the origin. See below.

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

## Dynamic nearest-station suggestions

`ASK_NEAREST_STATION` and `ASK_DESTINATION_STATION` don't always show the same fixed 6-station list — if the respondent has shared their location (origin or destination respectively), they instead see the **4 actual nearest Namma Metro stations** (by straight-line distance) plus an "Others" row.

- `backend/src/flow/stations.js` — all 83 Namma Metro stations (name, line, lat/lng), a plain static data file.
- `backend/src/flow/geo.js` — `haversineDistanceKm()` (great-circle distance between two lat/lng points) and `getNearestStations()`, pure math, no external API. This is straight-line distance, not actual travel distance — a deliberate, standard simplification rather than paying for a routing API for marginal accuracy gain.
- `nearestStationRows(user, language, latField, lngField)` in `conversation.js` — returns the 4 nearest + Others as WhatsApp list rows, or `null` if the relevant lat/lng fields aren't set on the user yet (i.e. they haven't shared that location), which is what triggers the static-list fallback.

```js title="backend/src/flow/conversation.js"
ASK_NEAREST_STATION: {
  ...,
  dynamicOptions: (user, language) => nearestStationRows(user, language, "originLat", "originLng"),
},
ASK_DESTINATION_STATION: {
  ...,
  dynamicOptions: (user, language) => nearestStationRows(user, language, "destLat", "destLng"),
},
```

**Why one `resolveStepOptions()` helper matters here**: the same computed row list has to be used both when the message is *sent* (`renderStep`) and when the reply is *validated* (`validateInput`, and `buildMismatchReply` if the reply was invalid) — since the row `id`s are the station's own id (e.g. `"BLR-M016"`), not a small fixed enum, sending one list and validating against a different one would silently break every dynamic-list reply. All three call through `resolveStepOptions(step, user, language)`, which is dynamic-if-available-else-static, so this can't drift.

A handful of official station names exceed WhatsApp's 24-character list row title limit (e.g. "Krantivira Sangolli Rayanna Railway Station") — `stationToRow()` truncates the title with an ellipsis and always puts the full name (+ line) in the row's `description` (capped at 72 chars) so nothing is actually lost from the user's perspective.

## Restart / greeting handling gap

Worth calling out explicitly for anyone extending this: greeting keywords (`Hi`, `Hello`, etc.) are **not** treated as a global "restart" command. They're only meaningful as the very first message when no session exists yet. If a user abandons the survey mid-flow on a free-text step and later sends "Hi" hoping to start over, that text gets saved as the literal answer to whatever question they'd paused on. A real fix would check for a small set of greeting words *before* the normal step-input handling, regardless of current step — not built yet.
