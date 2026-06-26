// Shared delete flow used by every tab: first ask whether to remove the
// initiative from just this tab or from everywhere, then confirm.
import { useApp } from "../../state/store";
import { useChoose, useConfirm } from "../ui/ConfirmDialog";
import type { Initiative } from "../../types";

export function useInitiativeDelete() {
  const { deleteInitiative } = useApp();
  const choose = useChoose();
  const confirm = useConfirm();

  /**
   * @param i           the initiative being removed
   * @param tabLabel    human label for the current tab (e.g. "Planning")
   * @param removeFromTab  removes the initiative from just this tab (e.g. flips a stage)
   */
  return async function requestDelete(
    i: Initiative,
    tabLabel: string,
    removeFromTab: () => void
  ) {
    const name = i.name || "this initiative";
    const scope = await choose<"tab" | "all">({
      title: `Remove "${name}"?`,
      message: `Remove it from ${tabLabel} only, or delete it from every tab?`,
      choices: [
        { label: `${tabLabel} only`, value: "tab" },
        { label: "Every tab", value: "all", danger: true },
      ],
    });
    if (!scope) return;

    if (scope === "tab") {
      const ok = await confirm({
        title: `Remove from ${tabLabel}?`,
        message: `"${name}" will stay available in the other tabs.`,
        confirmLabel: "Remove",
        danger: false,
      });
      if (ok) removeFromTab();
    } else {
      const ok = await confirm({
        title: `Delete "${name}"?`,
        message: "This will permanently remove the initiative from every tab.",
        confirmLabel: "Delete everywhere",
      });
      if (ok) deleteInitiative(i.id);
    }
  };
}
