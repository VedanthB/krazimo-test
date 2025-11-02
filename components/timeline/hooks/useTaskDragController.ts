"use client";

import { useCallback, useMemo, useState } from "react";
import { addDays } from "date-fns";
import {
  PointerSensor,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
  type Modifier,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import { useTimelineDragPreview } from "@/components/timeline/hooks/useTimelineDragPreview";
import { diffInDays, offsetFromStart, parseDate, toISODate } from "@/lib/date";
import type { Task } from "@/lib/types";

export type DragInteraction = "move" | "resize-start" | "resize-end";

interface DragMetadata {
  taskId: string;
  type: DragInteraction;
}

interface TaskDragControllerParams {
  tasksById: Map<string, Task>;
  dayWidth: number;
  contentWidth: number;
  timeWindow: { start: string; end: string };
  updateTask: (task: Task) => void;
  selectTask: (taskId: string | null) => void;
}

interface TaskDragControllerResult {
  sensors: ReturnType<typeof useSensors>;
  snapToDayModifier: Modifier;
  handleDragStart: (event: DragStartEvent) => void;
  handleDragMove: (event: DragMoveEvent) => void;
  handleDragEnd: (event: DragEndEvent) => void;
  handleDragCancel: () => void;
  highlightLaneId: string | null;
  highlightRect: { left: number; width: number } | null;
  resizePreview: { taskId: string; left: number; width: number } | null;
  resizePreviewLaneId: string | null;
  activeLaneId: string | null;
}

/**
 * Safely parse the drag payload produced by dnd-kit into a structured metadata object.
 */
function resolveDragMetadata(payload: unknown): DragMetadata | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const candidate = payload as Partial<DragMetadata>;
  if (typeof candidate.taskId !== "string" || typeof candidate.type !== "string") {
    return null;
  }
  return {
    taskId: candidate.taskId,
    type: candidate.type as DragInteraction,
  };
}

/**
 * Produce a new ISO date string shifted by the provided day offset.
 */
function shiftDateString(value: string, offset: number): string {
  return toISODate(addDays(parseDate(value), offset));
}

/**
 * Centralised controller for task drag/resize interactions.
 *
 * @param params.tasksById - Quick lookup map for tasks.
 * @param params.dayWidth - Width of a single day cell in pixels.
 * @param params.contentWidth - Total scrollable width for the timeline grid.
 * @param params.timeWindow - Inclusive start/end bounds for the timeline.
 * @param params.updateTask - Dispatch helper for persisting task changes.
 * @param params.selectTask - Sets the active task selection.
 */
