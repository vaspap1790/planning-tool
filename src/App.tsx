import { useState } from "react";
import { AppProvider } from "./state/store";
import { ConfirmProvider } from "./components/ui/ConfirmDialog";
import { SplitView } from "./components/ui/SplitView";
import { Tab1 } from "./components/tab1/Tab1";
import { Tab2 } from "./components/tab2/Tab2";
import { ConfigTab } from "./components/config/ConfigTab";
import { SUPABASE_ENABLED } from "./lib/supabase";
import "./App.css";

type View = "tab1" | "tab2" | "split" | "config";

const HASH: Record<View, string> = {
  tab1: "initiatives",
  tab2: "timeline",
  split: "split",
  config: "config",
};

function viewFromHash(): View {
  const h = window.location.hash;
  if (h.includes("timeline")) return "tab2";
  if (h.includes("split")) return "split";
  if (h.includes("config")) return "config";
  return "tab1";
}

export default function App() {
  const [view, setRawView] = useState<View>(viewFromHash);
  const setView = (v: View) => {
    setRawView(v);
    window.location.hash = HASH[v];
  };

  return (
    <AppProvider>
      <ConfirmProvider>
      <div className="app">
        <header className="app-bar">
          <div className="brand">
            <span className="brand-mark">◆</span>
            <span>Release Planner</span>
            <span
              className={`sync-badge ${SUPABASE_ENABLED ? "live" : "local"}`}
              title={
                SUPABASE_ENABLED
                  ? "Shared & live-synced via Supabase"
                  : "Local only — data stays in this browser"
              }
            >
              ● {SUPABASE_ENABLED ? "Live sync" : "Local only"}
            </span>
          </div>
          <nav className="tabs">
            <button
              className={view === "tab1" ? "tab active" : "tab"}
              onClick={() => setView("tab1")}
            >
              Initiatives
            </button>
            <button
              className={view === "tab2" ? "tab active" : "tab"}
              onClick={() => setView("tab2")}
            >
              Timeline
            </button>
            <button
              className={view === "split" ? "tab active" : "tab"}
              onClick={() => setView("split")}
              title="Split view: both tabs stacked"
            >
              ▤ Split
            </button>
            <button
              className={view === "config" ? "tab active" : "tab"}
              onClick={() => setView("config")}
            >
              ⚙ Config
            </button>
          </nav>
        </header>

        <main className={view === "split" ? "content split" : "content"}>
          {view === "split" ? (
            <SplitView top={<Tab1 />} bottom={<Tab2 />} />
          ) : view === "tab1" ? (
            <Tab1 />
          ) : view === "tab2" ? (
            <Tab2 />
          ) : (
            <ConfigTab />
          )}
        </main>
      </div>
      </ConfirmProvider>
    </AppProvider>
  );
}
