import { Card, CardContent } from "@/components/ui/card";

export function StatCard({ label, value, icon: Icon, gradient }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-2">
        <div
          className={`flex size-11 shrink-0 items-center justify-center rounded-xl text-white ${gradient}`}
        >
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-2xl font-semibold tracking-tight">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
