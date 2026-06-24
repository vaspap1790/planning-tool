// Shared definition of the timeline-start choices, used by both the Config tab
// and the inline control in the Timeline header.
import type { TimelineStart } from "../types";

export interface TimelineStartOption {
  value: TimelineStart;
  label: string; // full label (Config tab)
  shortLabel: string; // compact label (Timeline header)
  hint: string;
}

export const TIMELINE_START_OPTIONS: TimelineStartOption[] = [
  {
    value: "quarter",
    label: "Start of quarter",
    shortLabel: "Quarter start",
    hint: "Timeline shows every week from each quarter's start date.",
  },
  {
    value: "current",
    label: "Current date",
    shortLabel: "Current date",
    hint: "Timeline clips past weeks and begins at today.",
  },
];
