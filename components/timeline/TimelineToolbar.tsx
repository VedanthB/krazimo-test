"use client";

import { useId, useRef, type ChangeEventHandler } from "react";
import { addDays } from "date-fns";

import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useTimeline } from "@/hooks/useTimeline";
import { parseImportedTimeline, serializeTimeline } from "@/lib/storage";
import type { ZoomLevel } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toISODate } from "@/lib/date";

const zoomOptions: Array<{ label: string; value: ZoomLevel }> = [
  { label: "Week", value: "week" },
  { label: "Month", value: "month" },
  { label: "3 Months", value: "quarter" },
  { label: "Year", value: "year" },
];

const densityOptions = [
  { label: "Compact", value: "compact" },
  { label: "Comfort", value: "comfortable" },
  { label: "Spacious", value: "spacious" },
] as const;

/**
 * Sticky toolbar housing zoom, density, theme, and import/export controls.
 */
export function TimelineToolbar() {
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { state, setZoom, importSnapshot, setDensity, createTask } = useTimeline();

  const handleZoomChange = (value: ZoomLevel) => {
    if (state.zoom === value) return;
    setZoom(value);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportChange: ChangeEventHandler<HTMLInputElement> = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const raw = await file.text();
      const payload = parseImportedTimeline(raw);
      importSnapshot(payload);
    } catch (error) {
      console.error("Failed to import timeline JSON", error);
      window.alert("Unable to import JSON. Please verify the file and try again.");
    } finally {
      // Reset the input so the same file can be selected twice in a row.
      event.target.value = "";
    }
  };

  const handleExport = () => {
    const snapshot = {
      lanes: state.lanes,
      tasks: state.tasks,
      zoom: state.zoom,
      density: state.density,
    };
    const contents = serializeTimeline(snapshot);
    const blob = new Blob([contents], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `timeline-${state.zoom}-${new Date().toISOString()}.json`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1_000);
  };

  const handleCreateTask = () => {
    const laneId = state.lanes[0]?.id ?? "";
    if (!laneId) {
      window.alert("Add a lane before creating tasks.");
      return;
    }

    const today = new Date();
    const start = toISODate(today);
    const spanByZoom: Record<ZoomLevel, number> = {
      week: 2,
      month: 5,
      quarter: 14,
      year: 30,
    };
    const span = spanByZoom[state.zoom] ?? 5;
    const end = toISODate(addDays(today, span));
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `task-${Date.now()}`;

    createTask({
      id,
      name: "New Task",
      start,
      end,
      laneId,
      assignee: "",
      deps: [],
      milestone: false,
    });
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 lg:gap-6">
      {/* View and density controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="border-border bg-muted/70 inline-flex items-center gap-2 rounded-xl border p-1">
          {zoomOptions.map((option) => {
            const active = state.zoom === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleZoomChange(option.value)}
                className={cn(
                  "rounded-lg px-5 py-2 text-sm font-semibold transition-colors",
                  active
                    ? "bg-indigo-500 text-white shadow"
                    : "text-muted-foreground hover:bg-card hover:text-foreground",
                )}
                aria-pressed={active}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        <div className="border-border bg-muted/70 inline-flex items-center gap-2 rounded-xl border p-1">
          {densityOptions.map((option) => {
            const active = state.density === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setDensity(option.value)}
                className={cn(
                  "rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
                  active
                    ? "bg-foreground text-background shadow"
                    : "text-muted-foreground hover:bg-card hover:text-foreground",
                )}
                aria-pressed={active}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        <ThemeToggle />
      </div>

      {/* Data actions */}
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          id={fileInputId}
          type="file"
          accept="application/json"
          className="sr-only"
          onChange={handleImportChange}
        />
        <button
          type="button"
          onClick={handleCreateTask}
          className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow transition-colors hover:bg-indigo-600"
        >
          New Task
        </button>
        <button
          type="button"
          onClick={handleImportClick}
          className="border-border text-muted-foreground hover:bg-muted/60 hover:text-foreground rounded-lg border px-4 py-2 text-sm font-semibold transition-colors"
        >
          Import JSON
        </button>
        <button
          type="button"
          onClick={handleExport}
          className="border-border text-muted-foreground hover:bg-muted/60 hover:text-foreground rounded-lg border px-4 py-2 text-sm font-semibold transition-colors"
        >
          Export JSON
        </button>
      </div>
    </div>
  );
}
