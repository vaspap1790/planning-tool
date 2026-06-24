// Dev-readiness helpers: defaults and the at-a-glance outline level for a cell.
import type { DevReadiness, ReadinessItem, ReadinessStatus, WarningLevel } from "../types";
import { diffDays, todayISO } from "./dates";

export type ReadinessOutline = "green" | WarningLevel; // green | yellow | red | none

const NEW_ITEM: ReadinessItem = { status: "not_provided", eta: "" };

/** A fresh dev-readiness record: every input still pending (incomplete, neutral). */
export function defaultDevReadiness(): DevReadiness {
  return {
    architecture: { ...NEW_ITEM },
    analytics: { ...NEW_ITEM },
    designs: { ...NEW_ITEM },
    dependencies: [],
  };
}

/** A "provided" or "N/A" input counts as done; "not_provided" is still pending. */
export function isComplete(status: ReadinessStatus): boolean {
  return status === "provided" || status === "na";
}

/** Warning for a single pending item relative to its ETA. */
function itemWarning(item: ReadinessItem, today: string): WarningLevel {
  if (isComplete(item.status) || !item.eta) return "none";
  const d = diffDays(today, item.eta); // days from today until the ETA
  if (d < 0) return "red"; // past the ETA
  if (d <= 2) return "yellow"; // within two days of the ETA
  return "none";
}

/**
 * Outline for a single readiness input: green when done (Provided / N/A);
 * otherwise red (ETA reached/passed), yellow (within two days), or none.
 */
export function itemOutline(
  item: ReadinessItem,
  today = todayISO()
): ReadinessOutline {
  if (isComplete(item.status)) return "green";
  return itemWarning(item, today);
}

/**
 * Cell outline: green when all three inputs are complete (Dev Ready); otherwise
 * the worst pending warning (red > yellow), or none.
 */
export function readinessOutline(
  dr: DevReadiness,
  today = todayISO()
): ReadinessOutline {
  const items: ReadinessItem[] = [
    dr.architecture,
    dr.analytics,
    dr.designs,
    ...dr.dependencies,
  ];
  if (items.every((it) => isComplete(it.status))) return "green";
  let worst: WarningLevel = "none";
  for (const it of items) {
    const w = itemWarning(it, today);
    if (w === "red") return "red";
    if (w === "yellow") worst = "yellow";
  }
  return worst;
}
