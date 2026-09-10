import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard } from "@/components/charts/ChartCard";
import { AMBER, INDIGO, chartAxisTick, chartTooltipStyle } from "@/lib/chart-theme";

export function ModeOfTravelChart({ data }) {
  return (
    <ChartCard title="Mode of travel" description="Getting to the station vs. from it to the destination">
      <div className="h-72 w-full">
        <ResponsiveContainer>
          <BarChart data={data} margin={{ left: -16, right: 8, top: 8 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis dataKey="label" tick={chartAxisTick} tickLine={false} axisLine={false} />
            <YAxis tick={chartAxisTick} tickLine={false} axisLine={false} width={36} />
            <Tooltip contentStyle={chartTooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="feeder" name="Home → station" fill={INDIGO} radius={[4, 4, 0, 0]} />
            <Bar dataKey="distribution" name="Station → destination" fill={AMBER} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
