---
sidebar_position: 6
---

# Known Limitations & TODOs

An honest list for whoever picks this up next — none of these are bugs exactly, they're scope that was deliberately deferred.

## WhatsApp access token expires ~daily

`WHATSAPP_TOKEN` from the Meta "Try it out" flow is a **temporary** token — it expires at a fixed daily cutoff (not a rolling 24h-from-creation timer), and every send silently fails with `OAuthException` (code 190) once it does. Confirmed in practice: the webhook still receives inbound messages fine (that doesn't need the token), but replies stop going out.

**Before any real/production use**, this needs to move to a permanent **System User token** (Meta Business Settings → System Users → generate a token with `whatsapp_business_messaging` permission, no expiry) instead of manually regenerating a temporary one whenever it dies.

## No restart/resume handling in the conversation engine

Covered in detail in [Conversation Engine](./backend/conversation-engine.md#restart--greeting-handling-gap) — greeting words aren't recognized as a global "start over" command once a session already exists, so a returning user's "Hi" gets saved as literal survey data if they'd paused on a free-text step.

## Single admin account, via `.env`

There's exactly one admin login, seeded from `ADMIN_EMAIL`/`ADMIN_PASSWORD`. No signup flow, no invite flow, no per-admin permissions. Better Auth itself supports all of that — it's just not wired up, since the immediate need was "one person needs to see the data," not a multi-admin system. This was an explicit "finalize this later" decision, not an oversight.

## One survey submission per phone number

`User.phoneNumber` is unique — a respondent who's already reached `DONE` gets an "already completed" message on any future message, forever. The concept note behind this project mentions weekly re-surveys as a possible future feature; supporting that would mean a separate `responses` table keyed by `(userId, submittedAt)` rather than fields directly on `User`, which wasn't built since nothing currently needs it (see [Database Schema](./database/schema.md)).

## Station list is fixed, not filtered by area

The original sample flow diagram this bot is based on has an annotation suggesting the nearest-station dropdown should be "based on area" (i.e. filtered by the respondent's stated locality). The current implementation shows the same fixed list of ~6 stations regardless of what the respondent typed as their home area — simpler, and there was no station/locality mapping data available to filter against.

## No automated tests

Everything was verified by hand — real WhatsApp messages sent through an ngrok tunnel during development, and direct database checks after each run (several of the request/response examples in this documentation were captured that way, not fabricated). There's no test suite. Given the state-machine shape of `conversation.js`, unit tests around `handleIncomingMessage()` for each branch (consent decline, each "Others" fallback, both location yes/no paths, both languages) would be the highest-value place to start.
