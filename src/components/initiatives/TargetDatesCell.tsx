import type { ID } from "../../types";
import { useApp } from "../../state/store";
import { warningLevel } from "../../lib/dates";
import { useConfirm } from "../ui/ConfirmDialog";

interface Props {
  initiativeId: ID;
  componentId: ID;
}

/** Editable list of {date, release, env} entries with proximity outlines. */
export function TargetDatesCell({ initiativeId, componentId }: Props) {
  const { state, addTargetDate, updateTargetDate, deleteTargetDate } = useApp();
  const confirm = useConfirm();
  const initiative = state.initiatives.find((i) => i.id === initiativeId)!;
  const entries = initiative.targetDates[componentId] ?? [];

  const removeEntry = async (entryId: ID) => {
    const ok = await confirm({
      title: "Delete this target date?",
      confirmLabel: "Delete",
    });
    if (ok) deleteTargetDate(initiativeId, componentId, entryId);
  };

  return (
    <div className="target-cell">
      {entries.map((e) => (
        <div key={e.id} className={`target-entry warn-${warningLevel(e.date)}`}>
          <button
            className="icon-btn entry-del"
            title="Remove entry"
            onClick={() => removeEntry(e.id)}
          >
            ×
          </button>
          <label className="entry-field">
            <span>Date</span>
            <input
              type="date"
              value={e.date}
              onChange={(ev) =>
                updateTargetDate(initiativeId, componentId, e.id, {
                  date: ev.target.value,
                })
              }
            />
          </label>
          <label className="entry-field">
            <span>Release</span>
            <input
              value={e.releaseVersion}
              placeholder="16.5.0"
              onChange={(ev) =>
                updateTargetDate(initiativeId, componentId, e.id, {
                  releaseVersion: ev.target.value,
                })
              }
            />
          </label>
          <label className="entry-field">
            <span>Env</span>
            <input
              value={e.env}
              placeholder="UAT"
              onChange={(ev) =>
                updateTargetDate(initiativeId, componentId, e.id, {
                  env: ev.target.value,
                })
              }
            />
          </label>
        </div>
      ))}
      <button
        className="btn btn-sm btn-ghost"
        onClick={() => addTargetDate(initiativeId, componentId)}
      >
        + Target date
      </button>
    </div>
  );
}
