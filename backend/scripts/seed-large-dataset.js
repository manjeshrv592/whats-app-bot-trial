// One-off utility: wipes ConversationLog/Session/User and bulk-inserts a
// large, pattern-realistic synthetic dataset simulating ~3 months of survey
// collection — for actual analytics work, not just UI smoke-testing.
// Vocabulary (station/mode/frequency titles) matches src/flow/content.js
// exactly, since that's what the real bot actually saves.
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DAYS = 180;
const TRANSCRIPT_SAMPLE = 300; // how many completed users also get a full chat log

const STATIONS = {
  en: ["Majestic (KSR)", "MG Road", "Yelachenahalli", "Baiyappanahalli", "Whitefield (Kadugodi)"],
  kn: ["ಮೆಜೆಸ್ಟಿಕ್ (KSR)", "ಎಂಜಿ ರೋಡ್", "ಯಲಚೇನಹಳ್ಳಿ", "ಬಾಯಪ್ಪನಹಳ್ಳಿ", "ವೈಟ್‌ಫೀಲ್ಡ್ (ಕಾಡುಗೋಡಿ)"],
};
// Popularity skew: Whitefield & Majestic are bigger hubs than Yelachenahalli.
const STATION_WEIGHTS = [0.24, 0.2, 0.12, 0.16, 0.28];

const MODES = {
  en: ["Walk", "Bicycle", "Auto-rickshaw", "BMTC Bus", "Private Vehicle", "Cab"],
  kn: ["ನಡಿಗೆ", "ಸೈಕಲ್", "ಆಟೋ-ರಿಕ್ಷಾ", "BMTC ಬಸ್", "ಸ್ವಂತ ವಾಹನ", "ಕ್ಯಾಬ್"],
};
const MODE_WEIGHTS = [0.22, 0.08, 0.2, 0.18, 0.14, 0.18];

const FREQUENCY = {
  en: ["Daily", "Few times a week", "Rarely", "First time"],
  kn: ["ಪ್ರತಿದಿನ", "ವಾರಕ್ಕೆ ಕೆಲವು ಬಾರಿ", "ಅಪರೂಪವಾಗಿ", "ಮೊದಲ ಬಾರಿ"],
};
const FREQUENCY_WEIGHTS = [0.45, 0.3, 0.15, 0.1];

const AREAS = [
  "Indiranagar", "Jayanagar", "Whitefield", "Koramangala", "HSR Layout",
  "Marathahalli", "BTM Layout", "Electronic City", "Yelahanka", "Rajajinagar",
  "Malleshwaram", "JP Nagar", "Banashankari", "Hebbal", "Sarjapur Road",
];
const FIRST_NAMES = [
  "Arjun", "Priya", "Rahul", "Sneha", "Vikram", "Ananya", "Karthik", "Divya",
  "Suresh", "Meera", "Naveen", "Pooja", "Rohit", "Kavya", "Manoj", "Shreya",
  "Deepak", "Lakshmi", "Ravi", "Nisha", "Ganesh", "Swathi", "Vinay", "Rekha",
  "Anil", "Bhavana", "Chetan", "Deepa", "Girish", "Harini", "Imran", "Jyothi",
];
const LAST_NAMES = [
  "Kumar", "Reddy", "Rao", "Sharma", "Gowda", "Naidu", "Iyer", "Nair",
  "Shetty", "Hegde", "Pillai", "Murthy", "Bhat", "Achar",
];
const MID_FLOW_STEPS = ["ASK_HOME_AREA", "ASK_NEAREST_STATION", "ASK_FEEDER_MODE", "ASK_EMAIL"];
const MID_FLOW_WEIGHTS = [0.35, 0.3, 0.2, 0.15]; // more drop-off earlier in the flow

const BLR_LAT = 12.9716;
const BLR_LNG = 77.5946;

function rand() {
  return Math.random();
}
function pick(arr) {
  return arr[Math.floor(rand() * arr.length)];
}
function weightedPick(items, weights) {
  const r = rand();
  let acc = 0;
  for (let i = 0; i < items.length; i++) {
    acc += weights[i];
    if (r <= acc) return items[i];
  }
  return items[items.length - 1];
}
function randomInt(min, max) {
  return Math.floor(rand() * (max - min + 1)) + min;
}
function jitter(base, spread) {
  return base + (rand() - 0.5) * spread;
}
// Rough normal-ish distribution via averaged uniforms (Irwin-Hall approximation).
function normalish(mean, sd) {
  const u = (rand() + rand() + rand() + rand() - 2) / 2;
  return mean + u * sd;
}
function commuteHour() {
  const h = rand() < 0.5 ? normalish(8.5, 1.1) : normalish(18, 1.4);
  return Math.min(22, Math.max(6, h));
}
function fakePhone(i) {
  return `9190000${String(1000 + i)}`;
}

