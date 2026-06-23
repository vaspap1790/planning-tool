# Release Planner

A two-tab planning tool (Initiatives + auto-generated Timeline) with a split view.
Prototype stage: data persists to the browser (localStorage). Next step is wiring
Supabase for a shared link + live multi-user sync.

## Run

```bash
npm install
cp .env.example .env   # then fill in your Supabase URL + anon key
npm run dev            # http://localhost:5173
npm run build          # type-check + production bundle into dist/
```

Without a `.env`, the app runs in **local-only** mode (data stays in the browser).
With Supabase configured, data is **shared and live-synced** (green "Live sync" badge).

## Supabase

The whole app state is stored as a single JSON row (`planner_state`, id = 1) and
streamed to all clients via Realtime — see `supabase/schema.sql` (run once in the
SQL Editor). Persistence/sync lives in `src/lib/supabase.ts`, `src/lib/remoteStore.ts`,
and the sync effects in `src/state/store.tsx`. localStorage remains an instant cache.

Single-row design = last-write-wins on simultaneous edits; fine for a small team.

Deep links: `#initiatives`, `#timeline`, `#split`, `#config` (applied on initial load).

## What's implemented

**Tab 1 – Initiatives**
- Components list (add / edit / delete) — drives the per-component checkboxes and columns.
- Initiatives table: add / edit / delete rows; mandatory fields flagged in red when empty.
- Initiative name + optional clickable link.
- Estimation accepts integers only; **Time left (sprints)** is computed from today, start date and estimation.
- Per-component checkboxes; checking a component reveals a `Target Dates – <Component>` column.
- Target-date entries (Date / Release / Env), add/edit/delete, outlined **yellow ≤2 weeks** and **red ≤1 week** before the date.

**Tab 2 – Timeline**
- Quarter table (add / edit / delete).
- Timeline auto-generated from quarters → sprints (2 weeks) → weeks, with initiative bars
  (start date + estimation) and target-date boxes placed under their week.

**Split view** — both tabs stacked, with a draggable divider to resize the panes.

**Config tab** — parametrizable settings applied everywhere instantly:
- **Sprint length** (weeks per sprint, default 2).
- **Timeline start** — begin at each quarter's start, or clip to the current date.

All delete actions are guarded by a confirmation modal.

## Architecture

- `src/types.ts` — domain model.
- `src/lib/dates.ts` — pure, testable date/sprint/timeline logic.
- `src/lib/storage.ts` — `Store` interface (localStorage today; **swap for Supabase here**).
- `src/state/store.tsx` — React context with immutable-update actions; persists on change.
- `src/components/tab1`, `src/components/tab2` — UI.

## Rules

- 1 sprint = `config.sprintWeeks` weeks (default 2).
- Sprint numbering restarts at 1 within each quarter.
- An initiative's bar spans exactly `estimation × sprintWeeks` weeks from its start date.
- "Time left" = estimation − elapsed sprints, rounded to the nearest **half** sprint,
  full estimation before the start date.