export function useTaskDragController({
  tasksById,
  dayWidth,
  contentWidth,
  timeWindow,
  updateTask,
  selectTask,
}: TaskDragControllerParams): TaskDragControllerResult {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  const [dragContext, setDragContext] = useState<{
    taskId: string;
    type: DragInteraction;
    baseStart: string;
    baseEnd: string;
    baseLane: string;
  } | null>(null);

  const { preview: dragPreview, updatePreview } = useTimelineDragPreview();

  const snapToDayModifier = useMemo<Modifier>(
    () =>
      ({ transform }) => ({
        ...transform,
        x: Math.round(transform.x / dayWidth) * dayWidth,
      }),
    [dayWidth],
  );

  const resetDragState = useCallback(() => {
    setDragContext(null);
    updatePreview(null);
  }, [updatePreview]);

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const data = resolveDragMetadata(event.active.data.current);
      if (!data) {
        return;
      }
      selectTask(data.taskId);
      const task = tasksById.get(data.taskId);
      if (!task) {
        return;
      }
      setDragContext({
        taskId: task.id,
        type: data.type,
        baseStart: task.start,
        baseEnd: task.end,
        baseLane: task.laneId,
      });
    },
    [selectTask, tasksById],
  );

  const handleDragMove = useCallback(
    (event: DragMoveEvent) => {
      if (!dragContext) {
        return;
      }
      const baseTask = tasksById.get(dragContext.taskId);
      if (!baseTask) {
        return;
      }
      const dayShift = Math.round(event.delta.x / dayWidth);

      let laneId = dragContext.baseLane;
      if (dragContext.type === "move") {
        laneId = (event.over?.data?.current as { laneId?: string } | undefined)?.laneId ?? laneId;
      }

      let nextStart = dragContext.baseStart;
      let nextEnd = dragContext.baseEnd;

      if (dragContext.type === "move") {
        nextStart = shiftDateString(dragContext.baseStart, dayShift);
        nextEnd = shiftDateString(dragContext.baseEnd, dayShift);
      } else if (dragContext.type === "resize-start") {
        nextStart = shiftDateString(dragContext.baseStart, dayShift);
      } else if (dragContext.type === "resize-end") {
        nextEnd = shiftDateString(dragContext.baseEnd, dayShift);
      }

      const offset = Math.max(offsetFromStart(timeWindow.start, nextStart), 0) * dayWidth;
      const widthDays = Math.max(diffInDays(nextStart, nextEnd) + 1, 1);
      const rawWidth = Math.max(widthDays * dayWidth, dayWidth);
      if (offset > contentWidth) {
        updatePreview(null);
        return;
      }
      const maxWidth = Math.max(contentWidth - offset, dayWidth);
      const clampedWidth = Math.min(rawWidth, maxWidth);

      updatePreview({
        taskId: dragContext.taskId,
        laneId,
        left: offset,
        width: clampedWidth,
        type: dragContext.type,
      });
    },
    [contentWidth, dayWidth, dragContext, timeWindow.start, tasksById, updatePreview],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const data = resolveDragMetadata(event.active.data.current);
      if (!data) {
        resetDragState();
        return;
      }

      const task = tasksById.get(data.taskId);
      if (!task) {
        resetDragState();
        return;
      }

      const deltaX = event.delta?.x ?? 0;
      const dayShift = Math.round(deltaX / dayWidth);

      if (data.type === "move") {
        const overLane = event.over?.data.current as { laneId?: string } | undefined;
        const targetLaneId = overLane?.laneId ?? task.laneId;
        const nextStart = shiftDateString(task.start, dayShift);
        const nextEnd = shiftDateString(task.end, dayShift);

        if (nextStart === task.start && nextEnd === task.end && targetLaneId === task.laneId) {
          resetDragState();
          return;
        }

        updateTask({
          ...task,
          start: nextStart,
          end: nextEnd,
          laneId: targetLaneId,
        });
        resetDragState();
        return;
      }

      if (data.type === "resize-start") {
        if (dayShift === 0) {
          resetDragState();
          return;
        }
        const proposedStart = addDays(parseDate(task.start), dayShift);
        const endDate = parseDate(task.end);
        const clampedStart = proposedStart > endDate ? endDate : proposedStart;
        const nextStart = toISODate(clampedStart);

        if (nextStart !== task.start) {
          updateTask({
            ...task,
            start: nextStart,
          });
        }
        resetDragState();
        return;
      }

      if (data.type === "resize-end") {
        if (dayShift === 0) {
          resetDragState();
          return;
        }
        const proposedEnd = addDays(parseDate(task.end), dayShift);
        const startDate = parseDate(task.start);
        const clampedEnd = proposedEnd < startDate ? startDate : proposedEnd;
        const nextEnd = toISODate(clampedEnd);

        if (nextEnd !== task.end) {
          updateTask({
            ...task,
            end: nextEnd,
          });
        }
      }
      resetDragState();
    },
    [dayWidth, resetDragState, tasksById, updateTask],
  );

  const handleDragCancel = useCallback(() => {
    resetDragState();
  }, [resetDragState]);

  const highlightLaneId = dragPreview?.laneId ?? null;
  const highlightRect =
    dragPreview && dragPreview.type === "move"
      ? {
          left: dragPreview.left,
          width: dragPreview.width,
        }
      : null;
  const resizePreview =
    dragPreview && dragPreview.type !== "move"
      ? {
          taskId: dragPreview.taskId,
          left: dragPreview.left,
          width: dragPreview.width,
        }
      : null;
  const resizePreviewLaneId =
    dragPreview && dragPreview.type !== "move" ? dragPreview.laneId : null;
  const activeLaneId = dragContext ? (tasksById.get(dragContext.taskId)?.laneId ?? null) : null;

  return {
    sensors,
    snapToDayModifier,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    handleDragCancel,
    highlightLaneId,
    highlightRect,
    resizePreview,
    resizePreviewLaneId,
    activeLaneId,
  };
}
