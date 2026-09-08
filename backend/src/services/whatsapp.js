const axios = require("axios");

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const GRAPH_URL = `https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`;

const headers = {
  Authorization: `Bearer ${WHATSAPP_TOKEN}`,
  "Content-Type": "application/json",
};

async function sendTextMessage(to, body) {
  await axios.post(
    GRAPH_URL,
    {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body },
    },
    { headers }
  );
}

// buttons: [{ id, title }], max 3, title <= 20 chars
async function sendButtonMessage(to, body, buttons) {
  await axios.post(
    GRAPH_URL,
    {
      messaging_product: "whatsapp",
      to,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: body },
        action: {
          buttons: buttons.map((b) => ({
            type: "reply",
            reply: { id: b.id, title: b.title },
          })),
        },
      },
    },
    { headers }
  );
}

// rows: [{ id, title, description? }], max 10, title <= 24 chars
async function sendListMessage(to, body, buttonLabel, rows) {
  await axios.post(
    GRAPH_URL,
    {
      messaging_product: "whatsapp",
      to,
      type: "interactive",
      interactive: {
        type: "list",
        body: { text: body },
        action: {
          button: buttonLabel,
          sections: [
            {
              rows: rows.map((r) => ({
                id: r.id,
                title: r.title,
                description: r.description,
              })),
            },
          ],
        },
      },
    },
    { headers }
  );
}

module.exports = { sendTextMessage, sendButtonMessage, sendListMessage };
