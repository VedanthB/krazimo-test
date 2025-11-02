"use client";

import { useEffect, useRef, type RefObject } from "react";

import { getTodayISO, offsetFromStart, parseDate } from "@/lib/date";

interface AutoScrollOptions {
  anchorTaskStart: string | null;
  start: string;
  end: string;
  dayWidth: number;
  laneLabelWidth: number;
  contentWidth: number;
  scrollRef: RefObject<HTMLDivElement | null>;
  canvasRef: RefObject<HTMLDivElement | null>;
}

/**
 * Smoothly scroll the horizontal viewport so the selected task (or today marker) is visible.
 *
 * @param options.anchorTaskStart - Start date of the active task, used as the primary anchor.
 * @param options.start - ISO start of the rendered timeline window.
 * @param options.end - ISO end of the rendered timeline window.
 * @param options.dayWidth - Pixel width assigned to a single day cell.
 * @param options.laneLabelWidth - Width of the fixed lane label column.
 * @param options.contentWidth - Total width of the timeline grid (used to clamp scroll).
 * @param options.scrollRef - Ref to the scrollable container that should be animated.
 * @param options.canvasRef - Ref to the canvas element containing the today marker.
 */
export function useAutoScrollToToday({
  anchorTaskStart,
  start,
  end,
  dayWidth,
  laneLabelWidth,
  contentWidth,
  scrollRef,
  canvasRef,
}: AutoScrollOptions) {
  const initialScrollDone = useRef(false);

  useEffect(() => {
    initialScrollDone.current = false;
  }, [start, end, dayWidth, laneLabelWidth, contentWidth]);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) {
      return;
    }

    const anchorISO = anchorTaskStart;
    const todayISO = getTodayISO();
    const rangeStart = parseDate(start);
    const rangeEnd = parseDate(end);
    let targetISO: string | null = null;

    if (anchorISO) {
      const anchorDate = parseDate(anchorISO);
      if (anchorDate >= rangeStart && anchorDate <= rangeEnd) {
        targetISO = anchorISO;
      }
    }

    if (!targetISO) {
      const todayDate = parseDate(todayISO);
      if (todayDate >= rangeStart && todayDate <= rangeEnd) {
        targetISO = todayISO;
      }
    }

    if (!targetISO) {
      return;
    }

    let cancelled = false;

    const performScroll = () => {
      if (cancelled) {
        return;
      }
      const marker = canvasRef.current?.querySelector<HTMLElement>('[data-today-marker="true"]');
      let targetLeft = 0;
      if (marker) {
        const markerWidth = marker.offsetWidth || 0;
        targetLeft = marker.offsetLeft - node.clientWidth / 2 + markerWidth / 2;
      } else {
        const offsetDays = Math.max(offsetFromStart(start, targetISO!), 0);
        targetLeft = offsetDays * dayWidth + laneLabelWidth - node.clientWidth / 2 + dayWidth / 2;
      }
      const maxScrollLeft = Math.max(node.scrollWidth - node.clientWidth, 0);
      const clamped = Math.min(Math.max(targetLeft, 0), maxScrollLeft);

      if (!initialScrollDone.current) {
        node.scrollTo({ left: 0, behavior: "auto" });
        requestAnimationFrame(() => {
          node.scrollTo({ left: clamped, behavior: "smooth" });
        });
        initialScrollDone.current = true;
        return;
      }

      node.scrollTo({ left: clamped, behavior: "smooth" });
      initialScrollDone.current = true;
    };

    const checkReady = () => {
      if (cancelled) {
        return;
      }
      const marker = canvasRef.current?.querySelector<HTMLElement>('[data-today-marker="true"]');
      if (marker || initialScrollDone.current) {
        performScroll();
        return;
      }
      requestAnimationFrame(checkReady);
    };

    checkReady();

    return () => {
      cancelled = true;
    };
  }, [anchorTaskStart, start, end, dayWidth, laneLabelWidth, contentWidth, scrollRef, canvasRef]);
}
