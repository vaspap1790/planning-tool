// Generic "+ Add" dropdown + removable pills, driven by a list of named options.
// Reused for Components, OKRs, NatCos and LOBs.
import { useEffect, useRef, useState } from "react";
import type { ID, NamedItem } from "../../types";

interface Props {
  options: NamedItem[];
  selectedIds: ID[];
  onAdd: (id: ID) => void;
  onRemove: (id: ID) => void;
  addLabel?: string;
  /** Shown (muted) when there are no options configured at all. */
  emptyHint?: string;
}

export function PillSelect({
  options,
  selectedIds,
  onAdd,
  onRemove,
  addLabel = "+ Add",
  emptyHint = "None configured",
}: Props) {
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

  const byId = new Map(options.map((o) => [o.id, o]));
  const selected = selectedIds.filter((id) => byId.has(id));
  const available = options.filter((o) => !selectedIds.includes(o.id));

  return (
    <div className="pill-select" ref={ref}>
      <ul className="pill-list">
        {selected.map((id) => (
          <li key={id} className="pill">
            <span>{byId.get(id)!.name}</span>
            <button
              className="pill-del"
              title="Remove"
              aria-label={`Remove ${byId.get(id)!.name}`}
              onClick={() => onRemove(id)}
            >
              ×
            </button>
          </li>
        ))}
      </ul>

      <div className="pill-add-wrap">
        <button
          className="btn btn-sm btn-ghost pill-add"
          disabled={options.length === 0}
          onClick={() => setOpen((o) => !o)}
        >
          {addLabel}
        </button>
        {open && (
          <ul className="pill-menu" role="listbox">
            {available.length === 0 ? (
              <li className="pill-menu-empty muted">
                {options.length === 0 ? emptyHint : "All added"}
              </li>
            ) : (
              available.map((o) => (
                <li key={o.id}>
                  <button
                    className="pill-option"
                    role="option"
                    onClick={() => {
                      onAdd(o.id);
                      setOpen(false);
                    }}
                  >
                    {o.name}
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
