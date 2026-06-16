"use client";

import { useState, useEffect } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { HeatmapDay } from "@/services/stats";

const WEEKS = 53;
const DAY_MS = 86_400_000;

function heatClass(count: number): string {
  if (count <= 0) return "bg-heat-0";
  if (count === 1) return "bg-heat-1";
  if (count <= 3) return "bg-heat-2";
  if (count <= 6) return "bg-heat-3";
  return "bg-heat-4";
}

/** GitHub-style contribution heatmap of accepted solves over the past year */
export function ActivityHeatmap({ days }: { days: HeatmapDay[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const counts = new Map(days.map((day) => [day.date, day.count]));

  // Align the grid so the last column ends on today (UTC)
  const today = new Date();
  const end = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate(),
  );
  const endDayOfWeek = new Date(end).getUTCDay();
  const start = end - (WEEKS * 7 - (6 - endDayOfWeek) - 1) * DAY_MS;

  const columns: { date: string; count: number; future: boolean }[][] = [];
  for (let week = 0; week < WEEKS; week++) {
    const column: { date: string; count: number; future: boolean }[] = [];
    for (let day = 0; day < 7; day++) {
      const time = start + (week * 7 + day) * DAY_MS;
      const date = new Date(time).toISOString().slice(0, 10);
      column.push({
        date,
        count: counts.get(date) ?? 0,
        future: time > end,
      });
    }
    columns.push(column);
  }

  const monthLabels: { index: number; label: string }[] = [];
  let lastMonth = -1;
  columns.forEach((column, index) => {
    const month = new Date(column[0].date).getUTCMonth();
    if (month !== lastMonth) {
      monthLabels.push({
        index,
        label: new Date(column[0].date).toLocaleString("en", {
          month: "short",
          timeZone: "UTC",
        }),
      });
      lastMonth = month;
    }
  });

  if (!mounted) return <div className="h-18" />;

  return (
    <div className="overflow-x-auto">
      <div className="min-w-fit">
        <div className="relative mb-1 h-4">
          {monthLabels.slice(1).map((month) => (
            <span
              key={`${month.label}-${month.index}`}
              className="absolute text-[10px] text-muted-foreground"
              style={{ left: `${month.index * 13}px` }}
            >
              {month.label}
            </span>
          ))}
        </div>
        <div className="flex gap-[3px]">
          {columns.map((column, columnIndex) => (
            <div key={columnIndex} className="flex flex-col gap-[3px]">
              {column.map((cell) =>
                cell.future ? (
                  <span key={cell.date} className="size-2.5 rounded-[3px]" />
                ) : (
                  <Tooltip key={cell.date}>
                    <TooltipTrigger asChild>
                      <span
                        className={`size-2.5 rounded-[3px] ${heatClass(cell.count)}`}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      {cell.count} solved on {cell.date}
                    </TooltipContent>
                  </Tooltip>
                ),
              )}
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
          Less
          {[0, 1, 2, 4, 7].map((count) => (
            <span
              key={count}
              className={`size-2.5 rounded-[3px] ${heatClass(count)}`}
            />
          ))}
          More
        </div>
      </div>
    </div>
  );
}
