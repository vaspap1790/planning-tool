// Priority metadata: ordering (for sorting) and presentation (label, color).
import type { Priority } from "../types";

export interface PriorityMeta {
  label: string;
  rank: number; // 0 = highest priority; used for sorting
  color: string;
}

/** Highest → lowest. Drives the priority dropdown order and sort ranking. */
export const PRIORITY_ORDER: Priority[] = [
  "blocker",
  "critical",
  "major",
  "minor",
  "trivial",
];

export const PRIORITY_META: Record<Priority, PriorityMeta> = {
  blocker: { label: "Blocker", rank: 0, color: "#d7373f" },
  critical: { label: "Critical (High)", rank: 1, color: "#f06400" },
  major: { label: "Major (Medium)", rank: 2, color: "#e8a200" },
  minor: { label: "Minor (Low)", rank: 3, color: "#2563eb" },
  trivial: { label: "Trivial", rank: 4, color: "#8a8290" },
};

export const DEFAULT_PRIORITY: Priority = "major";
