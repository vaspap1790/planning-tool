// Icon-only priority button that opens a popover of all levels (icon + label).
import { useEffect, useRef, useState } from "react";
import type { Priority } from "../../types";
import { PRIORITY_META, PRIORITY_ORDER } from "../../lib/priority";
import { PriorityIcon } from "./PriorityIcon";

interface Props {
  value: Priority;
  onChange: (p: Priority) => void;
}

export function PrioritySelect({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="priority-select" ref={ref}>
      <button
        className="priority-trigger"
        title={`Priority: ${PRIORITY_META[value].label}`}
        aria-label={`Priority: ${PRIORITY_META[value].label}. Click to change.`}
        onClick={() => setOpen((o) => !o)}
      >
        <PriorityIcon priority={value} />
      </button>
      {open && (
        <ul className="priority-menu" role="listbox">
          {PRIORITY_ORDER.map((p) => (
            <li key={p}>
              <button
                className={`priority-option ${p === value ? "active" : ""}`}
                role="option"
                aria-selected={p === value}
                onClick={() => {
                  onChange(p);
                  setOpen(false);
                }}
              >
                <PriorityIcon priority={p} />
                <span>{PRIORITY_META[p].label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
