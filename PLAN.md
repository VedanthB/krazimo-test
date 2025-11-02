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
