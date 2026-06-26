// Editable target-date modal, shared by the Board and the Timeline. Exposes the
// inline fields (date / release / env) plus the modal-only fields (Merge Link,
// Handover) and a Resolve action that marks the entry successful once it is due.
import { useState } from "react";
import type { ID } from "../../types";
import { useApp } from "../../state/store";
import { targetReached } from "../../lib/dates";

interface Props {
  initiativeId: ID;
  componentId: ID;
  entryId: ID;
  onClose: () => void;
}

export function TargetDateModal({ initiativeId, componentId, entryId, onClose }: Props) {
  const { state, updateTargetDate } = useApp();
  const [teamDraft, setTeamDraft] = useState("");

  const initiative = state.initiatives.find((i) => i.id === initiativeId);
  const component = state.components.find((c) => c.id === componentId);
  const entry = initiative?.targetDates[componentId]?.find((e) => e.id === entryId);
  if (!initiative || !entry) return null;

  const patch = (p: Parameters<typeof updateTargetDate>[3]) =>
    updateTargetDate(initiativeId, componentId, entryId, p);

  const releaseCalendarLink = component?.releaseCalendarLink ?? "";
  const hasCalendar = releaseCalendarLink.trim().length > 0;
  const canResolve = !entry.successful && targetReached(entry.date);

  const addTeam = () => {
    const name = teamDraft.trim();
    if (!name) return;
    patch({ handoverTo: [...entry.handoverTo, { name, done: false }] });
    setTeamDraft("");
  };
  const removeTeam = (idx: number) =>
    patch({ handoverTo: entry.handoverTo.filter((_, j) => j !== idx) });
  const toggleTeam = (idx: number, done: boolean) =>
    patch({
      handoverTo: entry.handoverTo.map((h, j) => (j === idx ? { ...h, done } : h)),
    });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal modal-lg"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="modal-title">
          {component?.name ?? "Target"} target date
          <span
            className={`td-status td-status-${entry.successful ? "ok" : targetReached(entry.date) ? "due" : "pending"}`}
          >
            {entry.successful ? "Successful" : targetReached(entry.date) ? "Due" : "Pending"}
          </span>
        </h3>
        <p className="modal-sub muted">{initiative.name}</p>

        <div className="td-form">
          <label className="entry-field">
            <span>Date</span>
            <input
              type="date"
              value={entry.date}
              onChange={(e) => patch({ date: e.target.value })}
            />
          </label>
          <label className="entry-field">
            <span>Release</span>
            <input
              value={entry.releaseVersion}
              placeholder="16.5.0"
              onChange={(e) => patch({ releaseVersion: e.target.value })}
            />
          </label>
          <label className="entry-field">
            <span>Environment</span>
            <input
              value={entry.env}
              placeholder="UAT"
              onChange={(e) => patch({ env: e.target.value })}
            />
          </label>

          <label className="entry-field td-span">
            <span>Merge Link</span>
            <div className="link-row">
              <input
                value={entry.mergeLink}
                placeholder="https://… (optional)"
                onChange={(e) => patch({ mergeLink: e.target.value })}
              />
              {entry.mergeLink && (
                <a
                  className="open-link"
                  href={entry.mergeLink}
                  target="_blank"
                  rel="noreferrer"
                  title="Open merge link"
                >
                  ↗
                </a>
              )}
            </div>
          </label>

          <div className="entry-field td-span">
            <span>Handover needed</span>
            <div className="segmented">
              <button
                className={`seg ${entry.handoverNeeded ? "active" : ""}`}
                onClick={() => patch({ handoverNeeded: true })}
              >
                Yes
              </button>
              <button
                className={`seg ${!entry.handoverNeeded ? "active" : ""}`}
                onClick={() => patch({ handoverNeeded: false })}
              >
                No
              </button>
            </div>
          </div>

          {entry.handoverNeeded && (
            <div className="entry-field td-span">
              <span>Handover to</span>
              <ul className="handover-list">
                {entry.handoverTo.map((h, idx) => (
                  <li key={idx} className="handover-item">
                    <label className="handover-check" title="Mark handover as done">
                      <input
                        type="checkbox"
                        checked={h.done}
                        onChange={(e) => toggleTeam(idx, e.target.checked)}
                      />
                      <span className={h.done ? "handover-done" : ""}>{h.name}</span>
                    </label>
                    <button
                      className="pill-del"
                      title="Remove team"
                      aria-label={`Remove ${h.name}`}
                      onClick={() => removeTeam(idx)}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
              <div className="add-row">
                <input
                  className="text-input"
                  placeholder="Add a team…"
                  value={teamDraft}
                  onChange={(e) => setTeamDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTeam()}
                />
                <button className="btn btn-sm" onClick={addTeam}>
                  + Add
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="modal-actions">
          {hasCalendar ? (
            <a className="btn btn-ghost" href={releaseCalendarLink} target="_blank" rel="noreferrer">
              Release Calendar ↗
            </a>
          ) : null}
          {entry.successful ? (
            <button
              className="btn btn-ghost"
              onClick={() => patch({ successful: false })}
              title="Mark as not yet successful"
            >
              Reopen
            </button>
          ) : (
            <button
              className="btn td-resolve"
              disabled={!canResolve}
              onClick={() => patch({ successful: true })}
              title={
                canResolve
                  ? "Mark this target date as successfully met"
                  : "Available once the target date is reached"
              }
            >
              Resolve
            </button>
          )}
          <button className="btn btn-ghost" onClick={onClose} autoFocus>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
