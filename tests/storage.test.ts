import { beforeEach, describe, expect, it } from "vitest";

import {
  loadTimeline,
  parseImportedTimeline,
  persistTimeline,
  serializeTimeline,
} from "@/lib/storage";
import type { TimelineSnapshot } from "@/lib/types";

const snapshot: TimelineSnapshot = {
  lanes: [
    { id: "lane-a", name: "Lane A" },
    { id: "lane-b", name: "Lane B" },
  ],
  tasks: [
    {
      id: "task-1",
      name: "Task One",
      start: "2025-10-10",
      end: "2025-10-12",
      laneId: "lane-a",
      assignee: "",
      deps: [],
      milestone: false,
    },
  ],
  zoom: "month",
  density: "comfortable",
};

describe("storage helpers", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("serializes and persists snapshots to localStorage", () => {
    const payload = serializeTimeline(snapshot);
    persistTimeline(snapshot);
    const stored = window.localStorage.getItem("timeline-state-v2");
    expect(stored).toBeTruthy();
    expect(JSON.parse(stored ?? "{}")).toEqual(JSON.parse(payload));
  });

  it("loads a previously stored snapshot", () => {
    persistTimeline(snapshot);
    const loaded = loadTimeline();
    expect(loaded.lanes).toHaveLength(2);
    expect(loaded.tasks[0]?.name).toBe("Task One");
  });

  it("parses imported snapshots and normalizes defaults", () => {
    const raw = JSON.stringify({
      lanes: snapshot.lanes,
      tasks: snapshot.tasks,
      zoom: "invalid-zoom",
    });
    const parsed = parseImportedTimeline(raw);
    expect(parsed.zoom).toBe("month");
    expect(parsed.density).toBe("comfortable");
  });

  it("throws for invalid payload structures", () => {
    const malformed = JSON.stringify({ tasks: {} });
    expect(() => parseImportedTimeline(malformed)).toThrowError(/Invalid timeline payload/);
  });
});
