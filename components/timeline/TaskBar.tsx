"use client";

import { useMemo, type KeyboardEvent } from "react";
import { EllipsisVertical } from "lucide-react";
import { useDraggable } from "@dnd-kit/core";
import { addDays, format, parseISO } from "date-fns";

import { ResizeHandle } from "@/components/timeline/ResizeHandle";
import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTimeline } from "@/hooks/useTimeline";
import { useTimelineViewport } from "@/hooks/useTimelineViewport";
import { diffInDays, offsetFromStart, parseDate, toISODate } from "@/lib/date";
import type { Task } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TaskBarProps {
  task: Task;
  top: number;
}

const MIN_WIDTH = 24;

const TOOLTIP_POSITION = {
  milestone: "absolute -top-14 left-1/2 -translate-x-1/2",
  bar: "absolute -top-14 left-0 -translate-y-2",
} as const;

const TOOLTIP_BASE =
  "pointer-events-none z-40 hidden w-max flex-col rounded-lg bg-popover px-3 py-2 text-[11px] text-popover-foreground shadow-lg group-hover:flex group-focus-visible:flex";

interface TaskTooltipProps {
  anchor: keyof typeof TOOLTIP_POSITION;
  name: string;
  range: string;
  assignee?: string;
}

/**
 * Floating hover tooltip rendered above a task or milestone.
 */
function TaskTooltip({ anchor, name, range, assignee }: TaskTooltipProps) {
  return (
    <span className={cn(TOOLTIP_BASE, TOOLTIP_POSITION[anchor])}>
      <span className="font-semibold">{name}</span>
      <span className="text-muted-foreground">{range}</span>
      {assignee ? <span className="text-muted-foreground/80">Assignee: {assignee}</span> : null}
    </span>
  );
}

interface TaskAssigneeBadgeProps {
  assignee?: string;
  taskName: string;
  rangeLabel: string;
  laneName?: string;
}

/**
 * Optional badge that reveals richer assignee information on hover or focus.
 */
