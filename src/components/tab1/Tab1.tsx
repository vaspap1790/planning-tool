import { useApp, useActiveComponents } from "../../state/store";
import { timeLeftSprints } from "../../lib/dates";
import type { Initiative } from "../../types";
import { useConfirm } from "../ui/ConfirmDialog";
import { ComponentsList } from "./ComponentsList";
import { TargetDatesCell } from "./TargetDatesCell";

export function Tab1() {
  const { state, addInitiative, updateInitiative, deleteInitiative, toggleComponent } =
    useApp();
  const confirm = useConfirm();
  const activeComponents = useActiveComponents();

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

  return (
    <div className="tab1">
      <ComponentsList />

      <section className="panel">
        <header className="panel-head">
          <h2>Initiatives</h2>
          <button className="btn" onClick={addInitiative}>
            + Add initiative
          </button>
        </header>

        <div className="table-scroll">
          <table className="grid">
            <thead>
              <tr>
                <th className="col-initiative">Initiative</th>
                <th>Estimation (Sprints)</th>
                <th>Time left (Sprints)</th>
                <th className="col-components">Components</th>
                <th>Start Date</th>
                {activeComponents.map((c) => (
                  <th key={c.id} className="col-target">
                    Target Dates – {c.name}
                  </th>
                ))}
                <th className="col-actions" />
              </tr>
            </thead>
            <tbody>
              {state.initiatives.map((i) => (
                <tr key={i.id}>
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
                      🗑
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
