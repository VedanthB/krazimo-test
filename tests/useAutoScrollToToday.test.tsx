import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAutoScrollToToday } from "@/components/timeline/hooks/useAutoScrollToToday";

describe("useAutoScrollToToday", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("scrolls the viewport so the today marker is centered", () => {
    const scrollElement = document.createElement("div");
    Object.defineProperties(scrollElement, {
      clientWidth: { value: 300, configurable: true },
      scrollWidth: { value: 1200, configurable: true },
    });
    const scrollTo = vi.fn();
    scrollElement.scrollTo = scrollTo;

    const marker = document.createElement("div");
    marker.setAttribute("data-today-marker", "true");
    Object.defineProperties(marker, {
      offsetWidth: { value: 20, configurable: true },
      offsetLeft: { value: 420, configurable: true },
    });

    const canvas = document.createElement("div");
    canvas.appendChild(marker);

    const scrollRef = { current: scrollElement };
    const canvasRef = { current: canvas };

    vi.spyOn(window, "requestAnimationFrame").mockImplementation(
      (callback: FrameRequestCallback) => {
        callback(0);
        return 0;
      },
    );

    const { unmount } = renderHook(() =>
      useAutoScrollToToday({
        anchorTaskStart: "2025-10-05",
        start: "2025-10-01",
        end: "2025-10-31",
        dayWidth: 24,
        laneLabelWidth: 128,
        contentWidth: 900,
        scrollRef,
        canvasRef,
      }),
    );

    unmount();

    expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ behavior: "auto" }));
    expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ behavior: "smooth" }));
  });

  it("does nothing when the target date falls outside the window", () => {
    const scrollElement = document.createElement("div");
    scrollElement.scrollTo = vi.fn();
    const scrollRef = { current: scrollElement };
    const canvasRef = { current: document.createElement("div") };

    vi.spyOn(window, "requestAnimationFrame").mockImplementation(
      (callback: FrameRequestCallback) => {
        callback(0);
        return 0;
      },
    );

    renderHook(() =>
      useAutoScrollToToday({
        anchorTaskStart: "2024-01-01",
        start: "2025-10-01",
        end: "2025-10-31",
        dayWidth: 24,
        laneLabelWidth: 128,
        contentWidth: 900,
        scrollRef,
        canvasRef,
      }),
    );

    expect(scrollElement.scrollTo).not.toHaveBeenCalled();
  });
});