function TaskAssigneeBadge({ assignee, taskName, rangeLabel, laneName }: TaskAssigneeBadgeProps) {
  if (!assignee) {
    return null;
  }

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <button
          type="button"
          className="bg-primary/20 text-primary hidden rounded-full px-2 py-0.5 text-[10px] tracking-wide uppercase group-hover:inline"
        >
          {assignee}
        </button>
      </HoverCardTrigger>
      <HoverCardContent side="top" align="start" className="w-48 text-sm">
        <div className="space-y-1">
          <p className="text-foreground font-semibold">{taskName}</p>
          <p className="text-muted-foreground">Assignee: {assignee}</p>
          <p className="text-muted-foreground text-xs">{rangeLabel}</p>
          {laneName ? <p className="text-muted-foreground text-xs">Lane: {laneName}</p> : null}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

interface TaskOverflowMenuProps {
  onEdit: () => void;
}

/**
 * Three-dot overflow menu that exposes task management actions.
 */
function TaskOverflowMenu({ onEdit }: TaskOverflowMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute top-1/2 right-1 h-6 w-6 shrink-0 -translate-y-1/2 transform bg-white/20 text-white hover:bg-white/30 focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none"
          onClick={(event) => event.stopPropagation()}
        >
          <EllipsisVertical className="h-4 w-4" />
          <span className="sr-only">Open task menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-40"
        onClick={(event) => event.stopPropagation()}
      >
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault();
            onEdit();
          }}
        >
          Edit details
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function TaskBar({ task, top }: TaskBarProps) {
  const { state, selectTask, togglePanel, updateTask } = useTimeline();
  const viewport = useTimelineViewport();
  const isActive = state.activeTaskId === task.id;
  const isMilestone = Boolean(task.milestone);

  const hasConflict = useMemo(
    () => state.conflicts.some((entry) => entry.taskIds.includes(task.id)),
    [state.conflicts, task.id],
  );

  const geometry = useMemo(() => {
    const offsetDays = Math.max(offsetFromStart(viewport.start, task.start), 0);
    const durationDays = Math.max(diffInDays(task.start, task.end) + 1, 1);
    const width = Math.max(durationDays * viewport.dayWidth, MIN_WIDTH);
    const left = offsetDays * viewport.dayWidth;
    const milestoneLeft = left + viewport.dayWidth / 2 - 8;
    return { left, width, milestoneLeft };
  }, [task.end, task.start, viewport.dayWidth, viewport.start]);

  const barHeight = Math.max(viewport.laneRowHeight - 6, 28);

  const tooltip = useMemo(() => {
    const startDate = parseISO(task.start);
    const endDate = parseISO(task.end);
    const startLabel = format(startDate, "MMM d, yyyy");
    const endLabel = format(endDate, "MMM d, yyyy");
    const range =
      task.milestone || startLabel === endLabel ? startLabel : `${startLabel} — ${endLabel}`;
    return {
      range,
      startLabel,
      endLabel,
    };
  }, [task.end, task.milestone, task.start]);

  const {
    attributes: dragAttributes,
    listeners: dragListeners,
    setNodeRef: setDragNodeRef,
    transform: dragTransform,
    isDragging: isDraggingMove,
  } = useDraggable({
    id: `task:${task.id}`,
    data: { type: "move", taskId: task.id },
  });

  const {
    attributes: resizeStartAttributes,
    listeners: resizeStartListeners,
    setNodeRef: setResizeStartNodeRef,
    isDragging: isResizingStart,
  } = useDraggable({
    id: `task:${task.id}:resize-start`,
    data: { type: "resize-start", taskId: task.id },
    disabled: isMilestone,
  });

  const {
    attributes: resizeEndAttributes,
    listeners: resizeEndListeners,
    setNodeRef: setResizeEndNodeRef,
    isDragging: isResizingEnd,
  } = useDraggable({
    id: `task:${task.id}:resize-end`,
    data: { type: "resize-end", taskId: task.id },
    disabled: isMilestone,
  });

  const translate = dragTransform
    ? `translate3d(${dragTransform.x}px, ${dragTransform.y}px, 0)`
    : undefined;

  const handleActivate = () => {
    selectTask(task.id);
    togglePanel(true);
  };

  const shiftTask = (days: number) => {
    if (days === 0) {
      return;
    }
    const nextStart = toISODate(addDays(parseDate(task.start), days));
    const nextEnd = toISODate(addDays(parseDate(task.end), days));
    updateTask({ ...task, start: nextStart, end: nextEnd });
  };

  const moveTaskToLane = (direction: "up" | "down") => {
    const laneIndex = state.lanes.findIndex((lane) => lane.id === task.laneId);
    if (laneIndex === -1) {
      return;
    }
    const targetIndex = direction === "up" ? laneIndex - 1 : laneIndex + 1;
    const targetLane = state.lanes[targetIndex];
    if (!targetLane) {
      return;
    }
    updateTask({ ...task, laneId: targetLane.id });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    switch (event.key) {
      case "ArrowRight": {
        event.preventDefault();
        shiftTask(event.shiftKey ? 7 : 1);
        break;
      }
      case "ArrowLeft": {
        event.preventDefault();
        shiftTask(event.shiftKey ? -7 : -1);
        break;
      }
      case "ArrowUp": {
        event.preventDefault();
        moveTaskToLane("up");
        break;
      }
      case "ArrowDown": {
        event.preventDefault();
        moveTaskToLane("down");
        break;
      }
      case "Enter": {
        event.preventDefault();
        handleActivate();
        break;
      }
      case "Escape": {
        event.preventDefault();
        selectTask(null);
        togglePanel(false);
        break;
      }
      default:
        break;
    }
  };

  const laneName = useMemo(
    () => state.lanes.find((lane) => lane.id === task.laneId)?.name ?? undefined,
    [state.lanes, task.laneId],
  );

  if (isMilestone) {
    return (
      <button
        type="button"
        ref={setDragNodeRef}
        {...dragListeners}
        {...dragAttributes}
        onFocus={() => selectTask(task.id)}
        onKeyDown={handleKeyDown}
        className={cn(
          "group absolute z-10 flex h-6 w-6 -translate-y-1.5 items-center justify-center text-left text-xs font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400/60",
          isDraggingMove && "z-30",
        )}
        style={{
          top,
          left: geometry.milestoneLeft,
          transform: translate,
        }}
        data-task-id={task.id}
        aria-pressed={isActive}
        title={`${task.name} · ${task.start}`}
      >
        <TaskTooltip
          anchor="milestone"
          name={task.name}
          range={tooltip.range}
          assignee={task.assignee}
        />
        <span
          className={cn(
            "inline-flex h-4 w-4 rotate-45 items-center justify-center rounded-[2px] bg-gradient-to-br from-indigo-500 via-purple-500 to-purple-600 text-[11px] text-white shadow",
            (isActive || hasConflict) && "ring-2 ring-offset-2",
            isActive && "ring-indigo-400/80",
            hasConflict && "ring-rose-400/90",
          )}
          aria-hidden="true"
        />
      </button>
    );
  }

  return (
    <div
      ref={(node) => {
        setDragNodeRef(node);
      }}
      {...dragListeners}
      {...dragAttributes}
      className={cn(
        "group absolute z-10 flex cursor-grab items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-purple-600 pr-10 pl-4 text-left text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 transition-transform",
        isDraggingMove ? "scale-105" : "active:cursor-grabbing",
        isActive ? "ring-2 ring-indigo-200/80" : "hover:translate-y-[-1px] hover:shadow-xl",
        hasConflict && "ring-2 ring-rose-400/80",
        isDraggingMove && "z-30",
      )}
      style={{
        top,
        left: geometry.left,
        width: geometry.width,
        height: barHeight,
        transform: translate,
      }}
      data-task-id={task.id}
      data-conflict={hasConflict}
      data-dragging={isDraggingMove ? "true" : "false"}
      title={`${task.name} · ${task.start} → ${task.end}`}
      onFocus={() => selectTask(task.id)}
      onKeyDown={handleKeyDown}
    >
      {/* Task bar with drag/resizing affordances */}
      <TaskTooltip anchor="bar" name={task.name} range={tooltip.range} assignee={task.assignee} />
      <ResizeHandle
        direction="start"
        setNodeRef={setResizeStartNodeRef}
        listeners={resizeStartListeners}
        attributes={resizeStartAttributes}
        isActive={isResizingStart}
      />
      <span className="truncate font-semibold">{task.name}</span>
      <TaskAssigneeBadge
        assignee={task.assignee}
        taskName={task.name}
        rangeLabel={tooltip.range}
        laneName={laneName}
      />
      <span className="ml-auto pr-6" />
      <TaskOverflowMenu onEdit={handleActivate} />
      <ResizeHandle
        direction="end"
        setNodeRef={setResizeEndNodeRef}
        listeners={resizeEndListeners}
        attributes={resizeEndAttributes}
        isActive={isResizingEnd}
      />
    </div>
  );
}
