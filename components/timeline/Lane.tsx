"use client";

import { useMemo } from "react";
import { useDroppable } from "@dnd-kit/core";

import { TaskBar } from "@/components/timeline/TaskBar";
import { useTimelineViewport } from "@/hooks/useTimelineViewport";
import { parseDate } from "@/lib/date";
import { tasksOverlap } from "@/lib/overlap";
import { cn } from "@/lib/utils";
import type { Lane as LaneType, Task } from "@/lib/types";

interface LaneProps {
  lane: LaneType;
  tasks: Task[];
  height?: number;
  highlightRect?: { left: number; width: number } | null;
  resizePreview?: { taskId: string; left: number; width: number } | null;
  isActiveLane?: boolean;
}

export function Lane({
  lane,
  tasks,
  height,
  highlightRect,
  resizePreview,
  isActiveLane,
}: LaneProps) {
  const viewport = useTimelineViewport();
  const { laneLabelWidth, laneBasePadding, laneRowHeight, laneRowGap } = viewport;
  const baseHeight = laneBasePadding * 2 + laneRowHeight;
  const targetHeight = height ?? baseHeight;
  const { setNodeRef, isOver } = useDroppable({
    id: `lane-${lane.id}`,
    data: { laneId: lane.id },
  });

  const layout = useMemo(() => {
    if (!tasks.length) {
      return {
        assignments: new Map<string, number>(),
        rows: 1,
      };
    }

    const assignments = new Map<string, number>();
    const rows: Task[][] = [];
    const sorted = [...tasks].sort(
      (a, b) => parseDate(a.start).getTime() - parseDate(b.start).getTime(),
    );

    sorted.forEach((task) => {
      let rowIndex = rows.findIndex((row) =>
        row.every((existing) => !tasksOverlap(existing, task)),
      );
      if (rowIndex === -1) {
        rowIndex = rows.length;
        rows[rowIndex] = [];
      }
      rows[rowIndex].push(task);
      assignments.set(task.id, rowIndex);
    });

    return {
      assignments,
      rows: Math.max(rows.length, 1),
    };
  }, [tasks]);

  const resizeOverlay = useMemo(() => {
    if (!resizePreview) {
      return null;
    }
    const rowIndex = layout.assignments.get(resizePreview.taskId);
    if (rowIndex === undefined) {
      return null;
    }
    const previewTop = laneBasePadding + rowIndex * (laneRowHeight + laneRowGap);
    const previewHeight = Math.max(laneRowHeight - 6, 28);
    const left = Math.max(0, resizePreview.left);
    const width = Math.max(0, resizePreview.width);
    return {
      left,
      width,
      top: previewTop,
      height: previewHeight,
    };
  }, [resizePreview, layout, laneBasePadding, laneRowGap, laneRowHeight]);

  const totalRows = layout.rows;
  const minimumHeight = Math.max(
    targetHeight,
    laneBasePadding * 2 + totalRows * laneRowHeight + (totalRows - 1) * laneRowGap,
  );

  const gridColumns = useMemo(
    () => new Array(viewport.dates.length).fill(null),
    [viewport.dates.length],
  );

  return (
    <section
      role="row"
      aria-label={lane.name}
      className="border-border grid border-b last:border-b-0"
      style={{ gridTemplateColumns: `${laneLabelWidth}px 1fr`, minHeight: minimumHeight }}
    >
      <header
        className="border-border bg-card text-muted-foreground border-r px-4 text-sm font-semibold"
        style={{ paddingTop: laneBasePadding, paddingBottom: laneBasePadding }}
      >
        {lane.name}
      </header>
      <div
        className={cn(
          "bg-muted/40 relative transition-colors",
          (isOver || isActiveLane) && "bg-primary/10",
        )}
        style={{ minHeight: minimumHeight }}
      >
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="flex h-full" style={{ width: viewport.contentWidth }}>
            {gridColumns.map((_, index) => (
              <span
                key={`${lane.id}-grid-${index}`}
                className="border-border h-full border-r first:border-l"
                style={{ width: viewport.dayWidth }}
              />
            ))}
          </div>
        </div>
        <div
          ref={setNodeRef}
          data-over={isOver}
          className="relative z-10 h-full w-full"
          style={{
            width: viewport.contentWidth,
            minHeight: minimumHeight,
            paddingLeft: 12,
            paddingRight: 12,
            paddingTop: laneBasePadding,
            paddingBottom: laneBasePadding,
          }}
        >
          {highlightRect ? (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-2 bottom-2 z-0 rounded-lg border border-dashed border-indigo-400/70 bg-indigo-200/30 shadow-sm"
              style={{
                left: Math.max(0, highlightRect.left),
                width: Math.max(0, highlightRect.width),
              }}
            />
          ) : null}
          {resizeOverlay ? (
            <>
              <span
                aria-hidden="true"
                className="pointer-events-none absolute rounded-xl border-2 border-dashed border-indigo-400/80 bg-indigo-100/20"
                style={{ ...resizeOverlay, zIndex: 5 }}
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-2 w-px bg-indigo-400/70"
                style={{ left: resizeOverlay.left, zIndex: 10 }}
              />
              {resizeOverlay.width >= 1 ? (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-2 w-px bg-indigo-400/70"
                  style={{
                    left: Math.max(
                      resizeOverlay.left + resizeOverlay.width - 1,
                      resizeOverlay.left,
                    ),
                    zIndex: 10,
                  }}
                />
              ) : null}
            </>
          ) : null}
          {tasks.length === 0 ? (
            <p className="bg-card/80 text-muted-foreground absolute top-3 left-3 rounded-md px-3 py-2 text-xs shadow-sm">
              No tasks assigned yet.
            </p>
          ) : null}
          {tasks.map((task) => {
            const row = layout.assignments.get(task.id) ?? 0;
            const top = laneBasePadding + row * (laneRowHeight + laneRowGap);
            return <TaskBar key={task.id} task={task} top={top} />;
          })}
        </div>
      </div>
    </section>
  );
}
