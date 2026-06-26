// T-shirt size dropdown. Writes `tShirtSize`, which is shared across every tab.
import type { TShirtSize } from "../../types";
import { T_SHIRT_SIZES } from "../../lib/sizing";

interface Props {
  value: TShirtSize;
  onChange: (size: TShirtSize) => void;
}

export function TShirtSelect({ value, onChange }: Props) {
  return (
    <select
      className="cell-input tshirt-select"
      value={value}
      onChange={(e) => onChange(e.target.value as TShirtSize)}
      aria-label="T-shirt size"
    >
      <option value="">—</option>
      {T_SHIRT_SIZES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}
