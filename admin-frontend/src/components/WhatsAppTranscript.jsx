import { Check, CheckCheck } from "lucide-react";
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

// webhook.js's describeInput() logs location messages as exactly "lat,lng" —
// match that shape to swap the raw text for a map thumbnail.
const LOCATION_REGEX = /^(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/;

// No static-map API is free-and-keyless anymore, so we stitch a small OSM
// tile mosaic ourselves — a 2x2 grid is always enough to cover a 220x140
// window regardless of where the point falls within its tile.
const TILE_SIZE = 256;
const MAP_ZOOM = 16;
const MAP_WIDTH = 220;
const MAP_HEIGHT = 140;

function lonLatToPixel(lon, lat, zoom) {
  const latRad = (lat * Math.PI) / 180;
  const n = TILE_SIZE * 2 ** zoom;
  const x = ((lon + 180) / 360) * n;
  const y = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
  return { x, y };
}

function LocationBubble({ lat, lng }) {
  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);
  const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

  const { x, y } = lonLatToPixel(lngNum, latNum, MAP_ZOOM);
  const tx0 = Math.floor((x - MAP_WIDTH / 2) / TILE_SIZE);
  const ty0 = Math.floor((y - MAP_HEIGHT / 2) / TILE_SIZE);
  const offsetLeft = -(x - MAP_WIDTH / 2 - tx0 * TILE_SIZE);
  const offsetTop = -(y - MAP_HEIGHT / 2 - ty0 * TILE_SIZE);

  return (
    <a
      href={mapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="relative block overflow-hidden rounded-sm bg-neutral-200"
      style={{ width: MAP_WIDTH, height: MAP_HEIGHT }}
    >
      <div
        className="absolute"
        style={{ left: offsetLeft, top: offsetTop, width: TILE_SIZE * 2, height: TILE_SIZE * 2 }}
      >
        {[0, 1].map((dx) =>
          [0, 1].map((dy) => (
            <img
              key={`${dx}-${dy}`}
              src={`https://tile.openstreetmap.org/${MAP_ZOOM}/${tx0 + dx}/${ty0 + dy}.png`}
              alt=""
              width={TILE_SIZE}
              height={TILE_SIZE}
              className="absolute"
              style={{ left: dx * TILE_SIZE, top: dy * TILE_SIZE }}
            />
          ))
        )}
      </div>
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="#EA4335"
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full drop-shadow"
      >
        <path d="M12 0C7.6 0 4 3.6 4 8c0 5.4 7 15.6 7.3 16a.9.9 0 0 0 1.4 0C13 23.6 20 13.4 20 8c0-4.4-3.6-8-8-8zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" />
      </svg>
    </a>
  );
}

export function WhatsAppTranscript({ logs, name, phoneNumber }) {
  const initials = (name || phoneNumber || "?").slice(0, 2).toUpperCase();
  const day = logs?.[0] ? formatDay(logs[0].createdAt) : null;

  return (
    <div className="overflow-hidden rounded-lg border border-border/60 shadow-sm">
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
          const isBot = log.direction === "out";
          const locationMatch = log.messageText?.match(LOCATION_REGEX);
          return (
            <div
              key={log.id}
              className={`flex ${isBot ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-md text-[13px] leading-relaxed shadow-sm ${
                  locationMatch ? "overflow-hidden p-1" : "px-3 py-2"
                } ${
                  isBot
                    ? "rounded-tr-none bg-[#DCF8C6] text-neutral-800"
                    : "rounded-tl-none bg-white text-neutral-800"
                }`}
              >
                {locationMatch ? (
                  <LocationBubble lat={locationMatch[1]} lng={locationMatch[2]} />
                ) : (
                  <p className="whitespace-pre-wrap break-words">{log.messageText}</p>
                )}
                <div className={`mt-1 flex items-center justify-end gap-1 text-[10px] text-neutral-500 ${locationMatch ? "px-2 pb-1" : ""}`}>
                  <span>{formatTime(log.createdAt)}</span>
                  {isBot ? (
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
