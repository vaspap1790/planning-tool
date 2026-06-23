// Supabase client. Falls back gracefully to local-only mode when env vars are absent,
// so the app still runs (with browser-local data) if Supabase isn't configured.
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase = url && key ? createClient(url, key) : null;
export const SUPABASE_ENABLED = supabase !== null;
