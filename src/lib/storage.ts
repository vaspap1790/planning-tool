// Persistence abstraction. Today it's localStorage; swapping to Supabase later
// means implementing this same interface against the DB + realtime channel.
import type { AppState } from "../types";
import { seed } from "../state/seed";
import { DEFAULT_PRIORITY } from "./priority";
import { defaultDevReadiness } from "./readiness";

const KEY = "planning-tool-state-v1";

export interface Store {
  load(): AppState;
  save(state: AppState): void;
}

/**
 * Backfill fields added after a state was first persisted, so older saved or
 * remote payloads stay valid (priority, dev-readiness, component links).
 */
export function migrateState(state: AppState): AppState {
  return {
    ...state,
    components: state.components.map((c) => ({
      ...c,
      releaseCalendarLink: c.releaseCalendarLink ?? "",
    })),
    initiatives: state.initiatives.map((i) => ({
      ...i,
      priority: i.priority ?? DEFAULT_PRIORITY,
      devReadiness: i.devReadiness ?? defaultDevReadiness(),
    })),
  };
}

export const localStore: Store = {
  load() {
    const base = seed();
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return base;
      const saved = JSON.parse(raw) as Partial<AppState>;
      // Deep-merge config so older saved states gain new config keys.
      return migrateState({
        ...base,
        ...saved,
        config: { ...base.config, ...saved.config },
      });
    } catch {
      return base;
    }
  },
  save(state) {
    localStorage.setItem(KEY, JSON.stringify(state));
  },
};

export function newId(): string {
  return Math.random().toString(36).slice(2, 10);
}
