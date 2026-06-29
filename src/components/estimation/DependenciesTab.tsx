// Estimation → Dependencies, with an Incoming / Outgoing segmented switch.
import { useMemo, useState } from "react";
import { useApp, useInitiativesByCategory } from "../../state/store";
import type { Initiative } from "../../types";
import { TrashIcon } from "../ui/TrashIcon";
import { PrioritySelect } from "../initiatives/PrioritySelect";
import { InitiativeNameCell } from "../common/InitiativeNameCell";
import { ScopeCell } from "../common/ScopeCell";
import { TShirtSelect } from "../common/TShirtSelect";
import { StatusSelect } from "../common/StatusSelect";
import { useInitiativeDelete } from "../common/useInitiativeDelete";
import { PRIORITY_META } from "../../lib/priority";
import { useSort, tShirtRank, statusRank } from "../../lib/sort";

type Sub = "incoming" | "outgoing";

export function DependenciesTab() {
  const [sub, setSub] = useState<Sub>("incoming");
  return (
    <div className="estimation-tab">
      <div className="subtabs segmented">
        <button
          className={`seg ${sub === "incoming" ? "active" : ""}`}
          onClick={() => setSub("incoming")}
        >
          Incoming
        </button>
        <button
          className={`seg ${sub === "outgoing" ? "active" : ""}`}
          onClick={() => setSub("outgoing")}
        >
          Outgoing
        </button>
      </div>
      {sub === "incoming" ? <IncomingTable /> : <OutgoingTable />}
    </div>
  );
}

type IncomingSortKey = "priority" | "tShirt" | "status";

function IncomingTable() {
  const { addInitiative, updateInitiative, estimateSize } = useApp();
  const rows = useInitiativesByCategory("incoming");
  const requestDelete = useInitiativeDelete();
  const [search, setSearch] = useState("");
  const { sort, toggleSort, sortArrow } = useSort<IncomingSortKey>();

  const remove = (i: Initiative) =>
    requestDelete(i, "Incoming Dependencies", () =>
      updateInitiative(i.id, { category: null })
    );

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
        case "tShirt":
          cmp = tShirtRank(a.tShirtSize) - tShirtRank(b.tShirtSize);
          break;
        case "status":
          cmp = statusRank(a.status) - statusRank(b.status);
          break;
      }
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [rows, search, sort]);

  return (
    <section className="panel">
      <header className="panel-head">
        <h2>Incoming Dependencies</h2>
        <input
          className="text-input search-input"
          type="search"
          placeholder="Search initiatives…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn push-right" onClick={() => addInitiative("incoming")}>
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
              <th className="col-tshirt">
                <button className="th-sort" onClick={() => toggleSort("tShirt")}>
                  T-Shirt{sortArrow("tShirt")}
                </button>
              </th>
              <th className="col-status">
                <button className="th-sort" onClick={() => toggleSort("status")}>
                  Status{sortArrow("status")}
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
                <td className="col-status center">
                  <StatusSelect
                    value={i.status}
                    onChange={(status) => updateInitiative(i.id, { status })}
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
                <td className="empty-row muted" colSpan={7}>
                  No incoming dependencies yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function OutgoingTable() {
  const {
    addInitiative,
    updateInitiative,
    estimateSize,
    addOutgoingDep,
    updateOutgoingDep,
    deleteOutgoingDep,
  } = useApp();
  const rows = useInitiativesByCategory("outgoing");
  const requestDelete = useInitiativeDelete();
  const [search, setSearch] = useState("");
  const { sort, toggleSort, sortArrow } = useSort<"priority">();

  const remove = (i: Initiative) =>
    requestDelete(i, "Outgoing Dependencies", () =>
      updateInitiative(i.id, { category: null })
    );

  const displayed = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q ? rows.filter((i) => i.name.toLowerCase().includes(q)) : rows;
    if (!sort) return filtered;
    const sorted = [...filtered].sort((a, b) => {
      const cmp = PRIORITY_META[a.priority].rank - PRIORITY_META[b.priority].rank;
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [rows, search, sort]);

  return (
    <section className="panel">
      <header className="panel-head">
        <h2>Outgoing Dependencies</h2>
        <input
          className="text-input search-input"
          type="search"
          placeholder="Search initiatives…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn push-right" onClick={() => addInitiative("outgoing")}>
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
              <th className="col-outgoing">Dependencies</th>
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
                <td className="col-desc">
                  <textarea
                    className="cell-input textarea"
                    value={i.description}
                    placeholder="Description"
                    onChange={(e) => updateInitiative(i.id, { description: e.target.value })}
                  />
                </td>
                <td className="col-outgoing">
                  <div className="outgoing-deps">
                    {i.outgoingDeps.map((d) => (
                      <div key={d.id} className="outgoing-dep">
                        <button
                          className="icon-btn dep-del"
                          title="Remove dependency"
                          onClick={() => deleteOutgoingDep(i.id, d.id)}
                        >
                          ×
                        </button>
                        <label className="dep-field">
                          <span>Raised</span>
                          <input
                            className="cell-input"
                            value={d.raised}
                            placeholder="Raised item"
                            onChange={(e) =>
                              updateOutgoingDep(i.id, d.id, { raised: e.target.value })
                            }
                          />
                        </label>
                        <label className="dep-field">
                          <span>Link</span>
                          <div className="link-row">
                            <input
                              className="cell-input link-input"
                              value={d.raisedLink}
                              placeholder="https://link"
                              onChange={(e) =>
                                updateOutgoingDep(i.id, d.id, { raisedLink: e.target.value })
                              }
                            />
                            {d.raisedLink && (
                              <a
                                className="open-link"
                                href={d.raisedLink}
                                target="_blank"
                                rel="noreferrer"
                                title="Open link"
                              >
                                ↗
                              </a>
                            )}
                          </div>
                        </label>
                        <label className="dep-field">
                          <span>Team</span>
                          <input
                            className="cell-input"
                            value={d.team}
                            placeholder="Team"
                            onChange={(e) =>
                              updateOutgoingDep(i.id, d.id, { team: e.target.value })
                            }
                          />
                        </label>
                        <div className="dep-inline">
                          <label className="dep-check">
                            <input
                              type="checkbox"
                              checked={d.handover}
                              onChange={(e) =>
                                updateOutgoingDep(i.id, d.id, { handover: e.target.checked })
                              }
                            />
                            <span>Handover</span>
                          </label>
                          <label className="dep-check">
                            <input
                              type="checkbox"
                              checked={d.committed}
                              onChange={(e) =>
                                updateOutgoingDep(i.id, d.id, { committed: e.target.checked })
                              }
                            />
                            <span>Committed</span>
                          </label>
                        </div>
                        <label className="dep-field">
                          <span>ETA</span>
                          <input
                            className="cell-input"
                            type="date"
                            value={d.eta}
                            onChange={(e) =>
                              updateOutgoingDep(i.id, d.id, { eta: e.target.value })
                            }
                          />
                        </label>
                        <label className="dep-field">
                          <span>Note</span>
                          <input
                            className="cell-input"
                            value={d.note}
                            placeholder="Note"
                            onChange={(e) =>
                              updateOutgoingDep(i.id, d.id, { note: e.target.value })
                            }
                          />
                        </label>
                      </div>
                    ))}
                    <button
                      className="btn btn-sm btn-ghost"
                      onClick={() => addOutgoingDep(i.id)}
                    >
                      + Dependency
                    </button>
                  </div>
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
                <td className="empty-row muted" colSpan={5}>
                  No outgoing dependencies yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
