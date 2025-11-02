"use client";

import type { PropsWithChildren, RefObject } from "react";

interface TimelineContainerProps extends PropsWithChildren {
  /** Horizontal scroll container ref used for shadows and auto-scroll. */
  scrollRef: RefObject<HTMLDivElement | null>;
  /** Whether left/right shadow indicators should be visible. */
  shadow: {
    left: boolean;
    right: boolean;
  };
}

/**
 * Layout shell that wraps the timeline grid, providing scroll shadows and styling.
 */
export function TimelineContainer({ scrollRef, shadow, children }: TimelineContainerProps) {
  return (
    <section
      aria-label="Project timeline"
      className="border-border bg-muted/50 relative overflow-hidden rounded-2xl border"
    >
      <div className="relative">
        <div className="timeline-scroll-area overflow-x-auto overflow-y-hidden" ref={scrollRef}>
          <div className="inline-block px-4 pb-4">{children}</div>
        </div>
        {shadow.left ? (
          <div className="from-background via-background/90 pointer-events-none absolute inset-y-6 left-0 w-12 rounded-l-2xl bg-gradient-to-r to-transparent" />
        ) : null}
        {shadow.right ? (
          <div className="from-background via-background/90 pointer-events-none absolute inset-y-6 right-0 w-12 rounded-r-2xl bg-gradient-to-l to-transparent" />
        ) : null}
      </div>
    </section>
  );
}
