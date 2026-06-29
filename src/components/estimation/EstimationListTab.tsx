// Shared table for the Business and Engineering Estimation tabs (identical columns).
import { useMemo, useState } from "react";
import { useApp, useInitiativesByCategory } from "../../state/store";
import type { ID, Initiative, InitiativeCategory } from "../../types";
import { TrashIcon } from "../ui/TrashIcon";
import { PrioritySelect } from "../initiatives/PrioritySelect";
import { InitiativeNameCell } from "../common/InitiativeNameCell";
import { PillSelect } from "../common/PillSelect";
import { ScopeCell } from "../common/ScopeCell";
import { TShirtSelect } from "../common/TShirtSelect";
import { useInitiativeDelete } from "../common/useInitiativeDelete";
import { addId, removeId } from "../../lib/arrays";
import { PRIORITY_META } from "../../lib/priority";
import { useSort, tShirtRank } from "../../lib/sort";

interface Props {
  category: Extract<InitiativeCategory, "business" | "engineering">;
  title: string;
}

type SortKey = "priority" | "okrs" | "tShirt";

export function EstimationListTab({ category, title }: Props) {
  const { state, addInitiative, updateInitiative, estimateSize } = useApp();
  const rows = useInitiativesByCategory(category);
  const requestDelete = useInitiativeDelete();
  const [search, setSearch] = useState("");
  const { sort, toggleSort, sortArrow } = useSort<SortKey>();

  // Comma-joined OKR names (sorted) for alphabetical column sorting.
  const okrText = (i: Initiative) =>
    i.okrIds
      .map((id) => state.config.okrs.find((o) => o.id === id)?.name ?? "")
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b))
      .join(", ")
      .toLowerCase();

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
        case "okrs":
          cmp = okrText(a).localeCompare(okrText(b));
          break;
        case "tShirt":
          cmp = tShirtRank(a.tShirtSize) - tShirtRank(b.tShirtSize);
          break;
      }
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return sorted;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, search, sort, state.config.okrs]);

  const remove = (i: Initiative) =>
    requestDelete(i, title, () => updateInitiative(i.id, { category: null }));

  const setOkrIds = (i: Initiative, ids: ID[]) => updateInitiative(i.id, { okrIds: ids });

  return (
    <div className="estimation-tab">
      <section className="panel">
        <header className="panel-head">
          <h2>{title}</h2>
          <input
            className="text-input search-input"
            type="search"
            placeholder="Search initiatives…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="btn push-right" onClick={() => addInitiative(category)}>
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
                <th className="col-pills">
                  <button className="th-sort" onClick={() => toggleSort("okrs")}>
                    OKRs{sortArrow("okrs")}
                  </button>
                </th>
                <th className="col-link">PRD</th>
                <th className="col-desc">Description</th>
                <th className="col-scope">Scope</th>
                <th className="col-tshirt">
                  <button className="th-sort" onClick={() => toggleSort("tShirt")}>
                    T-Shirt{sortArrow("tShirt")}
                  </button>
                </th>
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
                    <InitiativeNameCell initiative={i} />
                  </td>
                  <td className="col-pills">
                    <PillSelect
                      options={state.config.okrs}
                      selectedIds={i.okrIds}
                      onAdd={(id) => setOkrIds(i, addId(i.okrIds, id))}
                      onRemove={(id) => setOkrIds(i, removeId(i.okrIds, id))}
                      addLabel="+ Add OKR"
                      emptyHint="Add OKRs in Config"
                    />
                  </td>
                  <td className="col-link">
                    <div className="link-row">
                      <input
                        className="cell-input link-input"
                        value={i.prdLink}
                        placeholder="https://prd (optional)"
                        onChange={(e) => updateInitiative(i.id, { prdLink: e.target.value })}
                      />
                      {i.prdLink && (
                        <a
                          className="open-link"
                          href={i.prdLink}
                          target="_blank"
                          rel="noreferrer"
                          title="Open PRD"
                        >
                          ↗
                        </a>
                      )}
                    </div>
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
                        title={i.stages.sizing ? "Already in Sizing" : "Add to Sizing"}
                        disabled={i.stages.sizing}
                        onClick={() => estimateSize(i.id)}
                      >
                        {i.stages.sizing ? "✓ Sizing" : "Estimate Size"}
                      </button>
                      <button className="icon-btn" title="Delete row" onClick={() => remove(i)}>
                        <TrashIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {displayed.length === 0 && (
                <tr>
                  <td className="empty-row muted" colSpan={8}>
                    No initiatives yet. Click “+ Add” to create one.
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
