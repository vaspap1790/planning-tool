// Planning phase. Per-platform capacity vs. committed effort, with live deficits.
import { Fragment, useMemo } from "react";
import { useApp, usePlanningInitiatives } from "../../state/store";
import type { ID, Initiative, InitiativeCategory } from "../../types";
import { sprintsBetween } from "../../lib/dates";
import { TrashIcon } from "../ui/TrashIcon";
import { ScopeCell } from "../common/ScopeCell";
import { useInitiativeDelete } from "../common/useInitiativeDelete";
import { useAddInitiative } from "../common/useAddInitiative";

const GROUPS: { category: InitiativeCategory; label: string }[] = [
  { category: "business", label: "Business" },
  { category: "engineering", label: "Engineering" },
  { category: "incoming", label: "Incoming Dependencies" },
];

function deficitClass(value: number): string {
  if (value < 0) return "deficit neg";
  if (value > 0) return "deficit pos";
  return "deficit zero";
}

export function PlanningTab() {
  const {
    state,
    updateInitiative,
    setStage,
    setPlanningEffort,
    addToImplementation,
    updatePlanningConfig,
    updatePlanningCapacity,
  } = useApp();
  const rows = usePlanningInitiatives();
  const requestDelete = useInitiativeDelete();
  const addInitiative = useAddInitiative();

  const platforms = state.config.platforms;
  const { qStart, qEnd, capacity } = state.config.planning;
  const qSprints = sprintsBetween(qStart, qEnd, state.config.sprintWeeks);

  const capacityOf = (platformId: ID) => {
    const c = capacity[platformId] ?? { engineers: 0, unavailable: 0 };
    return c.engineers * qSprints - c.unavailable;
  };

  // Per-platform aggregate of committed effort across all planning initiatives.
  const aggregates = useMemo(() => {
    const map: Record<ID, number> = {};
    for (const p of platforms) {
      map[p.id] = rows.reduce((sum, i) => sum + (i.planningEffort[p.id] || 0), 0);
    }
    return map;
  }, [platforms, rows]);

  const remove = (i: Initiative) =>
    requestDelete(i, "Planning", () => setStage(i.id, "planning", false));

  const grouped = GROUPS.map((g) => ({
    ...g,
    items: rows.filter((i) => i.category === g.category),
  }));
  // Planning initiatives without one of the three planning categories (e.g. added
  // directly here) are shown in an "Other" group so they aren't lost.
  const other = rows.filter(
    (i) => !GROUPS.some((g) => g.category === i.category)
  );

  return (
    <div className="planning-tab">
      <section className="panel">
        <header className="panel-head">
          <h2>Planning</h2>
          <div className="planning-quarter">
            <label className="dep-field">
              <span>Q start</span>
              <input
                className="cell-input"
                type="date"
                value={qStart}
                onChange={(e) => updatePlanningConfig({ qStart: e.target.value })}
              />
            </label>
            <label className="dep-field">
              <span>Q end</span>
              <input
                className="cell-input"
                type="date"
                value={qEnd}
                onChange={(e) => updatePlanningConfig({ qEnd: e.target.value })}
              />
            </label>
            <div className="dep-field">
              <span>Q sprints</span>
              <strong className="q-sprints">{qSprints}</strong>
            </div>
          </div>
          <button
            className="btn push-right"
            onClick={() => addInitiative({ planning: true })}
          >
            + Add
          </button>
        </header>

        <div className="table-scroll">
          <table className="grid planning-grid">
            <thead>
              <tr>
                <th className="col-initiative">Initiative</th>
                <th className="col-scope">Scope</th>
                {platforms.map((p) => (
                  <th key={p.id} className="col-platform">
                    {p.name}
                  </th>
                ))}
                <th className="col-actions" />
              </tr>
            </thead>
            <tbody>
              {/* Capacity block */}
              <tr className="section-row">
                <td>Engineers</td>
                <td />
                {platforms.map((p) => (
                  <td key={p.id} className="center">
                    <input
                      className="cell-input num"
                      type="number"
                      min={0}
                      value={capacity[p.id]?.engineers ?? 0}
                      onChange={(e) =>
                        updatePlanningCapacity(p.id, {
                          engineers: Math.max(0, parseInt(e.target.value, 10) || 0),
                        })
                      }
                    />
                  </td>
                ))}
                <td />
              </tr>
              <tr className="section-row">
                <td>Unavailable (Sprints)</td>
                <td />
                {platforms.map((p) => (
                  <td key={p.id} className="center">
                    <input
                      className="cell-input num"
                      type="number"
                      min={0}
                      value={capacity[p.id]?.unavailable ?? 0}
                      onChange={(e) =>
                        updatePlanningCapacity(p.id, {
                          unavailable: Math.max(0, parseInt(e.target.value, 10) || 0),
                        })
                      }
                    />
                  </td>
                ))}
                <td />
              </tr>
              <tr className="total-row">
                <td>Capacity (Sprints)</td>
                <td />
                {platforms.map((p) => (
                  <td key={p.id} className="center computed">
                    {capacityOf(p.id)}
                  </td>
                ))}
                <td />
              </tr>

              {/* Initiatives grouped by category */}
              {grouped.map((g) =>
                g.items.length === 0 ? null : (
                  <Fragment key={g.category}>
                    <tr className="group-row">
                      <td colSpan={platforms.length + 3}>{g.label}</td>
                    </tr>
                    {g.items.map((i) => (
                      <InitiativeRow
                        key={i.id}
                        initiative={i}
                        platforms={platforms}
                        setPlanningEffort={setPlanningEffort}
                        updateInitiative={updateInitiative}
                        addToImplementation={addToImplementation}
                        onDelete={remove}
                      />
                    ))}
                  </Fragment>
                )
              )}
              {other.length > 0 && (
                <Fragment>
                  <tr className="group-row">
                    <td colSpan={platforms.length + 3}>Other</td>
                  </tr>
                  {other.map((i) => (
                    <InitiativeRow
                      key={i.id}
                      initiative={i}
                      platforms={platforms}
                      setPlanningEffort={setPlanningEffort}
                      updateInitiative={updateInitiative}
                      addToImplementation={addToImplementation}
                      onDelete={remove}
                    />
                  ))}
                </Fragment>
              )}

              {/* Totals */}
              <tr className="total-row">
                <td>Aggregate (Sprints)</td>
                <td />
                {platforms.map((p) => (
                  <td key={p.id} className="center computed">
                    {aggregates[p.id]}
                  </td>
                ))}
                <td />
              </tr>
              <tr className="total-row">
                <td>Deficit (Sprints)</td>
                <td />
                {platforms.map((p) => {
                  const d = capacityOf(p.id) - aggregates[p.id];
                  return (
                    <td key={p.id} className="center">
                      <span className={deficitClass(d)}>{d}</span>
                    </td>
                  );
                })}
                <td />
              </tr>

              {platforms.length === 0 && (
                <tr>
                  <td className="empty-row muted" colSpan={3}>
                    No platforms configured. Add Platforms in Config.
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

function InitiativeRow({
  initiative: i,
  platforms,
  setPlanningEffort,
  updateInitiative,
  addToImplementation,
  onDelete,
}: {
  initiative: Initiative;
  platforms: { id: ID; name: string }[];
  setPlanningEffort: (initiativeId: ID, platformId: ID, sprints: number) => void;
  updateInitiative: (id: ID, patch: Partial<Initiative>) => void;
  addToImplementation: (id: ID) => void;
  onDelete: (i: Initiative) => void;
}) {
  return (
    <tr data-initiative-id={i.id}>
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
            <a className="open-link" href={i.link} target="_blank" rel="noreferrer" title="Open link">
              ↗
            </a>
          )}
        </div>
      </td>
      <td className="col-scope">
        <ScopeCell initiative={i} />
      </td>
      {platforms.map((p) => (
        <td key={p.id} className="center">
          <input
            className="cell-input num"
            type="number"
            min={0}
            value={i.planningEffort[p.id] || 0}
            onChange={(e) =>
              setPlanningEffort(i.id, p.id, Math.max(0, parseInt(e.target.value, 10) || 0))
            }
          />
        </td>
      ))}
      <td className="col-actions">
        <div className="row-actions">
          <button
            className="btn btn-sm btn-ghost"
            title={i.stages.implementation ? "Already in Implementation" : "Add to Implementation"}
            disabled={i.stages.implementation}
            onClick={() => addToImplementation(i.id)}
          >
            {i.stages.implementation ? "✓ Impl." : "Add to Impl."}
          </button>
          <button className="icon-btn" title="Delete row" onClick={() => onDelete(i)}>
            <TrashIcon />
          </button>
        </div>
      </td>
    </tr>
  );
}
