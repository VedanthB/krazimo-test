"use client";

import { useCallback, useEffect, useState, type RefObject } from "react";

interface ScrollShadowState {
  left: boolean;
  right: boolean;
}

/**
 * Manage the ambient scroll shadows shown on either side of the timeline viewport.
 *
 * @param scrollRef - Ref pointing to the horizontal scroll container.
 * @returns Current shadow visibility flags and a manual refresh helper.
 */
export function useScrollShadows(scrollRef: RefObject<HTMLDivElement | null>): {
  shadow: ScrollShadowState;
  refresh: () => void;
} {
  const [shadow, setShadow] = useState<ScrollShadowState>({ left: false, right: false });

  const refresh = useCallback(() => {
    const node = scrollRef.current;
    if (!node) {
      return;
    }
    const { scrollLeft, scrollWidth, clientWidth } = node;
    const maxScrollLeft = Math.max(scrollWidth - clientWidth, 0);
    const nextState = {
      left: scrollLeft > 8,
      right: scrollLeft < maxScrollLeft - 8,
    };
    setShadow((previous) =>
      previous.left === nextState.left && previous.right === nextState.right ? previous : nextState,
    );
  }, [scrollRef]);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) {
      return;
    }
    refresh();
    node.addEventListener("scroll", refresh);
    window.addEventListener("resize", refresh);
    return () => {
      node.removeEventListener("scroll", refresh);
      window.removeEventListener("resize", refresh);
    };
  }, [refresh, scrollRef]);

  return { shadow, refresh };
}
