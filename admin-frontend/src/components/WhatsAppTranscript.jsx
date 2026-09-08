import { Check, CheckCheck, Phone, Video } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDay(iso) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function WhatsAppTranscript({ logs, name, phoneNumber }) {
  const initials = (name || phoneNumber || "?").slice(0, 2).toUpperCase();
  const day = logs?.[0] ? formatDay(logs[0].createdAt) : null;

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 shadow-sm">
      {/* WhatsApp-style header */}
      <div className="flex items-center gap-3 bg-[#075E54] px-4 py-3 text-white">
        <Avatar className="size-9">
          <AvatarFallback className="bg-white/15 text-xs text-white">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{name || "Survey respondent"}</p>
          <p className="truncate text-[11px] text-white/70">{phoneNumber}</p>
        </div>
        <Video className="size-4 text-white/80" />
        <Phone className="size-4 text-white/80" />
      </div>

      {/* Chat body */}
      <div
        className="max-h-[420px] space-y-2 overflow-y-auto px-3 py-4"
        style={{
          backgroundColor: "#E5DDD5",
          backgroundImage:
            "radial-gradient(rgba(0,0,0,0.035) 1px, transparent 1px)",
          backgroundSize: "16px 16px",
        }}
      >
        {day && (
          <div className="mb-2 flex justify-center">
            <span className="rounded-md bg-white/80 px-2.5 py-1 text-[11px] font-medium text-neutral-600 shadow-sm">
              {day}
            </span>
          </div>
        )}

        {logs?.map((log) => {
          const isRespondent = log.direction === "in";
          return (
            <div
              key={log.id}
              className={`flex ${isRespondent ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-3 py-2 text-[13px] leading-relaxed shadow-sm ${
                  isRespondent
                    ? "rounded-tr-sm bg-[#DCF8C6] text-neutral-800"
                    : "rounded-tl-sm bg-white text-neutral-800"
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{log.messageText}</p>
                <div
                  className={`mt-1 flex items-center gap-1 text-[10px] text-neutral-500 ${
                    isRespondent ? "justify-end" : "justify-end"
                  }`}
                >
                  <span>{formatTime(log.createdAt)}</span>
                  {isRespondent ? (
                    <CheckCheck className="size-3.5 text-neutral-400" />
                  ) : (
                    <Check className="size-3.5 text-neutral-400" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
