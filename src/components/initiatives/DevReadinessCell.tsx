// Dev-readiness inputs (Architecture / Analytics / Designs). Each row has a
// status dropdown and an ETA date (disabled for N/A). The wrapper border signals
// overall readiness: green = Dev Ready, yellow/red = a pending ETA approaching/past.
import type { DevReadiness, ID, ReadinessStatus } from "../../types";
import { useApp } from "../../state/store";
import { itemOutline, readinessOutline } from "../../lib/readiness";

interface Props {
  initiativeId: ID;
  devReadiness: DevReadiness;
}

const ROWS: { key: keyof DevReadiness; label: string }[] = [
  { key: "architecture", label: "Architecture" },
  { key: "analytics", label: "Analytics" },
  { key: "designs", label: "Designs" },
];

const STATUS_OPTIONS: { value: ReadinessStatus; label: string }[] = [
  { value: "provided", label: "Provided" },
  { value: "not_provided", label: "Not Provided" },
  { value: "na", label: "N/A" },
];

export function DevReadinessCell({ initiativeId, devReadiness }: Props) {
  const { updateReadiness } = useApp();
  const outline = readinessOutline(devReadiness);

  return (
    <div
      className={`dev-readiness ready-${outline}`}
      title={outline === "green" ? "Dev Ready" : undefined}
    >
      {ROWS.map(({ key, label }) => {
        const item = devReadiness[key];
        const disabledEta = item.status === "na";
        return (
          <div className={`readiness-row ready-${itemOutline(item)}`} key={key}>
            <span className="readiness-label">{label}</span>
            <select
              className="readiness-status"
              value={item.status}
              onChange={(e) =>
                updateReadiness(initiativeId, key, {
                  status: e.target.value as ReadinessStatus,
                })
              }
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <input
              className="readiness-eta"
              type="date"
              value={item.eta}
              disabled={disabledEta}
              title={disabledEta ? "ETA not applicable" : "ETA"}
              onChange={(e) =>
                updateReadiness(initiativeId, key, { eta: e.target.value })
              }
            />
          </div>
        );
      })}
    </div>
  );
}
