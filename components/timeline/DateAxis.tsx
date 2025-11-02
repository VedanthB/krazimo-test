"use client";

import { memo } from "react";
import { format, parseISO } from "date-fns";

import { useTimeline } from "@/hooks/useTimeline";
import { useTimelineViewport } from "@/hooks/useTimelineViewport";
import { cn } from "@/lib/utils";

export const DateAxis = memo(function DateAxis() {
  const { state } = useTimeline();
  const viewport = useTimelineViewport();
  const mode = state.zoom;
  const isWeekView = mode === "week";
  const isYearView = mode === "year";

  const dayCells = viewport.dates.map((isoDate, index) => {
    const date = parseISO(isoDate);
    const previous = index > 0 ? parseISO(viewport.dates[index - 1]) : null;
    const monthBoundary = !previous || previous.getMonth() !== date.getMonth();
    const isWeekend = [0, 6].includes(date.getDay());
    const dayOfMonth = date.getDate();

    return {
      iso: isoDate,
      date,
      index,
      monthBoundary,
      isWeekend,
      dayOfMonth,
    };
  });

  const headerSegments = dayCells.reduce<Array<{ label: string; span: number }>>(
    (segments, day) => {
      if (isWeekView) {
        if (segments.length === 0 || day.index % 7 === 0) {
          segments.push({ label: `Week of ${format(day.date, "MMM d")}`, span: 1 });
        } else {
          segments[segments.length - 1].span += 1;
        }
      } else if (isYearView) {
        const quarter = Math.floor(day.date.getMonth() / 3) + 1;
        const segmentLabel = `Q${quarter} ${format(day.date, "yyyy")}`;
        const lastSegment = segments[segments.length - 1];
        if (lastSegment && lastSegment.label === segmentLabel) {
          lastSegment.span += 1;
        } else {
          segments.push({ label: segmentLabel, span: 1 });
        }
      } else {
        const segmentLabel = format(day.date, "MMM yyyy");
        const lastSegment = segments[segments.length - 1];
        if (lastSegment && lastSegment.label === segmentLabel) {
          lastSegment.span += 1;
        } else {
          segments.push({ label: segmentLabel, span: 1 });
        }
      }
      return segments;
    },
    [],
  );

  const rangeLabel =
    dayCells.length > 0
      ? `${format(dayCells[0].date, "MMM d")} – ${format(
          dayCells[dayCells.length - 1].date,
          "MMM d",
        )}`
      : "";
  const modeLabelMap = {
    week: `Week view · ${rangeLabel}`,
    month: `Month view · ${rangeLabel}`,
    quarter: `Quarter view · ${rangeLabel}`,
    year: `Year view · ${rangeLabel}`,
  } as const;
  const modeLabel = modeLabelMap[mode];

  const dayWidth = viewport.dayWidth;
  const showWeekdayLabels = isWeekView && dayWidth >= 32;
  const showWeekMonthBadge = isWeekView && dayWidth >= 40;
  const showMonthBadge = !isWeekView && dayWidth >= 28;

  const shouldHighlight = (day: (typeof dayCells)[number]) => {
    switch (mode) {
      case "week":
        return true;
      case "month":
        return (
          day.monthBoundary ||
          day.dayOfMonth === 1 ||
          day.dayOfMonth === 15 ||
          day.dayOfMonth % 5 === 0
        );
      case "quarter":
        return day.dayOfMonth === 1 || day.dayOfMonth === 15;
      case "year":
        return day.monthBoundary;
      default:
        return false;
    }
  };

  return (
    <div className="border-border bg-card/90 sticky top-0 z-10 border-b backdrop-blur">
      <div
        className="grid"
        style={{
          gridTemplateColumns: `${viewport.laneLabelWidth}px 1fr`,
          width: viewport.laneLabelWidth + viewport.contentWidth,
        }}
      >
        <div className="border-border text-muted-foreground flex flex-col border-r text-xs font-semibold uppercase">
          <div className="flex h-10 items-end px-4 pb-2 tracking-wide">Timeline</div>
          <div className="text-muted-foreground/80 flex h-14 items-start px-4 pt-2 text-[11px] font-medium normal-case">
            {modeLabel}
          </div>
        </div>
        <div className="flex flex-col" style={{ width: viewport.contentWidth }}>
          <div className="border-border text-muted-foreground flex h-10 items-end border-b text-[11px] font-semibold tracking-wide uppercase">
            {headerSegments.map((segment, index) => (
              <div
                key={`${segment.label}-${index}`}
                className="border-border flex h-full items-end justify-center border-r px-3 pb-1 last:border-r-0"
                style={{ width: segment.span * viewport.dayWidth }}
              >
                {segment.label}
              </div>
            ))}
          </div>
          <div className="flex" role="presentation">
            {dayCells.map((day) => {
              const monthLabel = format(day.date, "MMM");
              const dayNumber = format(day.date, "d");
              const weekday = format(day.date, "EEE");
              const quarterLabel = `Q${Math.floor(day.date.getMonth() / 3) + 1}`;
              const isQuarterStart = day.monthBoundary && day.date.getMonth() % 3 === 0;

              let topLabel: string | null = null;
              let middleLabel = "\u00A0";
              let badgeLabel: string | null = null;
              let dividerStrong = false;

              if (isWeekView) {
                topLabel = showWeekdayLabels ? weekday : null;
                middleLabel = dayNumber;
                dividerStrong = true;
                if (showWeekMonthBadge && day.monthBoundary) {
                  badgeLabel = monthLabel;
                }
              } else if (mode === "month") {
                if (day.monthBoundary && showMonthBadge) {
                  topLabel = monthLabel;
                }
                if (shouldHighlight(day)) {
                  middleLabel = dayNumber;
                  dividerStrong = true;
                }
              } else if (mode === "quarter") {
                if (day.monthBoundary) {
                  topLabel = monthLabel;
                }
                if (shouldHighlight(day)) {
                  middleLabel = day.dayOfMonth === 1 ? dayNumber : "15";
                  dividerStrong = true;
                }
              } else {
                if (day.monthBoundary) {
                  middleLabel = monthLabel;
                  dividerStrong = true;
                  if (isQuarterStart) {
                    topLabel = quarterLabel;
                  }
                } else if (day.dayOfMonth === 15 && dayWidth >= 8) {
                  middleLabel = "15";
                }
              }

              return (
                <div
                  key={day.iso}
                  className={cn(
                    "border-border flex h-16 flex-col justify-center gap-1 border-r text-[11px]",
                    day.isWeekend && mode === "week" && "bg-muted/60",
                  )}
                  style={{
                    width: viewport.dayWidth,
                    paddingLeft: viewport.dayWidth < 32 ? 4 : 8,
                    paddingRight: viewport.dayWidth < 32 ? 4 : 8,
                  }}
                >
                  {topLabel !== null ? (
                    <span className="text-muted-foreground text-[10px] font-semibold tracking-wide uppercase">
                      {topLabel}
                    </span>
                  ) : (
                    <span aria-hidden="true" />
                  )}
                  <span
                    className={cn(
                      "text-sm font-semibold text-slate-700",
                      !shouldHighlight(day) && "text-slate-300",
                    )}
                  >
                    {middleLabel}
                  </span>
                  {badgeLabel ? (
                    <span className="bg-primary/10 text-primary w-max rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide">
                      {badgeLabel}
                    </span>
                  ) : (
                    <span aria-hidden="true" />
                  )}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "mt-auto h-px w-full rounded-full",
                      dividerStrong ? "bg-slate-400/80" : "bg-slate-200/40",
                    )}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
});
