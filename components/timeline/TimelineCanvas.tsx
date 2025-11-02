"use client";

import { useEffect, useMemo, useRef } from "react";
import { DndContext } from "@dnd-kit/core";

import { TimelineCanvasLayout } from "@/components/timeline/TimelineCanvasLayout";
import { TimelineContainer } from "@/components/timeline/layout/TimelineContainer";
import { useAutoScrollToToday } from "@/components/timeline/hooks/useAutoScrollToToday";
import { useScrollShadows } from "@/components/timeline/hooks/useScrollShadows";
import { useTaskDragController } from "@/components/timeline/hooks/useTaskDragController";
import { useTimelineDerivedData } from "@/components/timeline/hooks/useTimelineDerivedData";
import { useTimeline } from "@/hooks/useTimeline";
import { TimelineViewportProvider } from "@/hooks/useTimelineViewport";

/**
 * Primary timeline surface wiring up drag interactions, auto-scroll, and the lane layout.
 */
export function TimelineCanvas() {
  const { state, updateTask, selectTask } = useTimeline();

  const {
    timeWindow,
    dayWidth,
    contentWidth,
    baseLaneHeight,
    densityPreset,
    laneTasks,
    tasksById,
  } = useTimelineDerivedData({
    tasks: state.tasks,
    lanes: state.lanes,
    density: state.density,
    zoom: state.zoom,
  });

  const activeTask = useMemo(
    () => (state.activeTaskId ? (tasksById.get(state.activeTaskId) ?? null) : null),
    [state.activeTaskId, tasksById],
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const { shadow: scrollShadow, refresh: refreshScrollShadow } = useScrollShadows(scrollRef);

  useEffect(() => {
    refreshScrollShadow();
  }, [refreshScrollShadow, dayWidth, timeWindow.dates.length, timeWindow.start, timeWindow.end]);

  const {
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
  } = useTaskDragController({
    tasksById,
    dayWidth,
    contentWidth,
    timeWindow: { start: timeWindow.start, end: timeWindow.end },
    updateTask,
    selectTask,
  });

  useAutoScrollToToday({
    anchorTaskStart: activeTask?.start ?? null,
    start: timeWindow.start,
    end: timeWindow.end,
    dayWidth,
    laneLabelWidth: densityPreset.laneLabelWidth,
    contentWidth,
    scrollRef,
    canvasRef,
  });

  return (
    <DndContext
      sensors={sensors}
      modifiers={[snapToDayModifier]}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {/* Timeline viewport context */}
      <TimelineViewportProvider
        value={{
          start: timeWindow.start,
          end: timeWindow.end,
          dates: timeWindow.dates,
          dayWidth,
          contentWidth,
          laneLabelWidth: densityPreset.laneLabelWidth,
          laneBasePadding: densityPreset.laneBasePadding,
          laneRowHeight: densityPreset.laneRowHeight,
          laneRowGap: densityPreset.laneRowGap,
        }}
      >
        <TimelineContainer scrollRef={scrollRef} shadow={scrollShadow}>
          <div ref={canvasRef}>
            {/* Timeline layout */}
            <TimelineCanvasLayout
              lanes={state.lanes}
              laneTasks={laneTasks}
              baseLaneHeight={baseLaneHeight}
              highlightLaneId={highlightLaneId}
              highlightRect={highlightRect}
              resizePreview={resizePreview}
              resizePreviewLaneId={resizePreviewLaneId}
              activeLaneId={activeLaneId}
            />
          </div>
        </TimelineContainer>
      </TimelineViewportProvider>
    </DndContext>
  );
}
