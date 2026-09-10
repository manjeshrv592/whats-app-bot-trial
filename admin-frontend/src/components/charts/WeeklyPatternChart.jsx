import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard } from "@/components/charts/ChartCard";
import { VIOLET, chartAxisTick, chartTooltipStyle } from "@/lib/chart-theme";

export function WeeklyPatternChart({ data }) {
  return (
    <ChartCard title="Weekly pattern" description="Responses by day of week">
      <div className="h-56 w-full">
        <ResponsiveContainer>
          <BarChart data={data} margin={{ left: -16, right: 8, top: 8 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis dataKey="day" tick={chartAxisTick} tickLine={false} axisLine={false} />
            <YAxis tick={chartAxisTick} tickLine={false} axisLine={false} width={36} />
            <Tooltip contentStyle={chartTooltipStyle} formatter={(value) => [value, "Responses"]} />
            <Bar dataKey="count" fill={VIOLET} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
