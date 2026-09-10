const prisma = require("./db");
const { OPTION_SETS } = require("../flow/content");

// Respondents answer in whichever language they picked, so the same real
// station/mode/frequency shows up as two different strings in the raw data.
// Fold Kannada answers onto their English label (matched by option id, via
// content.js's option sets) so charts aggregate the real-world thing, not
// its language variants. Free-text "Others" answers pass through unchanged.
function buildNormalizer(setKey) {
  const { en, kn } = OPTION_SETS[setKey];
  const map = new Map();
  en.forEach((row, i) => {
    map.set(row.title, row.title);
    if (kn[i]) map.set(kn[i].title, row.title);
  });
  return (label) => map.get(label) || label;
}
const normalizeStation = buildNormalizer("stations");
const normalizeMode = buildNormalizer("travelModes");
const normalizeFrequency = buildNormalizer("frequency");

function mergeCounts(groups, field, normalize) {
  const counts = new Map();
  for (const group of groups) {
    const raw = group[field];
    if (!raw) continue;
    const label = normalize(raw);
    counts.set(label, (counts.get(label) || 0) + group._count);
  }
  return [...counts.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
}

// Aggregate counts computed in the database, not by paging through rows —
// with thousands of responses, "fetch page 1 and count what came back" only
// reflects that one page, not the true totals.
async function getStats() {
  const [totalUsers, sessionGroups] = await Promise.all([
    prisma.user.count(),
    prisma.session.groupBy({ by: ["currentStep"], _count: true }),
  ]);

  let completed = 0;
  let declined = 0;
  let inProgress = 0;
  let sessionedUsers = 0;
  for (const group of sessionGroups) {
    sessionedUsers += group._count;
    if (group.currentStep === "DONE") completed += group._count;
    else if (group.currentStep === "CANCELLED") declined += group._count;
    else inProgress += group._count;
  }
  const notStarted = totalUsers - sessionedUsers;

  return { total: totalUsers, completed, inProgress, declined, notStarted };
}

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Mon..Sun, for a natural work-week read

// `users.created_at` is a timezone-less `timestamp` column, and node-postgres
// serializes JS Dates into it using their UTC field values — so a Date whose
// *local* (IST) wall-clock reads 8:30am gets written as literal "03:00:00".
// Reading it back with a plain extract() would show commute activity five
// and a half hours off from reality. Add the offset back before bucketing by
// day/hour/weekday so these charts reflect actual IST wall-clock time.
async function getAnalytics() {
  const [dailyRaw, stationGroups, feederGroups, distGroups, freqGroups, hourRaw, weekdayRaw] = await Promise.all([
    prisma.$queryRaw`SELECT to_char(created_at + interval '5 hours 30 minutes', 'YYYY-MM-DD') AS day, count(*)::int AS count FROM users GROUP BY 1 ORDER BY 1`,
    prisma.user.groupBy({ by: ["nearestStation"], _count: true, where: { nearestStation: { not: null } } }),
    prisma.user.groupBy({ by: ["feederMode"], _count: true, where: { feederMode: { not: null } } }),
    prisma.user.groupBy({ by: ["distributionMode"], _count: true, where: { distributionMode: { not: null } } }),
    prisma.user.groupBy({ by: ["travelFrequency"], _count: true, where: { travelFrequency: { not: null } } }),
    prisma.$queryRaw`SELECT extract(hour from created_at + interval '5 hours 30 minutes')::int AS hour, count(*)::int AS count FROM users GROUP BY 1 ORDER BY 1`,
    prisma.$queryRaw`SELECT extract(dow from created_at + interval '5 hours 30 minutes')::int AS dow, count(*)::int AS count FROM users GROUP BY 1 ORDER BY 1`,
  ]);

  const daily = dailyRaw.map((r) => ({ day: r.day, count: r.count }));

  const stations = mergeCounts(stationGroups, "nearestStation", normalizeStation).slice(0, 8);

  const feeder = mergeCounts(feederGroups, "feederMode", normalizeMode);
  const distribution = mergeCounts(distGroups, "distributionMode", normalizeMode);
  const modeLabels = [...new Set([...feeder.map((f) => f.label), ...distribution.map((d) => d.label)])];
  const modes = modeLabels
    .map((label) => ({
      label,
      feeder: feeder.find((f) => f.label === label)?.count || 0,
      distribution: distribution.find((d) => d.label === label)?.count || 0,
    }))
    .sort((a, b) => b.feeder + b.distribution - (a.feeder + a.distribution));

  const frequency = mergeCounts(freqGroups, "travelFrequency", normalizeFrequency);

  const hourMap = new Map(hourRaw.map((r) => [r.hour, r.count]));
  const hours = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: hourMap.get(h) || 0 }));

  const weekdayMap = new Map(weekdayRaw.map((r) => [r.dow, r.count]));
  const weekday = WEEKDAY_ORDER.map((dow) => ({ day: WEEKDAY_NAMES[dow], count: weekdayMap.get(dow) || 0 }));

  return { daily, stations, modes, frequency, hours, weekday };
}

module.exports = { getStats, getAnalytics };
