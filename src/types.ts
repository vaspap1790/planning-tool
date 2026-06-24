// Domain model for the planning tool.
// Kept framework-agnostic so it can back either local storage or a remote (Supabase) store.

export type ID = string;

/** A reusable component (Initiatives "Components" list). */
export interface Component {
  id: ID;
  name: string;
  /** Optional link to this component's release calendar (shown in the timeline modal). */
  releaseCalendarLink: string;
}

/** JIRA-style initiative priority, highest → lowest. */
export type Priority = "blocker" | "critical" | "major" | "minor" | "trivial";

/** Whether a readiness input has been provided by the owning team. */
export type ReadinessStatus = "provided" | "not_provided" | "na";

/** One Dev-Readiness input (Architecture / Analytics / Designs). */
export interface ReadinessItem {
  status: ReadinessStatus;
  eta: string; // ISO yyyy-mm-dd; "" when none / N/A
}

/** Dev-readiness signals an initiative needs before development can proceed. */
export interface DevReadiness {
  architecture: ReadinessItem;
  analytics: ReadinessItem;
  designs: ReadinessItem;
}

/** One target-date entry for a given component within an initiative. */
export interface TargetDateEntry {
  id: ID;
  date: string; // ISO yyyy-mm-dd
  releaseVersion: string;
  env: string;
}

/** A row in the Tab 1 initiatives table. */
export interface Initiative {
  id: ID;
  name: string;
  link: string; // optional clickable link for the initiative name
  priority: Priority;
  estimationSprints: number; // integer, sprints
  devReadiness: DevReadiness;
  startDate: string; // ISO yyyy-mm-dd
  /** componentId -> checked */
  checkedComponents: Record<ID, boolean>;
  /** componentId -> its target-date entries */
  targetDates: Record<ID, TargetDateEntry[]>;
}

/** A row in the Tab 2 "Quarter" table. */
export interface Quarter {
  id: ID;
  quarter: number; // 1..4
  year: number;
  start: string; // ISO yyyy-mm-dd
  end: string; // ISO yyyy-mm-dd
}

/** Where the Tab 2 timeline grid begins. */
export type TimelineStart = "quarter" | "current";

export interface Config {
  /** Weeks per sprint. Drives time-left, bar length and the timeline grid. */
  sprintWeeks: number;
  /** Start the timeline at each quarter's start, or clip to the current date. */
  timelineStart: TimelineStart;
}

export interface AppState {
  components: Component[];
  initiatives: Initiative[];
  quarters: Quarter[];
  config: Config;
}

export type WarningLevel = "none" | "yellow" | "red";
