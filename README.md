## Overview

Interactive Gantt-style timeline built with Next.js 16 (App Router), Tailwind CSS 4, shadcn/ui, and `@dnd-kit`. The experience targets UI engineers evaluating interaction quality alongside PMs who want a realistic planning surface: drag, resize, keyboard interactions, responsive layout, dark mode, and local persistence are all included.

## Feature Highlights

- Multiple zoom levels (`Week`, `Month`, `3 Months`, `Year`) with compact/comfortable/spacious density presets.
- Sticky date axis with adaptive labels that avoid overlap across zoom levels.
- Drag + drop:
  - Move tasks horizontally (snaps to day).
  - Drop tasks into different lanes.
  - Resize with start/end handles and matching preview guides.
- Keyboard support (Arrow keys, Shift+Arrow, Enter, Esc) and accessible focus rings.
- Conflict detection across lanes surfaces collisions with a red task outline.
- Milestone rendering (diamond markers) plus today indicator that scrolls smoothly into view on load.
- Task drawer (right-side shadcn Drawer) with fields for name, dates, lane, assignee, dependencies, milestone toggle, and delete/reset actions.
- JSON import/export and automatic `localStorage` persistence.
- Theme toggle (light/dark) and custom scrollbar styling (timeline + drawer).

> Note: Dependency arrows between tasks were intentionally scoped out after initial experimentation—they are tracked as a future enhancement.

## Getting Started

Requirements: Node 18+ and pnpm (recommended). The repo already contains generated shadcn components.

```bash
pnpm install
pnpm dev
```

Visit http://localhost:3000 to use the timeline.

## Scripts

| Command       | Description                                     |
| ------------- | ----------------------------------------------- |
| `pnpm dev`    | Run the Next.js dev server (Turbopack).         |
| `pnpm build`  | Production build.                               |
| `pnpm start`  | Serve the production build.                     |
| `pnpm lint`   | ESLint across the repo.                         |
| `pnpm format` | Prettier check (Tailwind plugin enabled).       |
| `pnpm test`   | Unit tests via Vitest (skeleton for expansion). |

Husky + lint-staged run the lint/format pipeline on commit.

## Data & Testing Tips

- `data/seed.json` seeds the board with tasks clustered around **29 Oct 2025** so the today marker, milestones, and conflicts are immediately visible.
- Toggle zoom/density in the toolbar to validate axis rendering.
- Drag tasks across lanes or resize to trigger the navy preview rails and confirm conflict detection (e.g., overlap the “Kickoff Brief” and “Stakeholder Reviews” tasks).
- Use the three-dot menu on a task → “Edit details” to open the drawer. Changing a date or lane should persist after refresh (localStorage).
- Import/export buttons accept the same schema as `seed.json`.

## Keyboard Shortcuts

- `ArrowLeft` / `ArrowRight`: move active task by 1 day. Hold `Shift` to move 7 days.
- `ArrowUp` / `ArrowDown`: reassign to previous/next lane.
- `Enter`: open the edit drawer.
- `Esc`: close the drawer / clear selection.

## Known Gaps

- Dependency arrows are not rendered (deps are editable in the drawer and included in exports).
- Automated tests currently cover only utility functions; interaction coverage should be expanded with component tests or Playwright.
- Large datasets are not virtualized—rendering many lanes/days could impact performance.

Refer to `PLAN.md` for the full rationale, trade-offs, and next steps.
