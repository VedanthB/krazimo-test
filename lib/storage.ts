import rawSeed from "@/data/seed.json";
import type { ImportPayload, TimelineSnapshot, ZoomLevel } from "@/lib/types";

const STORAGE_KEY = "timeline-state-v2";
const VALID_ZOOMS: ZoomLevel[] = ["week", "month", "quarter", "year"];
const DEFAULT_ZOOM: ZoomLevel = "month";

function isBrowser() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function normalizeZoom(value: unknown): ZoomLevel {
  if (typeof value === "string" && (VALID_ZOOMS as string[]).includes(value)) {
    return value as ZoomLevel;
  }
  return DEFAULT_ZOOM;
}

export function getSeedSnapshot(): TimelineSnapshot {
  const seed = rawSeed as ImportPayload;
  return {
    lanes: seed.lanes,
    tasks: seed.tasks,
    zoom: normalizeZoom(seed.zoom),
    density: seed.density ?? "comfortable",
  };
}

export function loadTimeline(): TimelineSnapshot {
  if (!isBrowser()) {
    return getSeedSnapshot();
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return getSeedSnapshot();
    }
    const parsed = JSON.parse(stored) as TimelineSnapshot;
    if (!parsed.lanes || !parsed.tasks) {
      return getSeedSnapshot();
    }
    return {
      lanes: parsed.lanes,
      tasks: parsed.tasks,
      zoom: normalizeZoom(parsed.zoom),
      density: parsed.density ?? "comfortable",
    };
  } catch (error) {
    console.error("Failed to load timeline from storage", error);
    return getSeedSnapshot();
  }
}

export function persistTimeline(snapshot: TimelineSnapshot) {
  if (!isBrowser()) {
    return;
  }

  try {
    const payload = JSON.stringify(snapshot);
    window.localStorage.setItem(STORAGE_KEY, payload);
  } catch (error) {
    console.error("Failed to persist timeline to storage", error);
  }
}

export function resetTimeline() {
  if (!isBrowser()) {
    return;
  }
  window.localStorage.removeItem(STORAGE_KEY);
}

export function serializeTimeline(snapshot: TimelineSnapshot): string {
  return JSON.stringify(snapshot, null, 2);
}

export function parseImportedTimeline(raw: string): ImportPayload {
  const parsed = JSON.parse(raw) as ImportPayload;
  if (!Array.isArray(parsed.lanes) || !Array.isArray(parsed.tasks)) {
    throw new Error("Invalid timeline payload");
  }
  return {
    lanes: parsed.lanes,
    tasks: parsed.tasks,
    zoom: normalizeZoom(parsed.zoom),
    density: parsed.density ?? "comfortable",
  };
}