async function main() {
  const delLogs = await prisma.conversationLog.deleteMany({});
  const delSessions = await prisma.session.deleteMany({});
  const delUsers = await prisma.user.deleteMany({});
  console.log("Cleared:", { logs: delLogs.count, sessions: delSessions.count, users: delUsers.count });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Build per-day counts: growth trend over 90 days + weekday-heavy + noise.
  const dayPlan = [];
  for (let d = DAYS - 1; d >= 0; d--) {
    const date = new Date(today);
    date.setDate(date.getDate() - d);
    const progress = (DAYS - 1 - d) / (DAYS - 1); // 0 -> old, 1 -> recent
    let base = 25 + progress * 65; // grows from ~25/day to ~90/day
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    if (isWeekend) base *= 0.45;
    const noise = 0.75 + rand() * 0.5;
    const count = Math.max(3, Math.round(base * noise));
    dayPlan.push({ date, count });
  }
  const total = dayPlan.reduce((a, d) => a + d.count, 0);
  console.log(`Plan: ${DAYS} days, ${total} total responses (avg ${(total / DAYS).toFixed(1)}/day)`);

  const users = [];
  const sessions = [];
  const doneUsersForTranscripts = [];
  let i = 0;

  for (const { date } of dayPlan) {
    const dayCount = dayPlan.find((p) => p.date.getTime() === date.getTime()).count;
    for (let k = 0; k < dayCount; k++) {
      const phoneNumber = fakePhone(i);
      const language = rand() < 0.3 ? "kn" : "en";
      const hour = commuteHour();
      const createdAt = new Date(date);
      createdAt.setHours(Math.floor(hour), Math.round((hour % 1) * 60), randomInt(0, 59), 0);

      const name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
      const frequency = weightedPick(FREQUENCY[language], FREQUENCY_WEIGHTS);
      const homeArea = pick(AREAS);
      let destinationArea = pick(AREAS);
      while (destinationArea === homeArea) destinationArea = pick(AREAS);

      const outcomeRoll = rand();
      const outcome = outcomeRoll < 0.78 ? "DONE" : outcomeRoll < 0.9 ? "CANCELLED" : "MID_FLOW";

      const shareOrigin = rand() < 0.5;
      const shareDest = rand() < 0.4;
      const originLat = shareOrigin ? jitter(BLR_LAT, 0.15) : null;
      const originLng = shareOrigin ? jitter(BLR_LNG, 0.15) : null;
      const destLat = shareDest ? jitter(BLR_LAT, 0.15) : null;
      const destLng = shareDest ? jitter(BLR_LNG, 0.15) : null;

      const userData = {
        phoneNumber,
        language,
        consented: outcome !== "CANCELLED" ? true : rand() < 0.3,
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
          nearestStation: weightedPick(STATIONS[language], STATION_WEIGHTS),
          feederMode: weightedPick(MODES[language], MODE_WEIGHTS),
          destinationStation: weightedPick(STATIONS[language], STATION_WEIGHTS),
          distributionMode: weightedPick(MODES[language], MODE_WEIGHTS),
          destinationArea,
          destLat,
          destLng,
          email: `${name.toLowerCase().replace(/ /g, ".")}${i}@example.com`,
          smartCardNumber: String(randomInt(10000000000, 99999999999)),
        });
      } else if (outcome === "MID_FLOW") {
        Object.assign(userData, { name, travelFrequency: frequency, homeArea });
      }

      users.push(userData);

      const sessionStep =
        outcome === "DONE" ? "DONE" : outcome === "CANCELLED" ? "CANCELLED" : weightedPick(MID_FLOW_STEPS, MID_FLOW_WEIGHTS);
      sessions.push({ phoneNumber, currentStep: sessionStep, createdAt, updatedAt: createdAt });

      if (outcome === "DONE") doneUsersForTranscripts.push({ phoneNumber, name, language, frequency, homeArea, destinationArea, createdAt, originLat, originLng });

      i++;
    }
  }

  // Bulk insert in chunks — fast even at several thousand rows.
  const CHUNK = 1000;
  for (let c = 0; c < users.length; c += CHUNK) {
    await prisma.user.createMany({ data: users.slice(c, c + CHUNK) });
  }
  for (let c = 0; c < sessions.length; c += CHUNK) {
    await prisma.session.createMany({ data: sessions.slice(c, c + CHUNK) });
  }
  console.log(`Inserted ${users.length} users + sessions.`);

  // Full chat transcripts for a random sample of completed users, spread
  // across the whole date range, so the dashboard's transcript view has
  // realistic content without generating tens of thousands of log rows.
  const sample = [];
  const pool = [...doneUsersForTranscripts];
  for (let n = 0; n < Math.min(TRANSCRIPT_SAMPLE, pool.length); n++) {
    const idx = randomInt(0, pool.length - 1);
    sample.push(pool.splice(idx, 1)[0]);
  }

  const logs = [];
  for (const u of sample) {
    buildTranscript(u, logs);
  }
  for (let c = 0; c < logs.length; c += CHUNK) {
    await prisma.conversationLog.createMany({ data: logs.slice(c, c + CHUNK) });
  }
  console.log(`Inserted ${logs.length} conversation-log rows across ${sample.length} sampled transcripts.`);

  await prisma.$disconnect();
}

function buildTranscript(u, out) {
  const { phoneNumber, name, language, frequency, homeArea, createdAt, originLat, originLng } = u;
  const en = language === "en";
  let t = new Date(createdAt);
  const bump = (mins) => {
    t = new Date(t.getTime() + mins * 60000);
    return new Date(t);
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
    out.push({ phoneNumber, direction, messageText, createdAt: bump(randomInt(1, 4)) });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
