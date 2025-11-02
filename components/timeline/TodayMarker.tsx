"use client";

import { useMemo } from "react";

import { useTimelineViewport } from "@/hooks/useTimelineViewport";
import { getTodayISO, offsetFromStart, parseDate, toISODate } from "@/lib/date";

export function TodayMarker() {
  const viewport = useTimelineViewport();

  const marker = useMemo(() => {
    const today = getTodayISO();
    const todayDate = parseDate(today);
    const startDate = parseDate(viewport.start);
    const endDate = parseDate(viewport.end);

    if (todayDate < startDate || todayDate > endDate) {
      return null;
    }

    const offsetDays = offsetFromStart(viewport.start, today);
    const left = offsetDays * viewport.dayWidth + viewport.dayWidth / 2;
    const clampedLeft = Math.min(Math.max(left, 0), viewport.contentWidth);

    return {
      date: toISODate(todayDate),
      left: clampedLeft,
    };
  }, [viewport.contentWidth, viewport.dayWidth, viewport.end, viewport.start]);

  if (!marker) {
    return null;
  }

  return (
    <div
      role="presentation"
      data-today-marker="true"
      className="pointer-events-none absolute inset-y-0 z-10 flex flex-col items-center"
      style={{ left: marker.left + viewport.laneLabelWidth }}
    >
      <span className="border-primary/30 bg-card/95 text-primary mb-2 rounded-md border px-2 py-1 text-[10px] font-semibold tracking-wide shadow">
        Today · {marker.date}
      </span>
      <span className="border-primary/50 w-px flex-1 border-l border-dashed" />
      <span className="block h-1" />
    </div>
  );
}
