import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ChartCard } from "@/components/charts/ChartCard";
import { CATEGORY_COLORS, chartTooltipStyle } from "@/lib/chart-theme";

export function TravelFrequencyChart({ data }) {
  return (
    <ChartCard title="Travel frequency" description="How often respondents commute">
      <div className="h-56 w-full">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="count" nameKey="label" innerRadius={52} outerRadius={80} paddingAngle={2}>
              {data.map((entry, i) => (
                <Cell key={entry.label} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={chartTooltipStyle} />
            <Legend verticalAlign="bottom" height={24} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
