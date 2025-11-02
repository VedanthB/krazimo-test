import { describe, expect, it } from "vitest";

import { calculateTimelineWindow, isMilestone, offsetFromStart } from "@/lib/date";
import type { Task } from "@/lib/types";

const baseTasks: Task[] = [
  {
    id: "a",
    name: "Alpha",
    start: "2025-02-10",
    end: "2025-02-14",
    laneId: "lane-1",
    assignee: "",
    deps: [],
  },
  {
    id: "b",
    name: "Beta",
    start: "2025-02-20",
    end: "2025-02-24",
    laneId: "lane-1",
    assignee: "",
    deps: [],
  },
];

describe("date helpers", () => {
  it("identifies milestones when start equals end", () => {
    expect(isMilestone("2025-03-01", "2025-03-01")).toBe(true);
    expect(isMilestone("2025-03-01", "2025-03-02")).toBe(false);
  });

  it("computes offsets in whole days", () => {
    expect(offsetFromStart("2025-02-01", "2025-02-01")).toBe(0);
    expect(offsetFromStart("2025-02-01", "2025-02-11")).toBe(10);
  });

  it("includes today within the calculated window", () => {
    const today = new Date();
    const window = calculateTimelineWindow(baseTasks, "month");
    const startTime = new Date(window.start).getTime();
    const endTime = new Date(window.end).getTime();
    expect(startTime).toBeLessThanOrEqual(today.getTime());
    expect(endTime).toBeGreaterThanOrEqual(today.getTime());
  });

  it("inflates range padding for week view", () => {
    const window = calculateTimelineWindow(baseTasks, "week");
    const durationDays = offsetFromStart(window.start, window.end);
    expect(durationDays).toBeGreaterThan(14);
  });
});
