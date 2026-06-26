// Shared "+ Add" flow for Board / Sizing / Planning: ask which category the new
// initiative belongs to, create it (with the tab's stage flag), then scroll to it.
import { useApp } from "../../state/store";
import { usePickOne } from "../ui/ConfirmDialog";
import type { InitiativeCategory, InitiativeStages } from "../../types";

const CATEGORY_OPTIONS: { label: string; value: InitiativeCategory }[] = [
  { label: "Business", value: "business" },
  { label: "Engineering", value: "engineering" },
  { label: "Incoming Dependency", value: "incoming" },
  { label: "Outgoing Dependency", value: "outgoing" },
];

/** Smooth-scroll to (and briefly flash) the new initiative's row once it renders. */
function scrollToInitiative(id: string, attempts = 12) {
  const el = document.querySelector<HTMLElement>(`[data-initiative-id="${id}"]`);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("row-flash");
    setTimeout(() => el.classList.remove("row-flash"), 1400);
    return;
  }
  if (attempts > 0) requestAnimationFrame(() => scrollToInitiative(id, attempts - 1));
}

export function useAddInitiative() {
  const { addInitiative } = useApp();
  const pickOne = usePickOne();

  return async function addWithCategory(stageOverride?: Partial<InitiativeStages>) {
    const category = await pickOne<InitiativeCategory>({
      title: "Add initiative",
      message: "Which category should it belong to?",
      options: CATEGORY_OPTIONS,
      confirmLabel: "Add",
    });
    if (!category) return;
    const id = addInitiative(category, stageOverride);
    requestAnimationFrame(() => scrollToInitiative(id));
  };
}
