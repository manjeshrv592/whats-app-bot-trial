import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard } from "@/components/charts/ChartCard";
import { SKY, chartAxisTick, chartTooltipStyle, formatHourLabel } from "@/lib/chart-theme";

export function TimeOfDayChart({ data }) {
  return (
    <ChartCard title="Time of day" description="When respondents complete the survey — a proxy for actual commute times">
      <div className="h-64 w-full">
        <ResponsiveContainer>
          <BarChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="hour"
              tickFormatter={formatHourLabel}
              tick={chartAxisTick}
              tickLine={false}
              axisLine={false}
              interval={1}
            />
            <YAxis tick={chartAxisTick} tickLine={false} axisLine={false} width={44} />
            <Tooltip
              contentStyle={chartTooltipStyle}
              labelFormatter={formatHourLabel}
              formatter={(value) => [value, "Responses"]}
            />
            <Bar dataKey="count" fill={SKY} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
