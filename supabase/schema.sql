-- Release Planner — Supabase schema.
-- Paste this into the Supabase SQL Editor and run it once.
--
-- Model: the whole app state is stored as a single JSON row (id = 1).
-- Matches the "shared link, no login" choice: the anon role may read and write
-- this one row. RLS is ON so nothing else is reachable.

create table if not exists public.planner_state (
  id smallint primary key default 1,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  constraint planner_state_single_row check (id = 1)
);

alter table public.planner_state enable row level security;

-- Shared-link access: anyone with the publishable key can read/write the single row.
drop policy if exists "public read planner_state" on public.planner_state;
create policy "public read planner_state"
  on public.planner_state for select
  to anon using (true);

drop policy if exists "public insert planner_state" on public.planner_state;
create policy "public insert planner_state"
  on public.planner_state for insert
  to anon with check (true);

drop policy if exists "public update planner_state" on public.planner_state;
create policy "public update planner_state"
  on public.planner_state for update
  to anon using (true) with check (true);

-- Enable realtime change streaming for this table (live multi-user sync).
alter publication supabase_realtime add table public.planner_state;
