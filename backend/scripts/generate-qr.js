require("dotenv").config();
const path = require("path");
const QRCode = require("qrcode");

const number = process.env.WHATSAPP_WA_LINK_NUMBER;
const text = process.env.WHATSAPP_WA_LINK_TEXT || "Hi";

if (!number) {
  console.error("WHATSAPP_WA_LINK_NUMBER is not set in .env");
  process.exit(1);
}

const link = `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
const outputPath = path.join(__dirname, "..", "qr-code.png");

QRCode.toFile(outputPath, link, { width: 512, margin: 2 }, (err) => {
  if (err) {
    console.error("Failed to generate QR code:", err);
    process.exit(1);
  }
  console.log(`Link: ${link}`);
  console.log(`QR code saved to: ${outputPath}`);
});
