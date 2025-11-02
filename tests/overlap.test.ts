import { describe, expect, it } from "vitest";

import { detectConflicts } from "@/lib/overlap";
import type { Task } from "@/lib/types";

const laneId = "lane-1";

const baseTask = (overrides: Partial<Task>): Task => ({
  id: "stub",
  name: "Task",
  start: "2025-02-01",
  end: "2025-02-05",
  laneId,
  assignee: "",
  deps: [],
  milestone: false,
  ...overrides,
});

describe("detectConflicts", () => {
  it("flags overlapping tasks in same lane", () => {
    const tasks = [
      baseTask({ id: "a", start: "2025-02-01", end: "2025-02-05" }),
      baseTask({ id: "b", start: "2025-02-04", end: "2025-02-06" }),
    ];
    const conflicts = detectConflicts(tasks);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]?.taskIds).toEqual(["a", "b"]);
  });

  it("ignores back-to-back tasks", () => {
    const tasks = [
      baseTask({ id: "a", start: "2025-02-01", end: "2025-02-05" }),
      baseTask({ id: "b", start: "2025-02-06", end: "2025-02-10" }),
    ];
    const conflicts = detectConflicts(tasks);
    expect(conflicts).toHaveLength(0);
  });

  it("ignores tasks in different lanes", () => {
    const tasks: Task[] = [
      baseTask({ id: "a" }),
      {
        ...baseTask({ id: "b" }),
        laneId: "lane-2",
      },
    ];
    const conflicts = detectConflicts(tasks);
    expect(conflicts).toHaveLength(0);
  });
});
