"use client";

import { useEffect, useState } from "react";

/** Live countdown to a target time, e.g. "2d 4h 12m" or "31:05" */
export function Countdown({
  target,
  onComplete,
}: {
  target: string;
  onComplete?: () => void;
}) {
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, new Date(target).getTime() - Date.now()),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const next = Math.max(0, new Date(target).getTime() - Date.now());
      setRemaining(next);
      if (next === 0) {
        clearInterval(interval);
        onComplete?.();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [target, onComplete]);

  const totalSeconds = Math.floor(remaining / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return <span>{days}d {hours}h {minutes}m</span>;
  if (hours > 0) return <span>{hours}h {minutes}m {String(seconds).padStart(2, "0")}s</span>;
  return (
    <span className="font-mono">
      {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
    </span>
  );
}

export const STATUS_STYLES: Record<string, string> = {
  live: "border-success/40 bg-success/10 text-success",
  upcoming: "border-primary/40 bg-primary/10 text-primary",
  ended: "border-border bg-muted text-muted-foreground",
};
