import { Fragment, useEffect, useMemo } from "react";
import { useApp, useBoardInitiatives } from "../../state/store";
import { useSearch } from "../../state/search";
import { timeLeftSprints } from "../../lib/dates";
import { PRIORITY_META } from "../../lib/priority";
import { useSort } from "../../lib/sort";
import type { Initiative, InitiativeCategory } from "../../types";
import { TargetDatesCell } from "./TargetDatesCell";
import { DevReadinessCell } from "./DevReadinessCell";
import { PrioritySelect } from "./PrioritySelect";
import { ScopeCell } from "../common/ScopeCell";
import { useInitiativeDelete } from "../common/useInitiativeDelete";
import { useAddInitiative } from "../common/useAddInitiative";
import { TrashIcon } from "../ui/TrashIcon";

type SortKey = "priority" | "startDate" | "estimation" | "timeLeft";

const GROUPS: { category: InitiativeCategory; label: string }[] = [
  { category: "business", label: "Business" },
  { category: "engineering", label: "Engineering" },
  { category: "incoming", label: "Incoming Dependencies" },
  { category: "outgoing", label: "Outgoing Dependencies" },
];

export function InitiativesTab() {
  const { state, updateInitiative, setStage } = useApp();
  const requestDelete = useInitiativeDelete();
  const addInitiative = useAddInitiative();
  const boardInitiatives = useBoardInitiatives();
  const [search, setSearch] = useSearch("initiatives");
  const { sort, toggleSort, sortArrow } = useSort<SortKey>();

  // Clear the filter every time this tab is entered (tab switch / split toggle remount).
  useEffect(() => {
    setSearch("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setEstimation = (i: Initiative, raw: string) => {
    const n = parseInt(raw, 10);
    updateInitiative(i.id, { estimationSprints: Number.isFinite(n) ? Math.max(0, n) : 0 });
  };

  const removeInitiative = (i: Initiative) =>
    requestDelete(i, "Board", () => setStage(i.id, "implementation", false));

  // Filter by name (search), then optionally sort. Display-only — the underlying
  // order in state (and the Timeline) is untouched.
  const displayed = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = q
      ? boardInitiatives.filter((i) => i.name.toLowerCase().includes(q))
      : boardInitiatives;
    if (!sort) return rows;
    const { sprintWeeks } = state.config;
    const sorted = [...rows].sort((a, b) => {
      let cmp = 0;
      switch (sort.key) {
        case "priority":
          cmp = PRIORITY_META[a.priority].rank - PRIORITY_META[b.priority].rank;
          break;
        case "startDate":
          cmp = a.startDate.localeCompare(b.startDate);
          break;
        case "estimation":
          cmp = a.estimationSprints - b.estimationSprints;
          break;
        case "timeLeft":
          cmp =
            timeLeftSprints(a.startDate, a.estimationSprints, sprintWeeks) -
            timeLeftSprints(b.startDate, b.estimationSprints, sprintWeeks);
          break;
      }
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [boardInitiatives, search, sort, state.config]);

  const grouped = GROUPS.map((g) => ({
    ...g,
    items: displayed.filter((i) => i.category === g.category),
  }));
  // Board initiatives never categorised (added straight here) fall into "Other".
  const other = displayed.filter((i) => !GROUPS.some((g) => g.category === i.category));

  // Priority, Initiative, Scope, Dev Readiness, Estimation, Start Date, Time left,
  // Target Dates, actions — for group-row colSpans.
  const colCount = 9;

  const renderRow = (i: Initiative) => (
    <tr key={i.id} data-initiative-id={i.id}>
      <td className="col-priority center">
        <PrioritySelect
          value={i.priority}
          onChange={(priority) => updateInitiative(i.id, { priority })}
        />
      </td>
      <td className="col-initiative">
        <input
          className={`cell-input strong ${i.name.trim() ? "" : "invalid"}`}
          value={i.name}
          placeholder="Required"
          onChange={(e) => updateInitiative(i.id, { name: e.target.value })}
        />
        <div className="link-row">
          <input
            className="cell-input link-input"
            value={i.link}
            placeholder="https://link (optional)"
            onChange={(e) => updateInitiative(i.id, { link: e.target.value })}
          />
          {i.link && (
            <a
              className="open-link"
              href={i.link}
              target="_blank"
              rel="noreferrer"
              title="Open link"
            >
              ↗
            </a>
          )}
        </div>
      </td>

      <td className="col-scope">
        <ScopeCell initiative={i} />
      </td>

      <td className="col-readiness">
        <DevReadinessCell initiativeId={i.id} devReadiness={i.devReadiness} />
      </td>

      <td className="center">
        <input
          className="cell-input num"
          type="number"
          min={0}
          step={1}
          value={i.estimationSprints}
          onChange={(e) => setEstimation(i, e.target.value)}
        />
      </td>

      <td className="center">
        <input
          className={`cell-input ${i.startDate ? "" : "invalid"}`}
          type="date"
          value={i.startDate}
          onChange={(e) => updateInitiative(i.id, { startDate: e.target.value })}
        />
      </td>

      <td className="center computed">
        {timeLeftSprints(i.startDate, i.estimationSprints, state.config.sprintWeeks)}
      </td>

      <td className="col-target">
        {(() => {
          const comps = state.components.filter((c) => i.checkedComponents[c.id]);
          if (comps.length === 0) {
            return <span className="muted small">Add components in Scope</span>;
          }
          return (
            <div className="target-subgrid">
              {comps.map((c) => (
                <div className="target-subcell" key={c.id}>
                  <div className="target-subcell-head">{c.name}</div>
                  <TargetDatesCell initiativeId={i.id} componentId={c.id} />
                </div>
              ))}
            </div>
          );
        })()}
      </td>

      <td className="col-actions">
        <button className="icon-btn" title="Delete row" onClick={() => removeInitiative(i)}>
          <TrashIcon />
        </button>
      </td>
    </tr>
  );

  return (
    <div className="initiatives-tab">
      <section className="panel initiatives-panel">
        <header className="panel-head">
          <h2>Board</h2>
          <input
            className="text-input search-input"
            type="search"
            placeholder="Search initiatives…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            className="btn push-right"
            onClick={() => addInitiative({ implementation: true })}
          >
            + Add
          </button>
        </header>

        <div className="table-scroll">
          <table className="grid">
            <thead>
              <tr>
                <th className="col-priority">
                  <button className="th-sort" onClick={() => toggleSort("priority")}>
                    Priority{sortArrow("priority")}
                  </button>
                </th>
                <th className="col-initiative">Initiative</th>
                <th className="col-scope">Scope</th>
                <th className="col-readiness">Dev Readiness</th>
                <th>
                  <button className="th-sort" onClick={() => toggleSort("estimation")}>
                    Estimation (Sprints){sortArrow("estimation")}
                  </button>
                </th>
                <th>
                  <button className="th-sort" onClick={() => toggleSort("startDate")}>
                    Start Date{sortArrow("startDate")}
                  </button>
                </th>
                <th>
                  <button className="th-sort" onClick={() => toggleSort("timeLeft")}>
                    Time left (Sprints){sortArrow("timeLeft")}
                  </button>
                </th>
                <th className="col-target">Target Dates</th>
                <th className="col-actions" />
              </tr>
            </thead>
            <tbody>
              {grouped.map((g) =>
                g.items.length === 0 ? null : (
                  <Fragment key={g.category}>
                    <tr className="group-row">
                      <td colSpan={colCount}>{g.label}</td>
                    </tr>
                    {g.items.map(renderRow)}
                  </Fragment>
                )
              )}
              {other.length > 0 && (
                <Fragment>
                  <tr className="group-row">
                    <td colSpan={colCount}>Other</td>
                  </tr>
                  {other.map(renderRow)}
                </Fragment>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
