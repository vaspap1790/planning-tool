// Per-tab search terms. Each tab filters independently when viewed full-screen;
// in Split view (`linked`) both terms are kept in lock-step so a filter typed in
// either pane applies to both.
import {
  createContext,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type SearchScope = "initiatives" | "timeline";

interface SearchCtx {
  get(scope: SearchScope): string;
  set(scope: SearchScope, value: string): void;
}

const Ctx = createContext<SearchCtx | null>(null);

export function SearchProvider({
  view,
  children,
}: {
  view: string;
  children: ReactNode;
}) {
  const [terms, setTerms] = useState({ initiatives: "", timeline: "" });
  // In Split view both panes are visible, so a filter typed in either applies to both.
  const linked = view === "impl-split";
  const linkedRef = useRef(linked);
  linkedRef.current = linked;

  const value: SearchCtx = {
    get: (scope) => terms[scope],
    set: (scope, v) =>
      setTerms((t) =>
        linkedRef.current ? { initiatives: v, timeline: v } : { ...t, [scope]: v }
      ),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Returns [value, setValue] for the given tab's search term. */
export function useSearch(scope: SearchScope): [string, (v: string) => void] {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSearch must be used within SearchProvider");
  return [ctx.get(scope), (v: string) => ctx.set(scope, v)];
}
