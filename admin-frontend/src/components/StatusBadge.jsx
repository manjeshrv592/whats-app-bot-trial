const STYLES = {
  COMPLETED: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  IN_PROGRESS: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  DECLINED: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  NOT_STARTED: "bg-muted text-muted-foreground",
};

const LABELS = {
  COMPLETED: "Completed",
  IN_PROGRESS: "In progress",
  DECLINED: "Declined",
  NOT_STARTED: "Not started",
};

export function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide ${STYLES[status] || STYLES.NOT_STARTED}`}
    >
      {LABELS[status] || status}
    </span>
  );
}
