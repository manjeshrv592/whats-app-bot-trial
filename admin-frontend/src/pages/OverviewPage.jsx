import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock, ListChecks, XCircle } from "lucide-react";
import { fetchResponses } from "@/lib/api";
import { StatCard } from "@/components/StatCard";
import { Skeleton } from "@/components/ui/skeleton";

export function OverviewPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["responses", "overview"],
    queryFn: () => fetchResponses({ page: 1, pageSize: 1000 }),
  });

  const counts = { COMPLETED: 0, IN_PROGRESS: 0, DECLINED: 0, NOT_STARTED: 0 };
  for (const r of data?.responses ?? []) {
    counts[r.status] = (counts[r.status] ?? 0) + 1;
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 pt-6 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <p className="pt-6 text-sm text-destructive">Failed to load overview data.</p>;
  }

  return (
    <div className="space-y-6 pt-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground">
          Snapshot of the Namma Transit commuter survey responses collected so far.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total responses"
          value={data.total}
          icon={ListChecks}
          gradient="bg-gradient-to-br from-indigo-500 to-violet-500"
        />
        <StatCard
          label="Completed"
          value={counts.COMPLETED}
          icon={CheckCircle2}
          gradient="bg-gradient-to-br from-emerald-500 to-teal-500"
        />
        <StatCard
          label="In progress"
          value={counts.IN_PROGRESS}
          icon={Clock}
          gradient="bg-gradient-to-br from-amber-500 to-orange-500"
        />
        <StatCard
          label="Declined"
          value={counts.DECLINED}
          icon={XCircle}
          gradient="bg-gradient-to-br from-rose-500 to-red-500"
        />
      </div>
    </div>
  );
}
