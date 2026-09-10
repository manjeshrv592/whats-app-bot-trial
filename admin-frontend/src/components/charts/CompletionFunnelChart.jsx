import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ChartCard } from "@/components/charts/ChartCard";
import { AMBER, EMERALD, ROSE, chartTooltipStyle } from "@/lib/chart-theme";

// Reads directly from /api/admin/stats's shape ({ completed, inProgress, declined })
// rather than deriving it client-side, so this always matches the stat cards above it.
export function CompletionFunnelChart({ stats }) {
  const funnel = [
    { label: "Completed", value: stats.completed, color: EMERALD },
    { label: "In progress", value: stats.inProgress, color: AMBER },
    { label: "Declined", value: stats.declined, color: ROSE },
  ].filter((entry) => entry.value > 0);

  return (
    <ChartCard title="Completion funnel" description="How respondents finish">
      <div className="h-56 w-full">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={funnel} dataKey="value" nameKey="label" innerRadius={52} outerRadius={80} paddingAngle={2}>
              {funnel.map((entry) => (
                <Cell key={entry.label} fill={entry.color} />
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
