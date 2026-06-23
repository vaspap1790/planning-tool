import { useMemo } from "react";
import { useApp } from "../../state/store";
import {
  buildTimeline,
  formatDisplay,
  initiativeLastDay,
  todayISO,
  warningLevel,
  weekIndexForDate,
} from "../../lib/dates";

// Vivid, distinct bar colors cycled per initiative (Telekom magenta leads).
const BAR_COLORS = ["#E20074", "#7C3AED", "#00A6A6", "#FF8A00", "#2563EB", "#16A34A"];

interface Box {
  col: number;
  componentName: string;
  date: string;
  releaseVersion: string;
  env: string;
}

export function Timeline() {
  const { state } = useApp();
  const { sprintWeeks, timelineStart } = state.config;
  const timeline = useMemo(
    () =>
      buildTimeline(state.quarters, {
        sprintWeeks,
        startBound: timelineStart === "current" ? todayISO() : undefined,
      }),
    [state.quarters, sprintWeeks, timelineStart]
  );
  const n = timeline.weeks.length;

  if (n === 0) {
    return <p className="muted pad">Add a quarter above to generate the timeline.</p>;
  }

  const componentName = (id: string) =>
    state.components.find((c) => c.id === id)?.name ?? "?";

  return (
    <section className="panel timeline-panel">
      <header className="panel-head">
        <h2>Timeline</h2>
        <span className="muted">
          Auto-generated · 1 sprint = {sprintWeeks} week{sprintWeeks === 1 ? "" : "s"} ·
          start: {timelineStart === "current" ? "current date" : "quarter start"}
        </span>
      </header>

      <div className="timeline-scroll">
        <div
          className="timeline-grid"
          style={{ ["--cols" as string]: n }}
        >
          {/* Quarter header */}
          {timeline.quarters.map((q, idx) => (
            <div
              key={`q${idx}`}
              className="tl-cell tl-quarter"
              style={{ gridColumn: `span ${q.weeks}` }}
            >
              {q.label}
            </div>
          ))}

          {/* Sprint header */}
          {timeline.sprints.map((s, idx) => (
            <div
              key={`s${idx}`}
              className="tl-cell tl-sprint"
              style={{ gridColumn: `span ${s.weeks}` }}
            >
              {s.label}
            </div>
          ))}

          {/* Week header */}
          {timeline.weeks.map((w, idx) => (
            <div key={`w${idx}`} className="tl-cell tl-week">
              <div className="tl-week-no">Week {w.weekInSprint}</div>
              <div className="tl-week-range">
                {formatDisplay(w.start)}–{formatDisplay(w.end)}
              </div>
            </div>
          ))}

          {/* Initiative rows */}
          {state.initiatives.map((i, idx) => {
            const lastDay = initiativeLastDay(
              i.startDate,
              i.estimationSprints,
              sprintWeeks
            );
            const startCol = weekIndexForDate(timeline.weeks, i.startDate);
            const endCol = weekIndexForDate(timeline.weeks, lastDay);
            const color = BAR_COLORS[idx % BAR_COLORS.length];

            const boxes: Box[] = [];
            for (const [componentId, checked] of Object.entries(i.checkedComponents)) {
              if (!checked) continue;
              for (const e of i.targetDates[componentId] ?? []) {
                boxes.push({
                  col: weekIndexForDate(timeline.weeks, e.date),
                  componentName: componentName(componentId),
                  date: e.date,
                  releaseVersion: e.releaseVersion,
                  env: e.env,
                });
              }
            }
            const boxesByCol = new Map<number, Box[]>();
            for (const b of boxes) {
              const arr = boxesByCol.get(b.col) ?? [];
              arr.push(b);
              boxesByCol.set(b.col, arr);
            }

            return (
              <div className="tl-init-row" key={i.id}>
                <div
                  className="tl-bar"
                  style={{
                    gridColumn: `${startCol + 1} / ${endCol + 2}`,
                    background: color,
                  }}
                  title={`${i.name}: ${formatDisplay(i.startDate)} → ${formatDisplay(
                    lastDay
                  )}`}
                >
                  {i.name}
                </div>

                {[...boxesByCol.entries()].map(([col, group]) => (
                  <div
                    key={col}
                    className="tl-box-stack"
                    style={{ gridColumn: col + 1 }}
                  >
                    {group.map((b, bi) => (
                      <div key={bi} className={`tl-box warn-${warningLevel(b.date)}`}>
                        <strong>{b.componentName}</strong>
                        <span>{formatDisplay(b.date)}</span>
                        {b.releaseVersion && <span>v{b.releaseVersion}</span>}
                        {b.env && <span className="tl-env">{b.env}</span>}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
