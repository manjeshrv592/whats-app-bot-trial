import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard } from "@/components/charts/ChartCard";
import { INDIGO, chartAxisTick, chartTooltipStyle, formatDayLabel } from "@/lib/chart-theme";

export function ResponseVolumeChart({ data }) {
  return (
    <ChartCard title="Response volume" description="Survey submissions over time">
      <div className="h-64 w-full">
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
            <defs>
              <linearGradient id="volumeFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={INDIGO} stopOpacity={0.35} />
                <stop offset="100%" stopColor={INDIGO} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="day"
              tickFormatter={formatDayLabel}
              tick={chartAxisTick}
              interval={Math.floor(data.length / 8)}
              tickLine={false}
              axisLine={false}
            />
            <YAxis tick={chartAxisTick} tickLine={false} axisLine={false} width={44} />
            <Tooltip
              contentStyle={chartTooltipStyle}
              labelFormatter={formatDayLabel}
              formatter={(value) => [value, "Responses"]}
            />
            <Area type="monotone" dataKey="count" stroke={INDIGO} strokeWidth={2} fill="url(#volumeFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
