"use client";

import { useMemo } from "react";

import { densityConfig } from "@/components/timeline/constants";
import { calculateTimelineWindow } from "@/lib/date";
import type { Density, Lane, Task, ZoomLevel } from "@/lib/types";

interface TimelineDerivedDataParams {
  tasks: Task[];
  lanes: Lane[];
  density: Density;
  zoom: ZoomLevel;
}

interface TimelineDerivedData {
  timeWindow: ReturnType<typeof calculateTimelineWindow>;
  dayWidth: number;
  contentWidth: number;
  baseLaneHeight: number;
  densityPreset: (typeof densityConfig)[keyof typeof densityConfig];
  laneTasks: Map<string, Task[]>;
  tasksById: Map<string, Task>;
}

/**
 * Compute derived timeline geometry (window, widths, lane maps) from raw state.
 *
 * @param params.tasks - Current task list.
 * @param params.lanes - Lane ordering for the timeline.
 * @param params.density - Active density preset.
 * @param params.zoom - Current zoom level (week/month/quarter/year).
 *
 * @returns Memoised geometry values consumed by the canvas layer.
 */
export function useTimelineDerivedData({
  tasks,
  lanes,
  density,
  zoom,
}: TimelineDerivedDataParams): TimelineDerivedData {
  const timeWindow = useMemo(() => calculateTimelineWindow(tasks, zoom), [tasks, zoom]);

  const densityPreset = densityConfig[density] ?? densityConfig.compact;

  const dayWidth = useMemo(() => {
    switch (zoom) {
      case "week":
        return densityPreset.dayWidthWeek;
      case "month":
        return densityPreset.dayWidthMonth;
      case "quarter":
        return densityPreset.dayWidthQuarter;
      case "year":
        return densityPreset.dayWidthYear;
      default:
        return densityPreset.dayWidthMonth;
    }
  }, [densityPreset, zoom]);

  const contentWidth = useMemo(() => {
    return Math.max(timeWindow.dates.length * dayWidth, densityPreset.minContentWidth);
  }, [dayWidth, densityPreset.minContentWidth, timeWindow.dates.length]);

  const baseLaneHeight = useMemo(() => {
    return densityPreset.laneBasePadding * 2 + densityPreset.laneRowHeight;
  }, [densityPreset.laneBasePadding, densityPreset.laneRowHeight]);

  const laneTasks = useMemo(() => {
    const map = new Map<string, Task[]>();
    lanes.forEach((lane) => map.set(lane.id, []));
    tasks.forEach((task) => {
      const collection = map.get(task.laneId);
      if (collection) {
        collection.push(task);
      } else {
        map.set(task.laneId, [task]);
      }
    });
    return map;
  }, [lanes, tasks]);

  const tasksById = useMemo(() => {
    const map = new Map<string, Task>();
    tasks.forEach((task) => {
      map.set(task.id, task);
    });
    return map;
  }, [tasks]);

  return {
    timeWindow,
    dayWidth,
    contentWidth,
    baseLaneHeight,
    densityPreset,
    laneTasks,
    tasksById,
  };
}
