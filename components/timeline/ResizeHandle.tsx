"use client";

import type { DraggableAttributes, DraggableSyntheticListeners } from "@dnd-kit/core";

import { cn } from "@/lib/utils";

interface ResizeHandleProps {
  direction: "start" | "end";
  setNodeRef: (element: HTMLElement | null) => void;
  listeners?: DraggableSyntheticListeners;
  attributes?: DraggableAttributes;
  isActive?: boolean;
}

export function ResizeHandle({
  direction,
  setNodeRef,
  listeners,
  attributes,
  isActive,
}: ResizeHandleProps) {
  const listenerProps = listeners ?? {};
  const attributeProps = attributes ?? {};

  return (
    <span
      ref={setNodeRef}
      {...listenerProps}
      {...attributeProps}
      role="separator"
      aria-orientation="horizontal"
      aria-label={direction === "start" ? "Resize start" : "Resize end"}
      className={cn(
        "absolute top-1/2 -mt-3 flex h-6 w-3 cursor-ew-resize items-center justify-center rounded-full bg-white/40 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100",
        direction === "start" ? "-left-1.5" : "-right-1.5",
        isActive && "bg-white/70 opacity-100",
      )}
    >
      <span className="h-full w-px bg-white" />
    </span>
  );
}
