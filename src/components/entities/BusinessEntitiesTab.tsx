// Business Entities — the reusable building blocks referenced across the
// Estimation/Planning/Board tabs (not really "configuration", so kept apart).
import { ComponentsList } from "../initiatives/ComponentsList";
import { NamedListEditor } from "../config/NamedListEditor";

export function BusinessEntitiesTab() {
  return (
    <div className="entities-tab">
      <ComponentsList />
      <NamedListEditor
        list="lobs"
        title="LOBs"
        placeholder="Add a LOB…"
        deleteWarning="It will be removed from every initiative."
      />
      <NamedListEditor
        list="okrs"
        title="OKRs"
        placeholder="Add an OKR…"
        deleteWarning="It will be removed from every initiative."
      />
      <NamedListEditor
        list="natcos"
        title="NatCos"
        placeholder="Add a NatCo…"
        deleteWarning="It will be removed from every initiative."
      />
      <NamedListEditor
        list="flows"
        title="Flows"
        placeholder="Add a Flow…"
        deleteWarning="It will be removed from every initiative."
      />
      <NamedListEditor
        list="platforms"
        title="Platforms"
        placeholder="Add a platform…"
        deleteWarning="It will be removed from the Planning board and every initiative's effort."
      />
    </div>
  );
}
