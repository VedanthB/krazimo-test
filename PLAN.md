## Project Brief (Masterplan Summary)

- **Overview**: Interactive Gantt/timeline board (Next.js + Tailwind + shadcn/ui) that mirrors Asana/Monday UX. Drag, resize, reassign tasks while preserving timeline clarity and conflict awareness.
- **Target audience**: UI engineers evaluating the component, PM/product teams validating timelines, and developers extending the prototype.
- **Must-haves**: Horizontal zoomable timeline (Week/Month baseline), vertical lanes (Team A/B/Unassigned), draggable/resizable task bars with day snapping, side panel editing, conflict detection within lanes, JSON import/export, localStorage persistence, sticky headers, keyboard navigation + ARIA affordances, responsive layout (mobile read-only).
- **Extras delivered historically**: Milestones, dependency arrows (initial concepts), today marker with auto-scroll.
- **Architecture sketch**:
  - `app/` for layout/page/error boundary.
  - `components/timeline/` (DateAxis, Lane, TaskBar, TodayMarker, etc.).
  - `components/panel/TaskPanel.tsx`.
  - `lib/` for date/conflict/storage helpers.
  - `hooks/` for timeline state and viewport helpers.
  - Seed data in `data/seed.json`.
- **Assignment guardrails**: No prebuilt Gantt libs, use date-fns, rely on @dnd-kit, focus on accessibility (focus rings, keyboard), highlight conflicts, deliver README + PLAN write-up.

---

## 1. Implemented Features

- **Timeline canvas**: Sticky axis, four zoom modes (Week/Month/Quarter/Year), density presets, smooth auto-scroll to today or the active task.
- **Task interactions**: Drag to reorder horizontally or across lanes, resize with snapping and live preview rails, milestone rendering, keyboard navigation (arrows, Shift, Enter, Esc).
- **Task metadata editing**: Right-side drawer (shadcn Drawer) covering name, dates, lane, assignee, dependencies, milestone toggle, reset/delete controls, and validation.
- **State management**: Local `useReducer` store with conflict detection, localStorage persistence, seed data shaped around Oct 29 2025, JSON import/export, “New Task” shortcut.
- **Visual polish & accessibility**: Dark mode toggle, custom scrollbars, hover cards for assignees, focus outlines, tooltip positioning, today marker styling, responsive layout down to tablet, ARIA roles for lanes/tasks.

Implemented features were prioritised because they directly support the assignment’s “must-haves” and were repeatedly raised during UX feedback (auto-scroll, density presets, improved tooltips, drawer UX).

## 2. Skipped / Partial Features

- **Dependency arrows**: Removed after repeated instability during drag interactions. Data model and drawer still capture dependencies, but no visual edges are drawn.
- **Automated interaction tests**: Current Vitest coverage is focused on utilities; no component/Playwright specs yet.
- **Large dataset performance**: No virtualization; the canvas renders all lanes/days eagerly.
- **Conflict callouts**: Present as a red ring, but no warning icon/tooltip yet.

Trade-offs were made to stabilise core interactions (drag/resize, auto scroll) rather than polish the dependency overlay within the available time.

## 3. Assumptions & Trade-offs

- **Single-user context**: LocalStorage persistence is sufficient; no backend or collaboration handling.
- **Conflict signalling**: Ring outline chosen for clarity and low noise; tooltip/icon can layer on later.
- **Drawer UX**: Editing via overflow menu prevents accidental opens while dragging—requires one extra click but keeps gestures reliable.
- **Tailwind v4**: Adopted for design tokens + scrollbar styling even though ecosystem tooling is still catching up.
- **Theme hydration**: Inline script in `layout.tsx` ensures SSR/CSR parity to avoid hydration flashes.

## 4. If I Had 8 More Hours

1. **Reintroduce dependency arrows** with a stable rendering strategy (likely SVG paths with cached geometry + drag listeners) and comprehensive hover states.
2. **Automated testing**: Add Vitest/JSDOM specs for reducers/date utils and a Playwright flow covering drag, resize, drawer edits, import/export.
3. **Conflict UX**: Pair the red outline with a warning badge/tooltip and surface conflicts in the drawer.
4. **Performance polish**: Virtualize lanes/days for very large datasets and memoize heavy calculations.
5. **Docs & DX**: Generate storybook-style docs for timeline pieces and expand component-level JSDoc (lanes, toolbar) for easier onboarding.

---
