"use client";

import dynamic from "next/dynamic";
import { TimelineToolbar } from "@/components/timeline/TimelineToolbar";
import { TaskPanel } from "@/components/panel/TaskPanel";
import { TimelineProvider } from "@/hooks/useTimeline";

const TimelineCanvas = dynamic(
  () => import("@/components/timeline/TimelineCanvas").then((mod) => mod.TimelineCanvas),
  { ssr: false },
);

export default function Page() {
  return (
    <TimelineProvider>
      <div className="bg-background min-h-screen py-8 sm:py-10">
        <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
          <div className="border-border bg-card rounded-3xl border p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 lg:gap-6">
              <div>
                <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                  Project timeline
                </p>
                <h1 className="text-foreground text-2xl font-semibold tracking-tight">
                  Product launch plan
                </h1>
              </div>
              <p className="text-muted-foreground max-w-sm text-right text-sm">
                Drag, resize, or reassign work items to keep teammates aligned. Import or export
                JSON to share updates with your team.
              </p>
            </div>
            <div className="bg-border my-6 h-px" />
            <TimelineToolbar />
            <div className="bg-border my-6 h-px" />
            <TimelineCanvas />
          </div>
        </main>
        <TaskPanel />
      </div>
    </TimelineProvider>
  );
}
