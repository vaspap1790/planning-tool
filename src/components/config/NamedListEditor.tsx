// Add / edit / delete a text-only config list (OKRs, LOBs, NatCos, Platforms).
import { useState } from "react";
import { useApp, type NamedList } from "../../state/store";
import { useConfirm } from "../ui/ConfirmDialog";

interface Props {
  list: NamedList;
  title: string;
  placeholder: string;
  /** Warning shown before deleting, e.g. "It will be removed from every initiative." */
  deleteWarning: string;
}

export function NamedListEditor({ list, title, placeholder, deleteWarning }: Props) {
  const { state, addNamedItem, updateNamedItem, deleteNamedItem } = useApp();
  const confirm = useConfirm();
  const [draft, setDraft] = useState("");
  const items = state.config[list];

  const add = () => {
    const name = draft.trim();
    if (!name) return;
    addNamedItem(list, name);
    setDraft("");
  };

  const remove = async (id: string, name: string) => {
    const ok = await confirm({
      title: `Delete "${name}"?`,
      message: deleteWarning,
    });
    if (ok) deleteNamedItem(list, id);
  };

  return (
    <section className="panel">
      <header className="panel-head">
        <h2>{title}</h2>
      </header>
      <ul className="component-list">
        {items.map((it) => (
          <li key={it.id} className="component-item named-item">
            <input
              className="cell-input strong component-name"
              value={it.name}
              onChange={(e) => updateNamedItem(list, it.id, { name: e.target.value })}
              aria-label={`${title} name`}
            />
            <button
              className="icon-btn component-del"
              title="Delete"
              onClick={() => remove(it.id, it.name)}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <div className="add-row">
        <input
          className="text-input"
          placeholder={placeholder}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <button className="btn" onClick={add}>
          + Add
        </button>
      </div>
    </section>
  );
}
