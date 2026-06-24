// Persistence abstraction. Today it's localStorage; swapping to Supabase later
// means implementing this same interface against the DB + realtime channel.
import type { AppState } from "../types";
import { seed } from "../state/seed";

const KEY = "planning-tool-state-v3";

export interface Store {
  load(): AppState;
  save(state: AppState): void;
}

export const localStore: Store = {
  load() {
    const base = seed();
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return base;
      const saved = JSON.parse(raw) as Partial<AppState>;
      // Deep-merge config so new config keys keep their defaults.
      return { ...base, ...saved, config: { ...base.config, ...saved.config } };
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
