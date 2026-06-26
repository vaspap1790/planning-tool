// Initiative category dropdown. Value may be null (uncategorised).
import type { InitiativeCategory } from "../../types";

interface Props {
  value: InitiativeCategory | null;
  onChange: (category: InitiativeCategory | null) => void;
}

const OPTIONS: { value: InitiativeCategory; label: string }[] = [
  { value: "business", label: "Business" },
  { value: "engineering", label: "Engineering" },
  { value: "incoming", label: "Incoming Dependency" },
  { value: "outgoing", label: "Outgoing Dependency" },
];

export function CategorySelect({ value, onChange }: Props) {
  return (
    <select
      className="cell-input category-select"
      value={value ?? ""}
      onChange={(e) =>
        onChange(e.target.value === "" ? null : (e.target.value as InitiativeCategory))
      }
      aria-label="Category"
    >
      <option value="">—</option>
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
