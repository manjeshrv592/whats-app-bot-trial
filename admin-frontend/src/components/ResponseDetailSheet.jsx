import { useQuery } from "@tanstack/react-query";
import { fetchResponseDetail } from "@/lib/api";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/StatusBadge";
import { Separator } from "@/components/ui/separator";
import { WhatsAppTranscript } from "@/components/WhatsAppTranscript";

const FIELD_LABELS = {
  travelFrequency: "Travel frequency",
  homeArea: "Home area",
  nearestStation: "Nearest station",
  feederMode: "Feeder mode (home → station)",
  destinationStation: "Destination station",
  distributionMode: "Mode (station → destination)",
  destinationArea: "Destination area",
  email: "Email",
  smartCardNumber: "Smart card number",
};

export function ResponseDetailSheet({ phoneNumber, onOpenChange }) {
  const { data, isLoading } = useQuery({
    queryKey: ["response", phoneNumber],
    queryFn: () => fetchResponseDetail(phoneNumber),
    enabled: !!phoneNumber,
  });

  return (
    <Sheet open={!!phoneNumber} onOpenChange={(open) => !open && onOpenChange(null)}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        {isLoading || !data ? (
          <div className="space-y-3 p-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <>
            <SheetHeader>
              <SheetTitle>{data.name || "Unnamed respondent"}</SheetTitle>
              <SheetDescription>{data.phoneNumber}</SheetDescription>
            </SheetHeader>

            <div className="space-y-5 px-4 pb-6">
              <StatusBadge status={data.status} />

              <div className="grid grid-cols-1 gap-3 text-sm">
                {Object.entries(FIELD_LABELS).map(([key, label]) => (
                  <div key={key} className="flex justify-between gap-4">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="text-right font-medium">{data[key] || "—"}</span>
                  </div>
                ))}
              </div>

              <Separator />

              <div>
                <h3 className="mb-2 text-sm font-semibold">Conversation transcript</h3>
                <WhatsAppTranscript
                  logs={data.conversationLogs}
                  name={data.name}
                  phoneNumber={data.phoneNumber}
                />
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
