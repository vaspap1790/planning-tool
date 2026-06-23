// Remote persistence + realtime sync against the single `planner_state` row.
import type { AppState } from "../types";
import { supabase } from "./supabase";

const TABLE = "planner_state";
const ROW_ID = 1;

/** Read the shared state, or null if it hasn't been initialised yet. */
export async function fetchRemoteState(): Promise<AppState | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from(TABLE)
    .select("data")
    .eq("id", ROW_ID)
    .maybeSingle();
  if (error) {
    console.error("[remoteStore] fetch failed:", error.message);
    return null;
  }
  return (data?.data as AppState) ?? null;
}

/** Upsert the shared state (single row). */
export async function saveRemoteState(state: AppState): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from(TABLE)
    .upsert({ id: ROW_ID, data: state, updated_at: new Date().toISOString() });
  if (error) console.error("[remoteStore] save failed:", error.message);
}

/** Subscribe to changes made by other users. Returns an unsubscribe function. */
export function subscribeRemoteState(
  onChange: (state: AppState) => void
): () => void {
  const client = supabase;
  if (!client) return () => {};
  const channel = client
    .channel("planner_state_changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: TABLE, filter: `id=eq.${ROW_ID}` },
      (payload) => {
        const next = (payload.new as { data?: AppState } | null)?.data;
        if (next) onChange(next);
      }
    )
    .subscribe();
  return () => {
    client.removeChannel(channel);
  };
}
