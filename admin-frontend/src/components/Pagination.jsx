import { ChevronFirst, ChevronLast } from "lucide-react";
import { Button } from "@/components/ui/button";

// Builds a compact page list around the current page, e.g. for page 6 of 42:
// [1, "...", 5, 6, 7, "...", 42] — never more than a couple of numbers plus
// the anchors, regardless of how many total pages there are.
function getPageNumbers(current, total) {
  const window = 1;
  const pages = new Set([1, total, current]);
  for (let i = current - window; i <= current + window; i++) {
    if (i > 1 && i < total) pages.add(i);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const result = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push("ellipsis-" + sorted[i]);
    result.push(sorted[i]);
  }
  return result;
}

export function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = getPageNumbers(page, totalPages);

  return (
    <div className="flex items-center gap-1.5">
      <Button variant="outline" size="icon-sm" disabled={page <= 1} onClick={() => onPageChange(1)} title="First page">
        <ChevronFirst />
      </Button>
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        Prev
      </Button>

      {pages.map((p) =>
        typeof p === "number" ? (
          <Button
            key={p}
            variant={p === page ? "default" : "outline"}
            size="icon-sm"
            className={p === page ? "pointer-events-none" : ""}
            onClick={() => onPageChange(p)}
          >
            {p}
          </Button>
        ) : (
          <span key={p} className="px-1 text-sm text-muted-foreground">
            …
          </span>
        )
      )}

      <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
        Next
      </Button>
      <Button
        variant="outline"
        size="icon-sm"
        disabled={page >= totalPages}
        onClick={() => onPageChange(totalPages)}
        title="Last page"
      >
        <ChevronLast />
      </Button>
    </div>
  );
}
