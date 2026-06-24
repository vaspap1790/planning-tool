import { useEffect, useState } from "react";
import { AppProvider } from "./state/store";
import { SearchProvider } from "./state/search";
import { ConfirmProvider } from "./components/ui/ConfirmDialog";
import { SplitView } from "./components/ui/SplitView";
import { InitiativesTab } from "./components/initiatives/InitiativesTab";
import { TimelineTab } from "./components/timeline/TimelineTab";
import { ConfigTab } from "./components/config/ConfigTab";
import "./App.css";

type View = "initiatives" | "timeline" | "split" | "config";
type Theme = "light" | "dark";

const THEME_KEY = "tplanner-theme";

function initialTheme(): Theme {
  return localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light";
}

const HASH: Record<View, string> = {
  initiatives: "initiatives",
  timeline: "timeline",
  split: "split",
  config: "config",
};

function viewFromHash(): View {
  const h = window.location.hash;
  if (h.includes("timeline")) return "timeline";
  if (h.includes("split")) return "split";
  if (h.includes("config")) return "config";
  return "initiatives";
}

export default function App() {
  const [view, setRawView] = useState<View>(viewFromHash);
  const setView = (v: View) => {
    setRawView(v);
    window.location.hash = HASH[v];
  };

  const [theme, setTheme] = useState<Theme>(initialTheme);
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);
  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <AppProvider>
      <ConfirmProvider>
      <SearchProvider view={view}>
      <div className="app">
        <header className="app-bar">
          <div className="bar-left">
            <div className="brand">
              <span className="brand-mark" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="14" height="14">
                  <rect x="3" y="5" width="13" height="3" rx="1.5" fill="#fff" />
                  <rect x="7" y="10.5" width="14" height="3" rx="1.5" fill="#fff" />
                  <rect x="3" y="16" width="9" height="3" rx="1.5" fill="#fff" />
                </svg>
              </span>
              <span>T-Planner</span>
            </div>
            <nav className="tabs">
              <button
                className={view === "initiatives" ? "tab active" : "tab"}
                onClick={() => setView("initiatives")}
              >
                Initiatives
              </button>
              <button
                className={view === "timeline" ? "tab active" : "tab"}
                onClick={() => setView("timeline")}
              >
                Timeline
              </button>
              <button
                className={view === "split" ? "tab active" : "tab"}
                onClick={() => setView("split")}
                title="Split view: both tabs stacked"
              >
                <svg
                  className="tab-icon"
                  viewBox="0 0 24 24"
                  width="14"
                  height="14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                </svg>
                Split
              </button>
            </nav>
          </div>

          <div className="bar-right">
            <button
              className="bar-icon"
              onClick={toggleTheme}
              title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
              aria-label={
                theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
              }
            >
              {theme === "dark" ? (
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
                </svg>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
                </svg>
              )}
            </button>

            <button
              className={`bar-icon config-btn${view === "config" ? " active" : ""}`}
              onClick={() => setView("config")}
              title="Configuration"
              aria-label="Configuration"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9.2a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6Zm7.4 2.8c0 .43-.04.85-.1 1.25l1.7 1.32a.4.4 0 0 1 .1.52l-1.6 2.77a.4.4 0 0 1-.49.18l-2-.81q-.63.48-1.37.79l-.3 2.13a.4.4 0 0 1-.4.34h-3.2a.4.4 0 0 1-.4-.34l-.3-2.13a6 6 0 0 1-1.37-.79l-2 .81a.4.4 0 0 1-.49-.18l-1.6-2.77a.4.4 0 0 1 .1-.52l1.7-1.32a6 6 0 0 1 0-2.5L4.4 9.43a.4.4 0 0 1-.1-.52l1.6-2.77a.4.4 0 0 1 .49-.18l2 .81q.63-.48 1.37-.79l.3-2.13a.4.4 0 0 1 .4-.34h3.2a.4.4 0 0 1 .4.34l.3 2.13q.74.31 1.37.79l2-.81a.4.4 0 0 1 .49.18l1.6 2.77a.4.4 0 0 1-.1.52l-1.7 1.32q.1.6.1 1.25Z"
                />
              </svg>
            </button>
          </div>
        </header>

        <main className={view === "split" ? "content split" : "content"}>
          {view === "split" ? (
            <SplitView top={<InitiativesTab />} bottom={<TimelineTab />} />
          ) : view === "initiatives" ? (
            <InitiativesTab />
          ) : view === "timeline" ? (
            <TimelineTab />
          ) : (
            <ConfigTab />
          )}
        </main>
      </div>
      </SearchProvider>
      </ConfirmProvider>
    </AppProvider>
  );
}
