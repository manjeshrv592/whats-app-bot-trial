import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchResponses } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ResponsesTable } from "@/components/ResponsesTable";
import { ResponseDetailSheet } from "@/components/ResponseDetailSheet";

const PAGE_SIZE = 25;

export function ResponsesPage() {
  const [page, setPage] = useState(1);
  const [selectedPhone, setSelectedPhone] = useState(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["responses", page],
    queryFn: () => fetchResponses({ page, pageSize: PAGE_SIZE }),
  });

  const totalPages = data ? Math.max(Math.ceil(data.total / PAGE_SIZE), 1) : 1;

  return (
    <div className="space-y-6 pt-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Responses</h1>
        <p className="text-sm text-muted-foreground">
          All commuter survey submissions, newest first. Click a row for the full record.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : isError ? (
            <p className="p-6 text-sm text-destructive">Failed to load responses.</p>
          ) : data.responses.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No responses yet.</p>
          ) : (
            <ResponsesTable
              responses={data.responses}
              onSelect={(r) => setSelectedPhone(r.phoneNumber)}
            />
          )}
        </CardContent>
      </Card>

      {data && data.total > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {page} of {totalPages} · {data.total} total
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <ResponseDetailSheet phoneNumber={selectedPhone} onOpenChange={setSelectedPhone} />
    </div>
  );
}
