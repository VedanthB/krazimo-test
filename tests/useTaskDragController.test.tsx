import { act, renderHook } from "@testing-library/react";
import type { DragEndEvent, DragMoveEvent, DragStartEvent } from "@dnd-kit/core";
import { describe, expect, it, vi } from "vitest";

import { useTaskDragController } from "@/components/timeline/hooks/useTaskDragController";
import type { Task } from "@/lib/types";

const baseTask: Task = {
  id: "task-1",
  name: "Task",
  start: "2025-10-10",
  end: "2025-10-12",
  laneId: "lane-a",
  assignee: "",
  deps: [],
  milestone: false,
};

function createHook({
  task = baseTask,
  updateTask = vi.fn(),
  selectTask = vi.fn(),
}: {
  task?: Task;
  updateTask?: ReturnType<typeof vi.fn>;
  selectTask?: ReturnType<typeof vi.fn>;
} = {}) {
  const tasksById = new Map<string, Task>([[task.id, task]]);
  const props = {
    tasksById,
    dayWidth: 24,
    contentWidth: 600,
    timeWindow: { start: "2025-10-01", end: "2025-10-31" },
    updateTask,
    selectTask,
  };
  return renderHook(() => useTaskDragController(props));
}

describe("useTaskDragController", () => {
  it("selects a task and moves it across lanes", () => {
    const updateTask = vi.fn();
    const selectTask = vi.fn();
    const { result } = createHook({ updateTask, selectTask });

    const dragStart = {
      active: {
        data: {
          current: { taskId: "task-1", type: "move" },
        },
      },
    } as unknown as DragStartEvent;

    act(() => {
      result.current.handleDragStart(dragStart);
    });
    expect(selectTask).toHaveBeenCalledWith("task-1");

    const dragMove = {
      delta: { x: 48, y: 0 },
      over: {
        data: { current: { laneId: "lane-b" } },
      },
    } as unknown as DragMoveEvent;

    act(() => {
      result.current.handleDragMove(dragMove);
    });
    expect(result.current.highlightRect).not.toBeNull();

    const dragEnd = {
      active: dragStart.active,
      over: dragMove.over,
      delta: { x: 24, y: 0 },
    } as unknown as DragEndEvent;

    act(() => {
      result.current.handleDragEnd(dragEnd);
    });

    expect(updateTask).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "task-1",
        laneId: "lane-b",
        start: "2025-10-11",
        end: "2025-10-13",
      }),
    );
  });

  it("clamps resize-start so the start never passes the end", () => {
    const updateTask = vi.fn();
    const { result } = createHook({ updateTask });

    const dragStart = {
      active: {
        data: {
          current: { taskId: "task-1", type: "resize-start" },
        },
      },
    } as unknown as DragStartEvent;

    act(() => {
      result.current.handleDragStart(dragStart);
    });

    const dragEnd = {
      active: dragStart.active,
      delta: { x: 48, y: 0 },
    } as unknown as DragEndEvent;

    act(() => {
      result.current.handleDragEnd(dragEnd);
    });

    expect(updateTask).toHaveBeenCalledWith(
      expect.objectContaining({
        start: "2025-10-12",
      }),
    );
  });

  it("clamps resize-end so the end never precedes the start", () => {
    const updateTask = vi.fn();
    const { result } = createHook({ updateTask });

    const dragStart = {
      active: {
        data: {
          current: { taskId: "task-1", type: "resize-end" },
        },
      },
    } as unknown as DragStartEvent;

    act(() => {
      result.current.handleDragStart(dragStart);
    });

    const dragEnd = {
      active: dragStart.active,
      delta: { x: -120, y: 0 },
    } as unknown as DragEndEvent;

    act(() => {
      result.current.handleDragEnd(dragEnd);
    });

    expect(updateTask).toHaveBeenCalledWith(
      expect.objectContaining({
        end: "2025-10-10",
      }),
    );
  });
});
