import { useState } from "react";
import type { ID } from "../../types";
import { useApp } from "../../state/store";
import { formatDisplay, pendingBadgeCount, targetEntryLevel } from "../../lib/dates";
import { newId } from "../../lib/storage";
import { useConfirm } from "../ui/ConfirmDialog";
import { TargetDateModal } from "../timeline/TargetDateModal";

interface Props {
  initiativeId: ID;
  componentId: ID;
}

/**
 * Read-only target-date chips with proximity / success colouring and a pending-
 * handover badge. Clicking a chip — or adding a new one — opens the editable modal
 * (merge link, handover, Resolve). The × removes the entry inline. Display matches
 * the timeline boxes.
 */
export function TargetDatesCell({ initiativeId, componentId }: Props) {
  const { state, addTargetDate, deleteTargetDate } = useApp();
  const confirm = useConfirm();
  const [openEntryId, setOpenEntryId] = useState<ID | null>(null);
  const initiative = state.initiatives.find((i) => i.id === initiativeId)!;
  const entries = initiative.targetDates[componentId] ?? [];

  const addEntry = () => {
    const id = newId();
    addTargetDate(initiativeId, componentId, id);
    setOpenEntryId(id); // open the modal in edit mode for the new entry
  };

  const removeEntry = async (entryId: ID) => {
    const ok = await confirm({
      title: "Delete this target date?",
      message: "This entry and its handover details will be removed.",
      confirmLabel: "Delete",
    });
    if (ok) deleteTargetDate(initiativeId, componentId, entryId);
  };

  return (
    <div className="target-cell">
      {entries.map((e) => (
        <div
          key={e.id}
          className={`target-chip warn-${targetEntryLevel(e)}`}
          onClick={() => setOpenEntryId(e.id)}
          onKeyDown={(ev) => ev.key === "Enter" && setOpenEntryId(e.id)}
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
              removeEntry(e.id);
            }}
          >
            ×
          </button>
          <strong>{formatDisplay(e.date)}</strong>
          {e.releaseVersion && <span>v{e.releaseVersion}</span>}
          {e.env && <span className="td-env">{e.env}</span>}
          {pendingBadgeCount(e) > 0 && (
            <span
              className="td-badge"
              title={`${pendingBadgeCount(e)} pending action(s)`}
              aria-label={`${pendingBadgeCount(e)} pending actions`}
            >
              {pendingBadgeCount(e)}
            </span>
          )}
        </div>
      ))}
      <button className="btn btn-sm btn-ghost" onClick={addEntry}>
        + Target date
      </button>

      {openEntryId && (
        <TargetDateModal
          initiativeId={initiativeId}
          componentId={componentId}
          entryId={openEntryId}
          onClose={() => setOpenEntryId(null)}
        />
      )}
    </div>
  );
}
