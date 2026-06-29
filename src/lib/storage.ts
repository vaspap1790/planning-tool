// Persistence abstraction. Today it's localStorage; swapping to Supabase later
// means implementing this same interface against the DB + realtime channel.
import type { AppState, Initiative } from "../types";
import { seed, initiativeExtras } from "../state/seed";

const KEY = "planning-tool-state-v3";

export interface Store {
  load(): AppState;
  save(state: AppState): void;
}

/**
 * Fill in any fields added after a row was last persisted. Backward-compatible:
 * existing initiatives keep all their data and land on the Implementation Board
 * (stages.implementation defaults to true via `initiativeExtras`).
 */
export function normalizeInitiative(raw: Partial<Initiative>): Initiative {
  const extras = initiativeExtras();
  // Backfill modal-only fields on every target-date entry.
  const targetDates: Initiative["targetDates"] = {};
  for (const [componentId, entries] of Object.entries(raw.targetDates ?? {})) {
    targetDates[componentId] = (entries ?? []).map((e) => ({
      ...e,
      mergeLink: e.mergeLink ?? "",
      handoverNeeded: e.handoverNeeded ?? false,
      // Tolerate the earlier string[] shape by mapping to {name, done}.
      handoverTo: (e.handoverTo ?? []).map((h) =>
        typeof h === "string" ? { name: h, done: false } : { name: h.name, done: !!h.done }
      ),
      demoScheduled: e.demoScheduled ?? false,
      demoDate: e.demoDate ?? "",
      approvalsAcquired: e.approvalsAcquired ?? false,
      successful: e.successful ?? false,
    }));
  }
  return {
    ...extras,
    ...raw,
    targetDates,
    // Ensure nested defaults survive a partial saved shape.
    stages: { ...extras.stages, ...raw.stages },
    sizing: { ...extras.sizing, ...raw.sizing },
    okrIds: raw.okrIds ?? extras.okrIds,
    lobIds: raw.lobIds ?? extras.lobIds,
    natcoIds: raw.natcoIds ?? extras.natcoIds,
    flowIds: raw.flowIds ?? extras.flowIds,
    outgoingDeps: raw.outgoingDeps ?? extras.outgoingDeps,
    planningEffort: raw.planningEffort ?? extras.planningEffort,
  } as Initiative;
}

/** Merge a (possibly older / partial) persisted state with current defaults. */
export function normalizeState(saved: Partial<AppState> | null | undefined): AppState {
  const base = seed();
  if (!saved) return base;
  return {
    ...base,
    ...saved,
    components: saved.components ?? base.components,
    quarters: saved.quarters ?? base.quarters,
    initiatives: (saved.initiatives ?? base.initiatives).map(normalizeInitiative),
    config: {
      ...base.config,
      ...saved.config,
      planning: { ...base.config.planning, ...saved.config?.planning },
      okrs: saved.config?.okrs ?? base.config.okrs,
      lobs: saved.config?.lobs ?? base.config.lobs,
      natcos: saved.config?.natcos ?? base.config.natcos,
      flows: saved.config?.flows ?? base.config.flows,
      platforms: saved.config?.platforms ?? base.config.platforms,
    },
  };
}

export const localStore: Store = {
  load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return seed();
      return normalizeState(JSON.parse(raw) as Partial<AppState>);
    } catch {
      return seed();
    }
  },
  save(state) {
    localStorage.setItem(KEY, JSON.stringify(state));
  },
};

export function newId(): string {
  return Math.random().toString(36).slice(2, 10);
}
