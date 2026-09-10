// Shared visual language for every chart on the dashboard, so a color always
// means the same thing wherever it shows up (e.g. indigo is always "volume").
export const INDIGO = "#6366f1";
export const VIOLET = "#8b5cf6";
export const EMERALD = "#10b981";
export const AMBER = "#f59e0b";
export const ROSE = "#f43f5e";
export const TEAL = "#14b8a6";
export const SKY = "#0ea5e9";

export const CATEGORY_COLORS = [INDIGO, VIOLET, EMERALD, AMBER, ROSE, TEAL, SKY, "#a855f7"];

export const chartTooltipStyle = {
  borderRadius: 10,
  border: "1px solid var(--border)",
  fontSize: 12,
  boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
};

export const chartAxisTick = { fontSize: 11, fill: "var(--muted-foreground)" };

export function formatDayLabel(iso) {
  const date = new Date(iso + "T00:00:00");
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function formatHourLabel(hour) {
  if (hour === 0) return "12am";
  if (hour === 12) return "12pm";
  return hour < 12 ? `${hour}am` : `${hour - 12}pm`;
}
