// An initiative's scope — its Components, NatCos, LOBs and Flows — shown as
// grouped pills. Each group has a "+" to add items and an × to remove them, so
// scope can be edited here as well as in the Estimation tabs.
import { useEffect, useRef, useState } from "react";
import { useApp } from "../../state/store";
import type { ID, Initiative, NamedItem } from "../../types";
import { addId, removeId } from "../../lib/arrays";

interface Group {
  label: string;
  options: NamedItem[];
  selectedIds: ID[];
  onAdd: (id: ID) => void;
  onRemove: (id: ID) => void;
}

export function ScopeCell({ initiative: i }: { initiative: Initiative }) {
  const { state, updateInitiative, toggleComponent } = useApp();

  const setIds = (key: "natcoIds" | "lobIds" | "flowIds", ids: ID[]) =>
    updateInitiative(i.id, { [key]: ids });

  const groups: Group[] = [
    {
      label: "Components",
      options: state.components,
      selectedIds: state.components
        .filter((c) => i.checkedComponents[c.id])
        .map((c) => c.id),
      onAdd: (id) => toggleComponent(i.id, id),
      onRemove: (id) => toggleComponent(i.id, id),
    },
    {
      label: "NatCos",
      options: state.config.natcos,
      selectedIds: i.natcoIds,
      onAdd: (id) => setIds("natcoIds", addId(i.natcoIds, id)),
      onRemove: (id) => setIds("natcoIds", removeId(i.natcoIds, id)),
    },
    {
      label: "LOBs",
      options: state.config.lobs,
      selectedIds: i.lobIds,
      onAdd: (id) => setIds("lobIds", addId(i.lobIds, id)),
      onRemove: (id) => setIds("lobIds", removeId(i.lobIds, id)),
    },
    {
      label: "Flows",
      options: state.config.flows,
      selectedIds: i.flowIds,
      onAdd: (id) => setIds("flowIds", addId(i.flowIds, id)),
      onRemove: (id) => setIds("flowIds", removeId(i.flowIds, id)),
    },
  ];

  return (
    <div className="scope-cell">
      {groups.map((g) => (
        <ScopeGroup key={g.label} group={g} />
      ))}
    </div>
  );
}

function ScopeGroup({ group: g }: { group: Group }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLLIElement>(null);

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

  const byId = new Map(g.options.map((o) => [o.id, o]));
  const selected = g.selectedIds.filter((id) => byId.has(id));
  const available = g.options.filter((o) => !g.selectedIds.includes(o.id));

  return (
    <div className="scope-group">
      <span className="scope-label">{g.label}</span>
      <ul className="pill-list">
        {selected.map((id) => (
          <li key={id} className="pill pill-readonly">
            <span>{byId.get(id)!.name}</span>
            <button
              className="pill-del"
              title="Remove"
              aria-label={`Remove ${byId.get(id)!.name}`}
              onClick={() => g.onRemove(id)}
            >
              ×
            </button>
          </li>
        ))}
        <li className="scope-add-wrap" ref={ref}>
          <button
            className="scope-add"
            disabled={g.options.length === 0}
            title={`Add ${g.label}`}
            aria-label={`Add ${g.label}`}
            onClick={() => setOpen((o) => !o)}
          >
            +
          </button>
          {open && (
            <ul className="pill-menu" role="listbox">
              {available.length === 0 ? (
                <li className="pill-menu-empty muted">
                  {g.options.length === 0 ? `Add ${g.label} in Config` : "All added"}
                </li>
              ) : (
                available.map((o) => (
                  <li key={o.id}>
                    <button
                      className="pill-option"
                      role="option"
                      onClick={() => {
                        g.onAdd(o.id);
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
        </li>
      </ul>
    </div>
  );
}
