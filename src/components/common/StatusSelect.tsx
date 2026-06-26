// Incoming-dependency status dropdown with a colour-coded badge look.
import type { DependencyStatus } from "../../types";

interface Props {
  value: DependencyStatus;
  onChange: (status: DependencyStatus) => void;
}

const OPTIONS: { value: DependencyStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
];

export function StatusSelect({ value, onChange }: Props) {
  return (
    <select
      className={`cell-input status-select status-${value}`}
      value={value}
      onChange={(e) => onChange(e.target.value as DependencyStatus)}
      aria-label="Status"
    >
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
