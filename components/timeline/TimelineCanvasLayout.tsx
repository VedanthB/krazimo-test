"use client";

import { DateAxis } from "@/components/timeline/DateAxis";
import { Lane } from "@/components/timeline/Lane";
import { TodayMarker } from "@/components/timeline/TodayMarker";
import type { Lane as LaneType, Task } from "@/lib/types";

interface TimelineCanvasLayoutProps {
  lanes: LaneType[];
  laneTasks: Map<string, Task[]>;
  baseLaneHeight: number;
  highlightLaneId: string | null;
  highlightRect: { left: number; width: number } | null;
  resizePreview: { taskId: string; left: number; width: number } | null;
  resizePreviewLaneId: string | null;
  activeLaneId: string | null;
}

/**
 * Render the core timeline grid (date axis, lanes, and overlays) using precomputed state.
 *
 * @param lanes - Ordered collection of lanes to render.
 * @param laneTasks - Map of laneId to tasks assigned in that lane.
 * @param baseLaneHeight - Base height applied to each lane row (including padding).
 * @param highlightLaneId - Lane currently targeted by a move interaction.
 * @param highlightRect - Geometry used to preview move interactions.
 * @param resizePreview - Geometry for resizing interactions (per lane).
 * @param resizePreviewLaneId - Lane receiving the resize preview.
 * @param activeLaneId - Lane of the task currently being dragged.
 */
export function TimelineCanvasLayout({
  lanes,
  laneTasks,
  baseLaneHeight,
  highlightLaneId,
  highlightRect,
  resizePreview,
  resizePreviewLaneId,
  activeLaneId,
}: TimelineCanvasLayoutProps) {
  return (
    <div className="border-border bg-card overflow-hidden rounded-2xl border shadow-sm">
      {/* Sticky date header */}
      <DateAxis />
      <div className="relative">
        {/* Render each lane row */}
        {lanes.map((lane) => (
          <Lane
            key={lane.id}
            lane={lane}
            tasks={laneTasks.get(lane.id) ?? []}
            height={baseLaneHeight}
            highlightRect={highlightLaneId === lane.id ? highlightRect : null}
            resizePreview={resizePreviewLaneId === lane.id ? resizePreview : null}
            isActiveLane={activeLaneId === lane.id}
          />
        ))}
        {/* Today marker overlays */}
        <TodayMarker />
      </div>
    </div>
  );
}
