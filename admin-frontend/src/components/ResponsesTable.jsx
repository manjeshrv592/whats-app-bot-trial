import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/StatusBadge";

function initials(name, phoneNumber) {
  const source = name || phoneNumber || "?";
  return source.slice(0, 2).toUpperCase();
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function ResponsesTable({ responses, onSelect }) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">
            Respondent
          </TableHead>
          <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">
            Route
          </TableHead>
          <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">
            Language
          </TableHead>
          <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">
            Status
          </TableHead>
          <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">
            Submitted
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {responses.map((r) => (
          <TableRow
            key={r.phoneNumber}
            className="cursor-pointer"
            onClick={() => onSelect(r)}
          >
            <TableCell>
              <div className="flex items-center gap-3">
                <Avatar className="size-9">
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-500 text-xs text-white">
                    {initials(r.name, r.phoneNumber)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium leading-tight">{r.name || "—"}</p>
                  <p className="text-xs text-muted-foreground">{r.phoneNumber}</p>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <p className="text-sm leading-tight">{r.nearestStation || "—"}</p>
              <p className="text-xs text-muted-foreground">→ {r.destinationStation || "—"}</p>
            </TableCell>
            <TableCell className="text-sm uppercase text-muted-foreground">
              {r.language || "—"}
            </TableCell>
            <TableCell>
              <StatusBadge status={r.status} />
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {formatDate(r.createdAt)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
