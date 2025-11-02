import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useTimelineDerivedData } from "@/components/timeline/hooks/useTimelineDerivedData";
import type { Lane, Task } from "@/lib/types";

const lanes: Lane[] = [
  { id: "program", name: "Program" },
  { id: "eng", name: "Engineering" },
];

const tasks: Task[] = [
  {
    id: "task-1",
    name: "Kickoff",
    start: "2025-10-01",
    end: "2025-10-05",
    laneId: "program",
    assignee: "",
    deps: [],
  },
  {
    id: "task-2",
    name: "Implementation",
    start: "2025-10-06",
    end: "2025-10-15",
    laneId: "eng",
    assignee: "",
    deps: [],
  },
];

describe("useTimelineDerivedData", () => {
  it("maps tasks into lanes and exposes lookup map", () => {
    const { result } = renderHook((props) => useTimelineDerivedData(props), {
      initialProps: {
        tasks,
        lanes,
        density: "compact",
        zoom: "week" as const,
      },
    });

    expect(result.current.laneTasks.get("program")).toHaveLength(1);
    expect(result.current.laneTasks.get("eng")).toHaveLength(1);
    expect(result.current.tasksById.get("task-2")?.name).toBe("Implementation");
  });

  it("adjusts day width when the zoom level changes", () => {
    const { result, rerender } = renderHook((props) => useTimelineDerivedData(props), {
      initialProps: {
        tasks,
        lanes,
        density: "compact",
        zoom: "week" as const,
      },
    });

    expect(result.current.dayWidth).toBe(60);

    rerender({
      tasks,
      lanes,
      density: "compact",
      zoom: "year" as const,
    });

    expect(result.current.dayWidth).toBe(4);
  });

  it("computes a content width no smaller than the density minimum", () => {
    const { result } = renderHook((props) => useTimelineDerivedData(props), {
      initialProps: {
        tasks,
        lanes,
        density: "compact",
        zoom: "month" as const,
      },
    });

    expect(result.current.contentWidth).toBeGreaterThanOrEqual(420);
  });
});
