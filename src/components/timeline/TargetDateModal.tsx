// Read-only details for a timeline target-date box, with a link out to the
// owning component's release calendar (disabled when none is configured).
import { formatDisplay } from "../../lib/dates";

export interface TargetDateDetails {
  initiativeName: string;
  componentName: string;
  date: string;
  releaseVersion: string;
  env: string;
  releaseCalendarLink: string;
}

interface Props {
  details: TargetDateDetails;
  onClose: () => void;
}

export function TargetDateModal({ details, onClose }: Props) {
  const hasLink = details.releaseCalendarLink.trim().length > 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal modal-lg"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="modal-title">{details.componentName} target date</h3>

        <dl className="detail-list">
          <dt>Initiative</dt>
          <dd>{details.initiativeName}</dd>
          <dt>Component</dt>
          <dd>{details.componentName}</dd>
          <dt>Date</dt>
          <dd>{formatDisplay(details.date)}</dd>
          <dt>Release</dt>
          <dd>{details.releaseVersion || "—"}</dd>
          <dt>Environment</dt>
          <dd>{details.env || "—"}</dd>
        </dl>

        <div className="modal-actions">
          {hasLink ? (
            <a
              className="btn"
              href={details.releaseCalendarLink}
              target="_blank"
              rel="noreferrer"
            >
              See Release Calendar ↗
            </a>
          ) : (
            <button
              className="btn"
              disabled
              title="Define a Release Calendar link for this component in the Components tab"
            >
              See Release Calendar
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
