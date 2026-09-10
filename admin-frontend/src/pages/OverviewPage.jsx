import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock, ListChecks, XCircle } from "lucide-react";
import { fetchAnalytics, fetchStats } from "@/lib/api";
import { StatCard } from "@/components/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { ResponseVolumeChart } from "@/components/charts/ResponseVolumeChart";
import { CompletionFunnelChart } from "@/components/charts/CompletionFunnelChart";
import { TravelFrequencyChart } from "@/components/charts/TravelFrequencyChart";
import { WeeklyPatternChart } from "@/components/charts/WeeklyPatternChart";
import { StationPopularityChart } from "@/components/charts/StationPopularityChart";
import { ModeOfTravelChart } from "@/components/charts/ModeOfTravelChart";
import { TimeOfDayChart } from "@/components/charts/TimeOfDayChart";

export function OverviewPage() {
  const { data: stats, isLoading: statsLoading, isError: statsError } = useQuery({
    queryKey: ["stats", "overview"],
    queryFn: fetchStats,
  });
  const { data: analytics, isLoading: analyticsLoading, isError: analyticsError } = useQuery({
    queryKey: ["analytics"],
    queryFn: fetchAnalytics,
  });

  return (
    <div className="space-y-6 pt-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground">
          Snapshot of the Namma Transit commuter survey responses collected so far.
        </p>
      </div>

      {statsLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : statsError ? (
        <p className="text-sm text-destructive">Failed to load overview data.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total responses"
            value={stats.total}
            icon={ListChecks}
            gradient="bg-gradient-to-br from-indigo-500 to-violet-500"
          />
          <StatCard
            label="Completed"
            value={stats.completed}
            icon={CheckCircle2}
            gradient="bg-gradient-to-br from-emerald-500 to-teal-500"
          />
          <StatCard
            label="In progress"
            value={stats.inProgress}
            icon={Clock}
            gradient="bg-gradient-to-br from-amber-500 to-orange-500"
          />
          <StatCard
            label="Declined"
            value={stats.declined}
            icon={XCircle}
            gradient="bg-gradient-to-br from-rose-500 to-red-500"
          />
        </div>
      )}

      {analyticsLoading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-xl" />
          ))}
        </div>
      ) : analyticsError ? (
        <p className="text-sm text-destructive">Failed to load analytics.</p>
      ) : (
        <>
          <ResponseVolumeChart data={analytics.daily} />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {stats && <CompletionFunnelChart stats={stats} />}
            <TravelFrequencyChart data={analytics.frequency} />
            <WeeklyPatternChart data={analytics.weekday} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <StationPopularityChart data={analytics.stations} />
            <ModeOfTravelChart data={analytics.modes} />
          </div>

          <TimeOfDayChart data={analytics.hours} />
        </>
      )}
    </div>
  );
}
