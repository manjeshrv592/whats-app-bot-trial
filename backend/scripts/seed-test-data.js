// One-off utility: wipes ConversationLog/Session/User and inserts synthetic
// but realistic survey responses for analytics/dashboard testing. Vocabulary
// (station/mode/frequency titles) matches src/flow/content.js exactly, since
// that's what the real bot actually saves.
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const STATIONS = {
  en: ["Majestic (KSR)", "MG Road", "Yelachenahalli", "Baiyappanahalli", "Whitefield (Kadugodi)"],
  kn: ["ಮೆಜೆಸ್ಟಿಕ್ (KSR)", "ಎಂಜಿ ರೋಡ್", "ಯಲಚೇನಹಳ್ಳಿ", "ಬಾಯಪ್ಪನಹಳ್ಳಿ", "ವೈಟ್‌ಫೀಲ್ಡ್ (ಕಾಡುಗೋಡಿ)"],
};
const MODES = {
  en: ["Walk", "Bicycle", "Auto-rickshaw", "BMTC Bus", "Private Vehicle", "Cab"],
  kn: ["ನಡಿಗೆ", "ಸೈಕಲ್", "ಆಟೋ-ರಿಕ್ಷಾ", "BMTC ಬಸ್", "ಸ್ವಂತ ವಾಹನ", "ಕ್ಯಾಬ್"],
};
const FREQUENCY = {
  en: ["Daily", "Few times a week", "Rarely", "First time"],
  kn: ["ಪ್ರತಿದಿನ", "ವಾರಕ್ಕೆ ಕೆಲವು ಬಾರಿ", "ಅಪರೂಪವಾಗಿ", "ಮೊದಲ ಬಾರಿ"],
};
const AREAS = [
  "Indiranagar", "Jayanagar", "Whitefield", "Koramangala", "HSR Layout",
  "Marathahalli", "BTM Layout", "Electronic City", "Yelahanka", "Rajajinagar",
  "Malleshwaram", "JP Nagar", "Banashankari", "Hebbal", "Sarjapur Road",
];
const FIRST_NAMES = [
  "Arjun", "Priya", "Rahul", "Sneha", "Vikram", "Ananya", "Karthik", "Divya",
  "Suresh", "Meera", "Naveen", "Pooja", "Rohit", "Kavya", "Manoj", "Shreya",
  "Deepak", "Lakshmi", "Ravi", "Nisha", "Ganesh", "Swathi", "Vinay", "Rekha",
];
const LAST_NAMES = [
  "Kumar", "Reddy", "Rao", "Sharma", "Gowda", "Naidu", "Iyer", "Nair",
  "Shetty", "Hegde", "Pillai", "Murthy",
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function jitter(base, spread) {
  return base + (Math.random() - 0.5) * spread;
}
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(randomInt(7, 21), randomInt(0, 59), randomInt(0, 59), 0);
  return d;
}
function fakePhone(i) {
  return `9190000${String(1000 + i)}`;
}

const BLR_LAT = 12.9716;
const BLR_LNG = 77.5946;

const TOTAL = 45;
const DONE_COUNT = 36;
const CANCELLED_COUNT = 6;
// remaining = mid-flow drop-offs

const MID_FLOW_STEPS = ["ASK_HOME_AREA", "ASK_NEAREST_STATION", "ASK_FEEDER_MODE", "ASK_EMAIL"];

async function main() {
  const delLogs = await prisma.conversationLog.deleteMany({});
  const delSessions = await prisma.session.deleteMany({});
  const delUsers = await prisma.user.deleteMany({});
  console.log("Cleared:", { logs: delLogs.count, sessions: delSessions.count, users: delUsers.count });

  let created = 0;
  let withLogs = 0;

  for (let i = 0; i < TOTAL; i++) {
    const phoneNumber = fakePhone(i);
    const language = Math.random() < 0.25 ? "kn" : "en";
    const createdAt = daysAgo(randomInt(0, 29));
    const name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
    const frequency = pick(FREQUENCY[language]);
    const homeArea = pick(AREAS);
    let destinationArea = pick(AREAS);
    while (destinationArea === homeArea) destinationArea = pick(AREAS);

    const outcome = i < DONE_COUNT ? "DONE" : i < DONE_COUNT + CANCELLED_COUNT ? "CANCELLED" : "MID_FLOW";

    const shareOrigin = Math.random() < 0.5;
    const shareDest = Math.random() < 0.4;
    const originLat = shareOrigin ? jitter(BLR_LAT, 0.15) : null;
    const originLng = shareOrigin ? jitter(BLR_LNG, 0.15) : null;
    const destLat = shareDest ? jitter(BLR_LAT, 0.15) : null;
    const destLng = shareDest ? jitter(BLR_LNG, 0.15) : null;

    const userData = {
      phoneNumber,
      language,
      consented: outcome !== "CANCELLED" ? true : Math.random() < 0.3,
      createdAt,
      updatedAt: createdAt,
    };

    if (outcome === "DONE") {
      Object.assign(userData, {
        name,
        travelFrequency: frequency,
        homeArea,
        originLat,
        originLng,
        nearestStation: pick(STATIONS[language]),
        feederMode: pick(MODES[language]),
        destinationStation: pick(STATIONS[language]),
        distributionMode: pick(MODES[language]),
        destinationArea,
        destLat,
        destLng,
        email: `${name.toLowerCase().replace(/ /g, ".")}@example.com`,
        smartCardNumber: String(randomInt(10000000000, 99999999999)),
      });
    } else if (outcome === "MID_FLOW") {
      // Partial data, matching how far through STEPS they got.
      Object.assign(userData, { name, travelFrequency: frequency, homeArea });
    }

    await prisma.user.create({ data: userData });

    const sessionStep = outcome === "DONE" ? "DONE" : outcome === "CANCELLED" ? "CANCELLED" : pick(MID_FLOW_STEPS);
    await prisma.session.create({
      data: { phoneNumber, currentStep: sessionStep, createdAt, updatedAt: createdAt },
    });

    // Give a realistic transcript to a third of the completed respondents,
    // so the admin dashboard's WhatsApp-style transcript view has content too.
    if (outcome === "DONE" && i % 3 === 0) {
      await seedTranscript(phoneNumber, { name, language, frequency, homeArea, destinationArea, createdAt, originLat, originLng });
      withLogs++;
    }

    created++;
  }

  console.log(`Created ${created} users (${DONE_COUNT} done, ${CANCELLED_COUNT} cancelled, ${TOTAL - DONE_COUNT - CANCELLED_COUNT} mid-flow), ${withLogs} with full transcripts.`);
  await prisma.$disconnect();
}

