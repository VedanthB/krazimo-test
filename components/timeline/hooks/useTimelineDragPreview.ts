"use client";

import { useCallback, useState } from "react";

interface DragPreviewState {
  taskId: string;
  laneId: string;
  left: number;
  width: number;
  type: "move" | "resize-start" | "resize-end";
}

/**
 * Track the current drag/resize preview rectangle so lanes can render guides.
 *
 * @returns helpers containing the latest preview snapshot and an updater.
 */
export function useTimelineDragPreview() {
  const [preview, setPreview] = useState<DragPreviewState | null>(null);

  const updatePreview = useCallback((next: DragPreviewState | null) => {
    setPreview(next);
  }, []);

  return {
    preview,
    updatePreview,
  };
}
