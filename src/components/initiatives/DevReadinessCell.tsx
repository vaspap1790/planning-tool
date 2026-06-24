// Dev-readiness inputs (Architecture / Analytics / Designs) plus user-added
// Dependencies. Each input has a status dropdown and an ETA date (disabled for
// N/A) with its own outline; the wrapper border turns green when everything —
// the three fixed inputs and every dependency — is ready.
import type { DevReadiness, ID, ReadinessStatus } from "../../types";
import { useApp } from "../../state/store";
import { itemOutline, readinessOutline } from "../../lib/readiness";
import { TrashIcon } from "../ui/TrashIcon";

interface Props {
  initiativeId: ID;
  devReadiness: DevReadiness;
}

const ROWS: { key: "architecture" | "analytics" | "designs"; label: string }[] = [
  { key: "architecture", label: "Architecture" },
  { key: "analytics", label: "Analytics" },
  { key: "designs", label: "Designs" },
];

const STATUS_OPTIONS: { value: ReadinessStatus; label: string }[] = [
  { value: "provided", label: "Provided" },
  { value: "not_provided", label: "Not Provided" },
  { value: "na", label: "N/A" },
];

function StatusSelect({
  value,
  onChange,
}: {
  value: ReadinessStatus;
  onChange: (v: ReadinessStatus) => void;
}) {
  return (
    <select
      className="readiness-status"
      value={value}
      onChange={(e) => onChange(e.target.value as ReadinessStatus)}
    >
      {STATUS_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function DevReadinessCell({ initiativeId, devReadiness }: Props) {
  const { updateReadiness, addDependency, updateDependency, deleteDependency } =
    useApp();
  const outline = readinessOutline(devReadiness);

  return (
    <div
      className={`dev-readiness ready-${outline}`}
      title={outline === "green" ? "Dev Ready" : undefined}
    >
      {ROWS.map(({ key, label }) => {
        const item = devReadiness[key];
        return (
          <div className={`readiness-row ready-${itemOutline(item)}`} key={key}>
            <span className="readiness-label">{label}</span>
            <StatusSelect
              value={item.status}
              onChange={(status) => updateReadiness(initiativeId, key, { status })}
            />
            <input
              className="readiness-eta"
              type="date"
              value={item.eta}
              disabled={item.status === "na"}
              title={item.status === "na" ? "ETA not applicable" : "ETA"}
              onChange={(e) => updateReadiness(initiativeId, key, { eta: e.target.value })}
            />
          </div>
        );
      })}

      {devReadiness.dependencies.map((dep) => (
        <div className={`readiness-row dependency-row ready-${itemOutline(dep)}`} key={dep.id}>
          <input
            className="dependency-name"
            value={dep.name}
            placeholder="Dependency name"
            onChange={(e) =>
              updateDependency(initiativeId, dep.id, { name: e.target.value })
            }
          />
          <button
            className="icon-btn dependency-del"
            title="Remove dependency"
            onClick={() => deleteDependency(initiativeId, dep.id)}
          >
            <TrashIcon size={14} />
          </button>
          <StatusSelect
            value={dep.status}
            onChange={(status) => updateDependency(initiativeId, dep.id, { status })}
          />
          <input
            className="readiness-eta"
            type="date"
            value={dep.eta}
            disabled={dep.status === "na"}
            title={dep.status === "na" ? "ETA not applicable" : "ETA"}
            onChange={(e) =>
              updateDependency(initiativeId, dep.id, { eta: e.target.value })
            }
          />
        </div>
      ))}

      <button
        className="btn btn-sm btn-ghost add-dependency"
        onClick={() => addDependency(initiativeId)}
      >
        + Add Dependency
      </button>
    </div>
  );
}