async function seedTranscript(phoneNumber, { name, language, frequency, homeArea, destinationArea, createdAt, originLat, originLng }) {
  const en = language === "en";
  let t = new Date(createdAt);
  const bump = (mins) => {
    t = new Date(t.getTime() + mins * 60000);
    return t;
  };

  const lines = [
    ["in", "Hi"],
    ["out", en ? "Welcome to Namma Transit last mile commute survey! Which language do you want to continue with?" : "ನಮ್ಮ ಟ್ರಾನ್ಸಿಟ್ ಸಮೀಕ್ಷೆಗೆ ಸುಸ್ವಾಗತ!"],
    ["in", en ? "English" : "ಕನ್ನಡ"],
    ["out", en ? "We'd appreciate a minute of your time... Ready to help us improve your journey?" : "ಒಂದು ನಿಮಿಷ ಸಮಯ ನೀಡಿ..."],
    ["in", "YES"],
    ["out", en ? "Before we begin, may I have your name, please?" : "ದಯವಿಟ್ಟು ನಿಮ್ಮ ಹೆಸರು ತಿಳಿಸುವಿರಾ?"],
    ["in", name],
    ["out", en ? `Awesome ${name}! Let's begin. How often do you use the Transit?` : `ಅದ್ಭುತ ${name}! ಎಷ್ಟು ಬಾರಿ ಬಳಸುತ್ತೀರಿ?`],
    ["in", frequency],
    ["out", en ? "Which area or locality do you live in?" : "ಯಾವ ಪ್ರದೇಶದಲ್ಲಿ ವಾಸಿಸುತ್ತೀರಿ?"],
    ["in", homeArea],
  ];

  if (originLat != null) {
    lines.push(["out", en ? "Would you like to share your Geo location?" : "ಜಿಯೋ ಲೊಕೇಶನ್ ಹಂಚಿಕೊಳ್ಳಲು ಇಚ್ಛಿಸುತ್ತೀರಾ?"]);
    lines.push(["in", "YES"]);
    lines.push(["out", en ? "Please share your location by clicking the Location icon in WhatsApp." : "ಲೊಕೇಶನ್ ಐಕಾನ್ ಕ್ಲಿಕ್ ಮಾಡಿ."]);
    lines.push(["in", `${originLat.toFixed(6)},${originLng.toFixed(6)}`]);
  }

  lines.push(["out", en ? "Could you please share your email ID?" : "ಇಮೇಲ್ ಐಡಿ ಹಂಚಿಕೊಳ್ಳುವಿರಾ?"]);
  lines.push(["in", `${name.toLowerCase().replace(/ /g, ".")}@example.com`]);
  lines.push(["out", en ? "Please share your 11-digit Smart Card number." : "11-ಅಂಕಿಯ ಸ್ಮಾರ್ಟ್ ಕಾರ್ಡ್ ಸಂಖ್ಯೆ ಹಂಚಿಕೊಳ್ಳಿ."]);
  lines.push(["in", String(randomInt(10000000000, 99999999999))]);
  lines.push(["out", en ? "Thank you for your feedback! You've earned your reward." : "ನಿಮ್ಮ ಪ್ರತಿಕ್ರಿಯೆಗೆ ಧನ್ಯವಾದಗಳು!"]);

  for (const [direction, messageText] of lines) {
    await prisma.conversationLog.create({
      data: { phoneNumber, direction, messageText, createdAt: bump(randomInt(1, 4)) },
    });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
