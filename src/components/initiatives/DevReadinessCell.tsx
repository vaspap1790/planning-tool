// Dev-readiness inputs (Architecture / Analytics / Designs) plus user-added
// Dependencies. Each input has a status dropdown and an ETA date (disabled for
// N/A) with its own outline; the wrapper border turns green when everything is
// ready. Built-ins hide when set to N/A and can be brought back from the + menu.
import { useEffect, useRef, useState } from "react";
import type { DevReadiness, ID, ReadinessStatus } from "../../types";
import { useApp } from "../../state/store";
import { itemOutline, readinessOutline } from "../../lib/readiness";
import { useConfirm } from "../ui/ConfirmDialog";
import { TrashIcon } from "../ui/TrashIcon";

interface Props {
  initiativeId: ID;
  devReadiness: DevReadiness;
}

type BuiltinKey = "architecture" | "analytics" | "designs";
const ROWS: { key: BuiltinKey; label: string }[] = [
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
  const confirm = useConfirm();
  const outline = readinessOutline(devReadiness);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  // Built-ins set to N/A are hidden but can be restored from the + menu.
  const visibleRows = ROWS.filter(({ key }) => devReadiness[key].status !== "na");
  const hiddenRows = ROWS.filter(({ key }) => devReadiness[key].status === "na");

  const restoreBuiltin = (key: BuiltinKey) => {
    updateReadiness(initiativeId, key, { status: "not_provided" });
    setMenuOpen(false);
  };
  const addManual = () => {
    addDependency(initiativeId);
    setMenuOpen(false);
  };
  const removeDependency = async (depId: ID, name: string) => {
    const ok = await confirm({
      title: `Delete dependency${name.trim() ? ` "${name}"` : ""}?`,
      message: "This dependency will be removed from Dev Readiness.",
      confirmLabel: "Delete",
    });
    if (ok) deleteDependency(initiativeId, depId);
  };

  return (
    <div
      className={`dev-readiness ready-${outline}`}
      title={outline === "green" ? "Dev Ready" : undefined}
    >
      {visibleRows.map(({ key, label }) => {
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
            onClick={() => removeDependency(dep.id, dep.name)}
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

      <div className="readiness-add-wrap" ref={menuRef}>
        <button
          className="btn btn-sm btn-ghost add-dependency"
          onClick={() => setMenuOpen((o) => !o)}
        >
          + Add
        </button>
        {menuOpen && (
          <ul className="pill-menu" role="listbox">
            {hiddenRows.map(({ key, label }) => (
              <li key={key}>
                <button className="pill-option" role="option" onClick={() => restoreBuiltin(key)}>
                  {label}
                </button>
              </li>
            ))}
            {hiddenRows.length > 0 && <li className="pill-menu-sep" aria-hidden="true" />}
            <li>
              <button className="pill-option" role="option" onClick={addManual}>
                Custom dependency…
              </button>
            </li>
          </ul>
        )}
      </div>
    </div>
  );
}
