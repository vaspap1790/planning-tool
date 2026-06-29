// Estimation → Sizing. Five 1..5 dimensions drive a suggested T-shirt size.
import { Fragment, useMemo, useState } from "react";
import { useApp, useSizingInitiatives } from "../../state/store";
import type { Initiative, InitiativeCategory, SizingScore } from "../../types";
import { TrashIcon } from "../ui/TrashIcon";
import { PrioritySelect } from "../initiatives/PrioritySelect";
import { InitiativeNameCell } from "../common/InitiativeNameCell";
import { ScopeCell } from "../common/ScopeCell";
import { TShirtSelect } from "../common/TShirtSelect";
import { useInitiativeDelete } from "../common/useInitiativeDelete";
import { useAddInitiative } from "../common/useAddInitiative";
import { SIZING_DIMENSIONS, suggestedTShirtSize, scoreClass } from "../../lib/sizing";
import { PRIORITY_META } from "../../lib/priority";
import { useSort, tShirtRank } from "../../lib/sort";

type SortKey = "priority" | "suggested" | "tShirt";

const GROUPS: { category: InitiativeCategory; label: string }[] = [
  { category: "business", label: "Business" },
  { category: "engineering", label: "Engineering" },
  { category: "incoming", label: "Incoming Dependencies" },
  { category: "outgoing", label: "Outgoing Dependencies" },
];

function ScoreSelect({
  value,
  onChange,
}: {
  value: SizingScore;
  onChange: (v: SizingScore) => void;
}) {
  return (
    <select
      className={`cell-input score-select ${scoreClass(value)}`}
      value={value}
      onChange={(e) => onChange(Number(e.target.value) as SizingScore)}
      aria-label="Score 1 to 5"
    >
      <option value={0}>—</option>
      {[1, 2, 3, 4, 5].map((n) => (
        <option key={n} value={n}>
          {n}
        </option>
      ))}
    </select>
  );
}

export function SizingTab() {
  const { updateInitiative, setStage, updateSizing, addToPlanning } = useApp();
  const rows = useSizingInitiatives();
  const requestDelete = useInitiativeDelete();
  const addInitiative = useAddInitiative();
  const [search, setSearch] = useState("");
  const { sort, toggleSort, sortArrow } = useSort<SortKey>();

  // "+ Add" here creates a sizing-stage initiative, after picking its category.
  const addSizingOnly = () => addInitiative({ sizing: true });

  const remove = (i: Initiative) =>
    requestDelete(i, "Sizing", () => setStage(i.id, "sizing", false));

  // Filter by name (search), then optionally sort — applied before grouping so
  // each category group keeps the chosen order. Display-only.
  const displayed = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q ? rows.filter((i) => i.name.toLowerCase().includes(q)) : rows;
    if (!sort) return filtered;
    const sorted = [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sort.key) {
        case "priority":
          cmp = PRIORITY_META[a.priority].rank - PRIORITY_META[b.priority].rank;
          break;
        case "suggested":
          cmp =
            tShirtRank(suggestedTShirtSize(a.sizing)) -
            tShirtRank(suggestedTShirtSize(b.sizing));
          break;
        case "tShirt":
          cmp = tShirtRank(a.tShirtSize) - tShirtRank(b.tShirtSize);
          break;
      }
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [rows, search, sort]);

  const grouped = GROUPS.map((g) => ({
    ...g,
    items: displayed.filter((i) => i.category === g.category),
  }));
  // Sizing initiatives without a known category (e.g. added directly here) fall
  // into an "Other" group so they aren't lost.
  const other = displayed.filter((i) => !GROUPS.some((g) => g.category === i.category));

  const colCount = SIZING_DIMENSIONS.length + 7;

  const renderRow = (i: Initiative) => (
    <tr key={i.id} data-initiative-id={i.id}>
      <td className="col-priority center">
        <PrioritySelect
          value={i.priority}
          onChange={(priority) => updateInitiative(i.id, { priority })}
        />
      </td>
      <td className="col-initiative">
        <InitiativeNameCell initiative={i} />
      </td>
      <td className="col-desc">
        <textarea
          className="cell-input textarea"
          value={i.description}
          placeholder="Description"
          onChange={(e) => updateInitiative(i.id, { description: e.target.value })}
        />
      </td>
      <td className="col-scope">
        <ScopeCell initiative={i} />
      </td>
      {SIZING_DIMENSIONS.map((d) => (
        <td key={d.key} className="col-score center">
          <ScoreSelect
            value={i.sizing[d.key] as SizingScore}
            onChange={(v) => updateSizing(i.id, { [d.key]: v })}
          />
        </td>
      ))}
      <td className="col-tshirt center">
        <span className="tshirt-badge suggested">
          {suggestedTShirtSize(i.sizing) || "—"}
        </span>
      </td>
      <td className="col-tshirt center">
        <TShirtSelect
          value={i.tShirtSize}
          onChange={(tShirtSize) => updateInitiative(i.id, { tShirtSize })}
        />
      </td>
      <td className="col-actions">
        <div className="row-actions">
          <button
            className="btn btn-sm btn-ghost"
            title={i.stages.planning ? "Already in Planning" : "Add to Planning"}
            disabled={i.stages.planning}
            onClick={() => addToPlanning(i.id)}
          >
            {i.stages.planning ? "✓ Planning" : "Add to Planning"}
          </button>
          <button className="icon-btn" title="Delete row" onClick={() => remove(i)}>
            <TrashIcon />
          </button>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="estimation-tab">
      <section className="panel">
        <header className="panel-head">
          <h2>Sizing</h2>
          <input
            className="text-input search-input"
            type="search"
            placeholder="Search initiatives…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="btn push-right" onClick={addSizingOnly}>
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
                <th className="col-desc">Description</th>
                <th className="col-scope">Scope</th>
                {SIZING_DIMENSIONS.map((d) => (
                  <th key={d.key} className="col-score">
                    {d.label}
                  </th>
                ))}
                <th className="col-tshirt">
                  <button className="th-sort" onClick={() => toggleSort("suggested")}>
                    Suggested{sortArrow("suggested")}
                  </button>
                </th>
                <th className="col-tshirt">
                  <button className="th-sort" onClick={() => toggleSort("tShirt")}>
                    T-Shirt{sortArrow("tShirt")}
                  </button>
                </th>
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
              {rows.length === 0 && (
                <tr>
                  <td className="empty-row muted" colSpan={colCount}>
                    No initiatives in Sizing yet. Use “Estimate Size” from an Estimation tab,
                    or “+ Add”.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
