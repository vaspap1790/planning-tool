import { useApp } from "../../state/store";
import type { TimelineStart } from "../../types";

const TIMELINE_OPTIONS: { value: TimelineStart; label: string; hint: string }[] = [
  {
    value: "quarter",
    label: "Start of quarter",
    hint: "Timeline shows every week from each quarter's start date.",
  },
  {
    value: "current",
    label: "Current date",
    hint: "Timeline clips past weeks and begins at today.",
  },
];

export function ConfigTab() {
  const { state, updateConfig } = useApp();
  const { sprintWeeks, timelineStart } = state.config;

  return (
    <div className="config-tab">
      <section className="panel config-panel">
        <header className="panel-head">
          <h2>Configuration</h2>
        </header>

        <div className="config-row">
          <div className="config-label">
            <strong>Sprint length</strong>
            <span className="muted">
              Weeks per sprint. Drives Time left, bar length and the timeline grid.
            </span>
          </div>
          <div className="config-control">
            <input
              className="cell-input num"
              type="number"
              min={1}
              max={12}
              step={1}
              value={sprintWeeks}
              onChange={(e) =>
                updateConfig({
                  sprintWeeks: Math.max(1, parseInt(e.target.value, 10) || 1),
                })
              }
            />
            <span className="muted">weeks</span>
          </div>
        </div>

        <div className="config-row">
          <div className="config-label">
            <strong>Timeline start</strong>
            <span className="muted">Where the Tab 2 grid begins.</span>
          </div>
          <div className="config-control segmented">
            {TIMELINE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={`seg ${timelineStart === opt.value ? "active" : ""}`}
                onClick={() => updateConfig({ timelineStart: opt.value })}
                title={opt.hint}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
