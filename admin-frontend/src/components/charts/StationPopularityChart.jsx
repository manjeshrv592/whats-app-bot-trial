import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard } from "@/components/charts/ChartCard";
import { TEAL, chartAxisTick, chartTooltipStyle } from "@/lib/chart-theme";

export function StationPopularityChart({ data }) {
  return (
    <ChartCard title="Nearest station" description="Most common station, normalized across languages">
      <div className="h-72 w-full">
        <ResponsiveContainer>
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 8 }}>
            <CartesianGrid horizontal={false} stroke="var(--border)" />
            <XAxis type="number" tick={chartAxisTick} tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="label" tick={chartAxisTick} tickLine={false} axisLine={false} width={140} />
            <Tooltip contentStyle={chartTooltipStyle} formatter={(value) => [value, "Responses"]} />
            <Bar dataKey="count" fill={TEAL} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
