import { useState } from "react";
import { useApp } from "../../state/store";
import { useConfirm } from "../ui/ConfirmDialog";

export function ComponentsList() {
  const { state, addComponent, updateComponent, deleteComponent } = useApp();
  const confirm = useConfirm();
  const [draft, setDraft] = useState("");

  const add = () => {
    const name = draft.trim();
    if (!name) return;
    addComponent(name);
    setDraft("");
  };

  const remove = async (id: string, name: string) => {
    const ok = await confirm({
      title: `Delete component "${name}"?`,
      message: "It will also be unchecked from every initiative.",
    });
    if (ok) deleteComponent(id);
  };

  return (
    <section className="panel components-panel">
      <header className="panel-head">
        <h2>Components</h2>
      </header>
      <ul className="chip-list">
        {state.components.map((c) => (
          <li key={c.id} className="chip">
            <input
              className="chip-input"
              value={c.name}
              onChange={(e) => updateComponent(c.id, e.target.value)}
              aria-label="Component name"
            />
            <button
              className="icon-btn"
              title="Delete component"
              onClick={() => remove(c.id, c.name)}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <div className="add-row">
        <input
          className="text-input"
          placeholder="Add a component…"
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
