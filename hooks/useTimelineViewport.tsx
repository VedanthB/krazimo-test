"use client";

import { createContext, useContext, type ReactNode } from "react";

interface TimelineViewportValue {
  start: string;
  end: string;
  dates: string[];
  dayWidth: number;
  contentWidth: number;
  laneLabelWidth: number;
  laneBasePadding: number;
  laneRowHeight: number;
  laneRowGap: number;
}

const TimelineViewportContext = createContext<TimelineViewportValue | null>(null);

export function TimelineViewportProvider({
  value,
  children,
}: {
  value: TimelineViewportValue;
  children: ReactNode;
}) {
  return (
    <TimelineViewportContext.Provider value={value}>{children}</TimelineViewportContext.Provider>
  );
}

export function useTimelineViewport() {
  const context = useContext(TimelineViewportContext);
  if (!context) {
    throw new Error("useTimelineViewport must be used within a TimelineViewportProvider");
  }
  return context;
}
