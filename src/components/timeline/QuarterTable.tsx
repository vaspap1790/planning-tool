import { useApp } from "../../state/store";
import { useConfirm } from "../ui/ConfirmDialog";
import { TrashIcon } from "../ui/TrashIcon";

export function QuarterTable() {
  const { state, addQuarter, updateQuarter, deleteQuarter } = useApp();
  const confirm = useConfirm();

  const remove = async (id: string, label: string) => {
    const ok = await confirm({
      title: `Delete ${label}?`,
      message: "The timeline below will adjust automatically.",
    });
    if (ok) deleteQuarter(id);
  };

  return (
    <section className="panel">
      <header className="panel-head">
        <h2>Quarters</h2>
        <button className="btn" onClick={addQuarter}>
          + Add quarter
        </button>
      </header>
      <table className="grid quarter-grid">
        <thead>
          <tr>
            <th>Quarter</th>
            <th>Year</th>
            <th>Start</th>
            <th>End</th>
            <th className="col-actions" />
          </tr>
        </thead>
        <tbody>
          {state.quarters.map((q) => (
            <tr key={q.id}>
              <td className="center">
                <input
                  className="cell-input num"
                  type="number"
                  min={1}
                  max={4}
                  value={q.quarter}
                  onChange={(e) =>
                    updateQuarter(q.id, { quarter: parseInt(e.target.value, 10) || 1 })
                  }
                />
              </td>
              <td className="center">
                <input
                  className="cell-input num wide"
                  type="number"
                  value={q.year}
                  onChange={(e) =>
                    updateQuarter(q.id, { year: parseInt(e.target.value, 10) || 0 })
                  }
                />
              </td>
              <td className="center">
                <input
                  className={`cell-input ${q.start ? "" : "invalid"}`}
                  type="date"
                  value={q.start}
                  onChange={(e) => updateQuarter(q.id, { start: e.target.value })}
                />
              </td>
              <td className="center">
                <input
                  className={`cell-input ${q.end ? "" : "invalid"}`}
                  type="date"
                  value={q.end}
                  onChange={(e) => updateQuarter(q.id, { end: e.target.value })}
                />
              </td>
              <td className="col-actions">
                <button
                  className="icon-btn"
                  title="Delete quarter"
                  onClick={() => remove(q.id, `Q${q.quarter} ${q.year}`)}
                >
                  <TrashIcon />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
