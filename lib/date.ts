import {
  addDays,
  differenceInCalendarDays,
  formatISO,
  isAfter,
  isBefore,
  isSameDay,
  parseISO,
  startOfDay,
} from "date-fns";
import type { Task, ZoomLevel } from "@/lib/types";

const WINDOW_CONFIG: Record<ZoomLevel, { padding: number; minDays: number }> = {
  week: { padding: 7, minDays: 14 },
  month: { padding: 14, minDays: 35 },
  quarter: { padding: 21, minDays: 90 },
  year: { padding: 30, minDays: 365 },
};

/** Normalize a string/Date into a start-of-day Date instance (local time). */
export function parseDate(value: string | Date): Date {
  if (value instanceof Date) {
    return startOfDay(value);
  }
  return startOfDay(parseISO(value));
}

/** Convert a string/Date into an ISO `yyyy-MM-dd` string. */
export function toISODate(value: string | Date): string {
  return formatISO(parseDate(value), { representation: "date" });
}

/** Generate an inclusive list of ISO days between the supplied range. */
export function getDateSpan(start: string, end: string): string[] {
  const startDate = parseDate(start);
  const endDate = parseDate(end);
  const days: string[] = [];

  if (isAfter(startDate, endDate)) {
    return days;
  }

  let cursor = startDate;
  while (!isAfter(cursor, endDate)) {
    days.push(toISODate(cursor));
    cursor = addDays(cursor, 1);
  }

  return days;
}

/** Return the number of whole days between the start and end values. */
export function diffInDays(start: string, end: string): number {
  const startDate = parseDate(start);
  const endDate = parseDate(end);
  return differenceInCalendarDays(endDate, startDate);
}

/** Number of days between timeline start and a target date. */
export function offsetFromStart(start: string, date: string): number {
  return differenceInCalendarDays(parseDate(date), parseDate(start));
}

/** Clamp a date string within the provided min/max range. */
export function clampDate(value: string, min: string, max: string): string {
  const date = parseDate(value);
  const minDate = parseDate(min);
  const maxDate = parseDate(max);

  if (isBefore(date, minDate)) {
    return toISODate(minDate);
  }
  if (isAfter(date, maxDate)) {
    return toISODate(maxDate);
  }

  return toISODate(date);
}

/** Whether start and end fall on the same day (milestone). */
export function isMilestone(start: string, end: string): boolean {
  const startDate = parseDate(start);
  const endDate = parseDate(end);
  return isSameDay(startDate, endDate);
}

export function getZoomStep(zoom: ZoomLevel): number {
  return zoom === "week" ? 7 : 30;
}

export function expandRangeAround(
  anchor: string,
  zoom: ZoomLevel,
  padding = 1,
): {
  start: string;
  end: string;
} {
  const anchorDate = parseDate(anchor);
  const step = getZoomStep(zoom);
  const total = step * padding;
  const rangeStart = addDays(anchorDate, -total);
  const rangeEnd = addDays(anchorDate, total);

  return {
    start: toISODate(rangeStart),
    end: toISODate(rangeEnd),
  };
}

export function sortByDate(isoDates: string[]): string[] {
  return [...isoDates].sort((a, b) => {
    const left = parseDate(a).getTime();
    const right = parseDate(b).getTime();
    return left - right;
  });
}

export function getTodayISO(): string {
  return toISODate(new Date());
}

export function snapToDay(date: Date): Date {
  return startOfDay(date);
}

/**
 * Determine the visible window for the timeline based on tasks and zoom level.
 */
export function calculateTimelineWindow(tasks: Task[], zoom: ZoomLevel) {
  const today = parseDate(new Date());
  const { padding, minDays } = WINDOW_CONFIG[zoom] ?? WINDOW_CONFIG.month;

  if (!tasks.length) {
    const start = addDays(today, -Math.floor(minDays / 2));
    const end = addDays(start, minDays);
    const startISO = toISODate(start);
    const endISO = toISODate(end);
    return {
      start: startISO,
      end: endISO,
      dates: getDateSpan(startISO, endISO),
    };
  }

  let min = parseDate(tasks[0].start);
  let max = parseDate(tasks[0].end);

  tasks.forEach((task) => {
    const start = parseDate(task.start);
    const end = parseDate(task.end);
    if (isBefore(start, min)) {
      min = start;
    }
    if (isAfter(end, max)) {
      max = end;
    }
  });

  if (isBefore(today, min)) {
    min = today;
  }
  if (isAfter(today, max)) {
    max = today;
  }

  const paddedStart = addDays(min, -padding);
  const paddedEnd = addDays(max, padding);
  let startISO = toISODate(paddedStart);
  let endISO = toISODate(paddedEnd);

  const currentSpan = diffInDays(startISO, endISO);
  if (currentSpan < minDays) {
    const missing = minDays - currentSpan;
    const expandStart = Math.floor(missing / 2);
    const expandEnd = missing - expandStart;
    startISO = toISODate(addDays(parseDate(startISO), -expandStart));
    endISO = toISODate(addDays(parseDate(endISO), expandEnd));
  }

  return {
    start: startISO,
    end: endISO,
    dates: getDateSpan(startISO, endISO),
  };
}
