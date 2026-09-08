require("dotenv").config();
const path = require("path");
const QRCode = require("qrcode");
const sharp = require("sharp");

const number = process.env.WHATSAPP_WA_LINK_NUMBER;
const text = process.env.WHATSAPP_WA_LINK_TEXT || "Hi";

if (!number) {
  console.error("WHATSAPP_WA_LINK_NUMBER is not set in .env");
  process.exit(1);
}

const link = `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
const outputPath = path.join(__dirname, "..", "qr-code.png");

const CARD_WIDTH = 640;
const CARD_HEIGHT = 900;
const QR_SIZE = 400;

async function main() {
  const qrSvg = await QRCode.toString(link, {
    type: "svg",
    margin: 0,
    color: { dark: "#1e1b4b", light: "#ffffff" },
  });

  // Strip the outer <svg> wrapper so we can re-embed it at a fixed size/position.
  const qrInner = qrSvg.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
  const qrViewBoxMatch = qrSvg.match(/viewBox="([^"]+)"/);
  const qrViewBox = qrViewBoxMatch ? qrViewBoxMatch[1] : `0 0 ${QR_SIZE} ${QR_SIZE}`;

  const qrX = (CARD_WIDTH - QR_SIZE) / 2;
  const qrY = 330;

  const svg = `
<svg width="${CARD_WIDTH}" height="${CARD_HEIGHT}" viewBox="0 0 ${CARD_WIDTH} ${CARD_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="brand" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#6366f1" />
      <stop offset="100%" stop-color="#8b5cf6" />
    </linearGradient>
  </defs>

  <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" rx="36" fill="#ffffff" />
  <rect x="1" y="1" width="${CARD_WIDTH - 2}" height="${CARD_HEIGHT - 2}" rx="35" fill="none" stroke="#e5e7eb" stroke-width="2" />

  <rect width="${CARD_WIDTH}" height="230" rx="36" fill="url(#brand)" />
  <rect y="194" width="${CARD_WIDTH}" height="36" fill="url(#brand)" />

  <circle cx="${CARD_WIDTH / 2}" cy="90" r="42" fill="rgba(255,255,255,0.18)" />
  <g transform="translate(${CARD_WIDTH / 2 - 24}, 68)">
    <rect x="0" y="0" width="48" height="30" rx="8" fill="#ffffff" />
    <rect x="6" y="6" width="10" height="9" rx="2" fill="#6366f1" />
    <rect x="19" y="6" width="10" height="9" rx="2" fill="#6366f1" />
    <rect x="32" y="6" width="10" height="9" rx="2" fill="#6366f1" />
    <circle cx="10" cy="32" r="5" fill="#ffffff" />
    <circle cx="38" cy="32" r="5" fill="#ffffff" />
  </g>

  <text x="${CARD_WIDTH / 2}" y="165" font-family="Poppins, Arial, sans-serif" font-size="34" font-weight="700" fill="#ffffff" text-anchor="middle">Namma Transit</text>
  <text x="${CARD_WIDTH / 2}" y="198" font-family="Poppins, Arial, sans-serif" font-size="17" font-weight="500" fill="rgba(255,255,255,0.85)" text-anchor="middle">Commuter Survey</text>

  <text x="${CARD_WIDTH / 2}" y="290" font-family="Poppins, Arial, sans-serif" font-size="26" font-weight="700" fill="#1e1b4b" text-anchor="middle">Scan to take our survey</text>

  <rect x="${qrX - 24}" y="${qrY - 24}" width="${QR_SIZE + 48}" height="${QR_SIZE + 48}" rx="24" fill="#ffffff" stroke="#e5e7eb" stroke-width="2" />
  <svg x="${qrX}" y="${qrY}" width="${QR_SIZE}" height="${QR_SIZE}" viewBox="${qrViewBox}">
    ${qrInner}
  </svg>

  <text x="${CARD_WIDTH / 2}" y="${qrY + QR_SIZE + 70}" font-family="Poppins, Arial, sans-serif" font-size="20" font-weight="600" fill="#1e1b4b" text-anchor="middle">Help us improve your commute</text>
  <text x="${CARD_WIDTH / 2}" y="${qrY + QR_SIZE + 100}" font-family="Poppins, Arial, sans-serif" font-size="20" font-weight="600" fill="#1e1b4b" text-anchor="middle">&amp; earn reward points!</text>

  <text x="${CARD_WIDTH / 2}" y="${CARD_HEIGHT - 40}" font-family="Poppins, Arial, sans-serif" font-size="14" fill="#9ca3af" text-anchor="middle">Takes less than 2 minutes · Opens in WhatsApp</text>
</svg>`.trim();

  await sharp(Buffer.from(svg)).png().toFile(outputPath);

  console.log(`Link: ${link}`);
  console.log(`QR card saved to: ${outputPath}`);
}

main().catch((err) => {
  console.error("Failed to generate QR code:", err);
  process.exit(1);
});
