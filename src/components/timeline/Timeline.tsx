import { useEffect, useMemo, useState } from "react";
import { useApp, useBoardInitiatives } from "../../state/store";
import { useSearch } from "../../state/search";
import { TIMELINE_START_OPTIONS } from "../../lib/timelineStart";
import {
  buildTimeline,
  diffDays,
  formatDisplay,
  initiativeLastDay,
  pendingBadgeCount,
  targetEntryLevel,
  todayISO,
  weekIndexForDate,
} from "../../lib/dates";
import { useConfirm } from "../ui/ConfirmDialog";
import { TargetDateModal } from "./TargetDateModal";

// Vivid, distinct bar colors cycled per initiative (Telekom magenta leads).
const BAR_COLORS = ["#E20074", "#7C3AED", "#00A6A6", "#FF8A00", "#2563EB", "#16A34A"];

interface Box {
  col: number;
  initiativeId: string;
  componentId: string;
  componentName: string;
  entryId: string;
  date: string;
  releaseVersion: string;
  env: string;
  successful: boolean;
  pendingActions: number;
}

interface Selected {
  initiativeId: string;
  componentId: string;
  entryId: string;
}

export function Timeline() {
  const { state, updateConfig, deleteTargetDate } = useApp();
  const confirm = useConfirm();
  const boardInitiatives = useBoardInitiatives();
  const { sprintWeeks, timelineStart } = state.config;
  const [search, setSearch] = useSearch("timeline");
  const [selected, setSelected] = useState<Selected | null>(null);

  // Clear the filter every time this tab is entered (tab switch / split toggle remount).
  useEffect(() => {
    setSearch("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initiatives = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q
      ? boardInitiatives.filter((i) => i.name.toLowerCase().includes(q))
      : boardInitiatives;
  }, [boardInitiatives, search]);

  const openBox = (b: Box) =>
    setSelected({
      initiativeId: b.initiativeId,
      componentId: b.componentId,
      entryId: b.entryId,
    });

  const removeBox = async (b: Box) => {
    const ok = await confirm({
      title: "Delete this target date?",
      message: "This entry and its handover details will be removed.",
      confirmLabel: "Delete",
    });
    if (ok) deleteTargetDate(b.initiativeId, b.componentId, b.entryId);
  };
  const timeline = useMemo(
    () =>
      buildTimeline(state.quarters, {
        sprintWeeks,
        startBound: timelineStart === "current" ? todayISO() : undefined,
      }),
    [state.quarters, sprintWeeks, timelineStart]
  );
  const n = timeline.weeks.length;

  // Fractional column position of "today" so a marker can land precisely within
  // the current week. Null when today falls outside the generated grid.
  const todayOffset = useMemo(() => {
    const weeks = timeline.weeks;
    if (weeks.length === 0) return null;
    const today = todayISO();
    if (diffDays(today, weeks[0].start) > 0) return null; // before the grid
    const last = weeks[weeks.length - 1];
    if (diffDays(last.end, today) > 0) return null; // after the grid
    for (const w of weeks) {
      if (diffDays(today, w.start) <= 0 && diffDays(w.end, today) <= 0) {
        return w.index + diffDays(w.start, today) / 7; // 0..6 days into the week
      }
    }
    return null;
  }, [timeline]);

  if (n === 0) {
    return <p className="muted pad">Add a quarter above to generate the timeline.</p>;
  }

  const componentName = (id: string) =>
    state.components.find((c) => c.id === id)?.name ?? "?";

  return (
    <section className="panel timeline-panel">
      <header className="panel-head">
        <h2>Timeline</h2>
        <div className="timeline-start-control">
          <span className="muted small">Start</span>
          <div className="segmented">
            {TIMELINE_START_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={`seg ${timelineStart === opt.value ? "active" : ""}`}
                onClick={() => updateConfig({ timelineStart: opt.value })}
                title={opt.hint}
              >
                {opt.shortLabel}
              </button>
            ))}
          </div>
        </div>
        <input
          className="text-input search-input timeline-search"
          type="search"
          placeholder="Search initiatives…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="muted timeline-hint">
          Auto-generated · 1 sprint = {sprintWeeks} week{sprintWeeks === 1 ? "" : "s"}
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
          {initiatives.map((i) => {
            const lastDay = initiativeLastDay(
              i.startDate,
              i.estimationSprints,
              sprintWeeks
            );
            const startCol = weekIndexForDate(timeline.weeks, i.startDate);
            const endCol = weekIndexForDate(timeline.weeks, lastDay);
            // Stable color per initiative regardless of any active filter.
            const color =
              BAR_COLORS[boardInitiatives.indexOf(i) % BAR_COLORS.length];

            const boxes: Box[] = [];
            for (const [componentId, checked] of Object.entries(i.checkedComponents)) {
              if (!checked) continue;
              for (const e of i.targetDates[componentId] ?? []) {
                boxes.push({
                  col: weekIndexForDate(timeline.weeks, e.date),
                  initiativeId: i.id,
                  componentId,
                  componentName: componentName(componentId),
                  entryId: e.id,
                  date: e.date,
                  releaseVersion: e.releaseVersion,
                  env: e.env,
                  successful: e.successful,
                  pendingActions: pendingBadgeCount(e),
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
                {i.link ? (
                  <a
                    className="tl-bar tl-bar-link"
                    href={i.link}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      gridColumn: `${startCol + 1} / ${endCol + 2}`,
                      background: color,
                    }}
                    title={`${i.name}: ${formatDisplay(i.startDate)} → ${formatDisplay(
                      lastDay
                    )} · opens link ↗`}
                  >
                    {i.name}
                  </a>
                ) : (
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
                )}

                {[...boxesByCol.entries()].map(([col, group]) => (
                  <div
                    key={col}
                    className="tl-box-stack"
                    style={{ gridColumn: col + 1 }}
                  >
                    {group.map((b, bi) => (
                      <div
                        key={bi}
                        className={`tl-box warn-${targetEntryLevel({
                          date: b.date,
                          successful: b.successful,
                        })}`}
                        onClick={() => openBox(b)}
                        onKeyDown={(ev) => ev.key === "Enter" && openBox(b)}
                        role="button"
                        tabIndex={0}
                        title="Edit target date"
                      >
                        <button
                          className="icon-btn entry-del"
                          title="Remove target date"
                          aria-label="Remove target date"
                          onClick={(ev) => {
                            ev.stopPropagation();
                            removeBox(b);
                          }}
                        >
                          ×
                        </button>
                        <strong>{b.componentName}</strong>
                        <span>{formatDisplay(b.date)}</span>
                        {b.releaseVersion && <span>v{b.releaseVersion}</span>}
                        {b.env && <span className="tl-env">{b.env}</span>}
                        {b.pendingActions > 0 && (
                          <span
                            className="td-badge"
                            title={`${b.pendingActions} pending action(s)`}
                            aria-label={`${b.pendingActions} pending actions`}
                          >
                            {b.pendingActions}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            );
          })}

          {todayOffset !== null && (
            <div
              className="tl-today"
              style={{ left: `calc(${todayOffset} * var(--week-w))` }}
              title={`Today · ${formatDisplay(todayISO())}`}
            />
          )}
        </div>
      </div>

      {selected && (
        <TargetDateModal
          initiativeId={selected.initiativeId}
          componentId={selected.componentId}
          entryId={selected.entryId}
          onClose={() => setSelected(null)}
        />
      )}
    </section>
  );
}
