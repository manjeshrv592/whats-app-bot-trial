const express = require("express");
const prisma = require("../services/db");
const { sendTextMessage, sendButtonMessage, sendListMessage } = require("../services/whatsapp");
const { handleIncomingMessage } = require("../flow/conversation");

const router = express.Router();

// Meta calls this once to verify the webhook URL.
router.get("/", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// Meta calls this whenever a message arrives.
router.post("/", async (req, res) => {
  // Always ack quickly so Meta doesn't retry.
  res.sendStatus(200);

  const entry = req.body.entry?.[0];
  const change = entry?.changes?.[0];
  const message = change?.value?.messages?.[0];

  if (!message) return;

  const input = normalizeIncomingMessage(message);
  if (!input) return;

  const phoneNumber = message.from;

  try {
    await logMessage(phoneNumber, "in", describeInput(input), /* ensureUser */ true);

    const reply = await handleIncomingMessage(phoneNumber, input);

    await sendReply(phoneNumber, reply);
    await logMessage(phoneNumber, "out", reply.body, false);
  } catch (err) {
    console.error("Error handling webhook message:", err);
  }
});

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

function describeInput(input) {
  if (input.type === "text") return input.value;
  if (input.type === "interactive") return input.title;
  if (input.type === "location") return `${input.lat},${input.lng}`;
  return "";
}

async function sendReply(phoneNumber, reply) {
  if (reply.kind === "buttons") {
    return sendButtonMessage(phoneNumber, reply.body, reply.buttons);
  }
  if (reply.kind === "list") {
    return sendListMessage(phoneNumber, reply.body, reply.buttonLabel, reply.rows);
  }
  return sendTextMessage(phoneNumber, reply.body);
}

async function logMessage(phoneNumber, direction, text, ensureUser) {
  if (ensureUser) {
    await prisma.user.upsert({
      where: { phoneNumber },
      update: {},
      create: { phoneNumber },
    });
  }
  await prisma.conversationLog.create({
    data: { phoneNumber, direction, messageText: text },
  });
}

module.exports = router;
