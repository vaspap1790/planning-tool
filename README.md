# T-Planner

A planning tool with an **Initiatives** table and an auto-generated **Timeline**, a
stacked **Split** view, light/dark themes, and shared live-sync across users.

**Live:** https://planning-tool.vaspap1790.workers.dev

## Run

```bash
npm install
cp .env.example .env   # then fill in your Supabase URL + anon key
npm run dev            # http://localhost:5173
npm run build          # type-check + production bundle into dist/
```

Without a `.env`, the app runs in **local-only** mode (data stays in the browser).
With Supabase configured, data is **shared and live-synced**.

## Supabase

The whole app state is stored as a single JSON row (`planner_state`, id = 1) and
streamed to all clients via Realtime — see `supabase/schema.sql` (run once in the
SQL Editor). Persistence/sync lives in `src/lib/supabase.ts`, `src/lib/remoteStore.ts`,
and the sync effects in `src/state/store.tsx`. localStorage remains an instant cache.

Single-row design = last-write-wins on simultaneous edits; fine for a small team.

Deep links: `#initiatives`, `#timeline`, `#split`, `#config` (applied on initial load).

## Deploy

Hosted on **Cloudflare Workers** (static assets) via `wrangler.jsonc` (serves `./dist`).
Connected to GitHub, so **every push to `main` auto-builds and redeploys**:

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Build variables (set in the Cloudflare dashboard, not in git):
  `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `NODE_VERSION=20`

Note: Supabase free projects pause after ~7 days of zero activity (one click to wake).

## Features

**Initiatives tab**
- **Components** list (add / edit / delete), each with an optional **Release Calendar link**.
  Drives the per-component checkboxes and the dynamic target-date columns.
- Initiatives table: add / edit / delete rows; mandatory fields flagged in red when empty.
- **Priority** (first column) — JIRA-style levels (Blocker → Trivial) shown as an icon,
  changed via a popover; the table is **sortable** by Priority and Start Date.
- Initiative name + optional clickable link.
- Estimation (integers); **Time left (sprints)** computed from today, start date and estimation.
- **Dev Readiness** — Architecture / Analytics / Designs, plus any number of
  user-added named **Dependencies** ("+ Add Dependency"). Each has a status
  (Provided / Not Provided / N/A) and ETA (disabled for N/A) and is outlined
  **green** (Provided / N/A), **yellow** (≤2 days before its ETA) or **red** (ETA reached
  while still Not Provided); the cell border turns green when everything (inputs and
  dependencies) is ready.
- Per-component checkboxes reveal a `Target Dates – <Component>` column with
  Date / Release / Env entries, outlined **yellow ≤2 weeks** and **red ≤1 week** before the date.
- **Search** box filters rows by initiative name.

**Timeline tab**
- Quarter table (add / edit / delete).
- Timeline auto-generated from quarters → sprints → weeks, with initiative bars
  (start date + estimation) and target-date boxes placed under their week.
- A **"Today" marker** (translucent vertical line) pinpoints the current date within its week.
- **Timeline start** control (quarter start / current date) and a **Search** box, both in the header.
- Clicking a target-date box opens a **details modal** with a **See Release Calendar** link
  (uses the component's link; disabled when none is configured).

**Split view** — both tabs stacked with a draggable divider; framed on each section's
title on entry. Search is shared across both panes here.

**Config tab** — settings applied everywhere instantly: **Sprint length** and **Timeline start**.

**Theme** — light/dark toggle in the top bar, persisted across sessions.

All delete actions are guarded by a confirmation modal. Search clears on tab change.

## Architecture

- `src/types.ts` — domain model.
- `src/lib/dates.ts` — pure, testable date/sprint/timeline logic.
- `src/lib/priority.ts`, `src/lib/readiness.ts` — priority metadata and dev-readiness outlines.
- `src/lib/storage.ts` — `Store` interface backing the localStorage instant cache.
- `src/lib/supabase.ts` / `src/lib/remoteStore.ts` — shared source of truth + realtime.
- `src/state/store.tsx` — React context with immutable-update actions; localStorage cache +
  debounced Supabase sync with echo-suppression.
- `src/state/search.tsx` — per-tab search terms (linked in Split view).
- `src/components/initiatives`, `src/components/timeline`, `src/components/config`, `src/components/ui` — UI.

## Rules

- 1 sprint = `config.sprintWeeks` weeks (default 2).
- Sprint numbering restarts at 1 within each quarter.
- An initiative's bar spans exactly `estimation × sprintWeeks` weeks from its start date.
- "Time left" = estimation − elapsed sprints, rounded to the nearest **half** sprint,
  full estimation before the start date.
