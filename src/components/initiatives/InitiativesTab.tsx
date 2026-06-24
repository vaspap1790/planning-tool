import { useEffect, useMemo, useState } from "react";
import { useApp, useActiveComponents } from "../../state/store";
import { useSearch } from "../../state/search";
import { timeLeftSprints } from "../../lib/dates";
import { PRIORITY_META } from "../../lib/priority";
import type { Initiative } from "../../types";
import { useConfirm } from "../ui/ConfirmDialog";
import { ComponentsList } from "./ComponentsList";
import { TargetDatesCell } from "./TargetDatesCell";
import { DevReadinessCell } from "./DevReadinessCell";
import { PrioritySelect } from "./PrioritySelect";
import { TrashIcon } from "../ui/TrashIcon";

type SortKey = "priority" | "startDate";
interface Sort {
  key: SortKey;
  dir: "asc" | "desc";
}

export function InitiativesTab() {
  const { state, addInitiative, updateInitiative, deleteInitiative, toggleComponent } =
    useApp();
  const confirm = useConfirm();
  const activeComponents = useActiveComponents();
  const [search, setSearch] = useSearch("initiatives");
  const [sort, setSort] = useState<Sort | null>(null);

  // Clear the filter every time this tab is entered (tab switch / split toggle remount).
  useEffect(() => {
    setSearch("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setEstimation = (i: Initiative, raw: string) => {
    const n = parseInt(raw, 10);
    updateInitiative(i.id, { estimationSprints: Number.isFinite(n) ? Math.max(0, n) : 0 });
  };

  const removeInitiative = async (i: Initiative) => {
    const ok = await confirm({
      title: `Delete "${i.name || "this initiative"}"?`,
      message: "This row and its target dates will be removed.",
    });
    if (ok) deleteInitiative(i.id);
  };

  const toggleSort = (key: SortKey) =>
    setSort((s) =>
      s?.key === key
        ? s.dir === "asc"
          ? { key, dir: "desc" }
          : null // third click clears
        : { key, dir: "asc" }
    );
  const sortArrow = (key: SortKey) =>
    sort?.key === key ? (sort.dir === "asc" ? " ▲" : " ▼") : "";

  // Filter by name (search), then optionally sort. Display-only — the underlying
  // order in state (and the Timeline) is untouched.
  const displayed = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = q
      ? state.initiatives.filter((i) => i.name.toLowerCase().includes(q))
      : state.initiatives;
    if (!sort) return rows;
    const sorted = [...rows].sort((a, b) => {
      const cmp =
        sort.key === "priority"
          ? PRIORITY_META[a.priority].rank - PRIORITY_META[b.priority].rank
          : a.startDate.localeCompare(b.startDate);
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [state.initiatives, search, sort]);

  return (
    <div className="initiatives-tab">
      <ComponentsList />

      <section className="panel initiatives-panel">
        <header className="panel-head">
          <h2>Initiatives</h2>
          <button className="btn" onClick={addInitiative}>
            + Add initiative
          </button>
          <input
            className="text-input search-input"
            type="search"
            placeholder="Search initiatives…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
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
                <th>Estimation (Sprints)</th>
                <th className="col-readiness">Dev Readiness</th>
                <th>Time left (Sprints)</th>
                <th className="col-components">Components</th>
                <th>
                  <button className="th-sort" onClick={() => toggleSort("startDate")}>
                    Start Date{sortArrow("startDate")}
                  </button>
                </th>
                {activeComponents.map((c) => (
                  <th key={c.id} className="col-target">
                    Target Dates – {c.name}
                  </th>
                ))}
                <th className="col-actions" />
              </tr>
            </thead>
            <tbody>
              {displayed.map((i) => (
                <tr key={i.id}>
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

                  <td className="col-readiness">
                    <DevReadinessCell
                      initiativeId={i.id}
                      devReadiness={i.devReadiness}
                    />
                  </td>

                  <td className="center computed">
                    {timeLeftSprints(
                      i.startDate,
                      i.estimationSprints,
                      state.config.sprintWeeks
                    )}
                  </td>

                  <td className="col-components">
                    {state.components.map((c) => (
                      <label key={c.id} className="check-row">
                        <input
                          type="checkbox"
                          checked={!!i.checkedComponents[c.id]}
                          onChange={() => toggleComponent(i.id, c.id)}
                        />
                        <span>{c.name}</span>
                      </label>
                    ))}
                  </td>

                  <td className="center">
                    <input
                      className={`cell-input ${i.startDate ? "" : "invalid"}`}
                      type="date"
                      value={i.startDate}
                      onChange={(e) =>
                        updateInitiative(i.id, { startDate: e.target.value })
                      }
                    />
                  </td>

                  {activeComponents.map((c) => (
                    <td key={c.id} className="col-target">
                      {i.checkedComponents[c.id] ? (
                        <TargetDatesCell initiativeId={i.id} componentId={c.id} />
                      ) : (
                        <span className="muted small">—</span>
                      )}
                    </td>
                  ))}

                  <td className="col-actions">
                    <button
                      className="icon-btn"
                      title="Delete row"
                      onClick={() => removeInitiative(i)}
                    >
                      <TrashIcon />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
