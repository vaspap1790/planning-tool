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

/** A user-named dependency with the same status/ETA rules as a readiness input. */
export interface Dependency extends ReadinessItem {
  id: ID;
  name: string;
}

/** Dev-readiness signals an initiative needs before development can proceed. */
export interface DevReadiness {
  architecture: ReadinessItem;
  analytics: ReadinessItem;
  designs: ReadinessItem;
  /** Free-form, user-added dependencies (0..n). */
  dependencies: Dependency[];
}

/** A team a target date must be handed over to, and whether that has happened. */
export interface HandoverItem {
  name: string;
  done: boolean;
}

/** One target-date entry for a given component within an initiative. */
export interface TargetDateEntry {
  id: ID;
  date: string; // ISO yyyy-mm-dd
  releaseVersion: string;
  env: string;
  /** Link to the merge / pull request (edited in the modal). */
  mergeLink: string;
  /** Whether a handover is required for this target date. */
  handoverNeeded: boolean;
  /** Teams to hand over to, each tracking whether the handover happened. */
  handoverTo: HandoverItem[];
  /** Whether a demo is required for this target date. */
  demoRequired: boolean;
  /** ISO yyyy-mm-dd date of the scheduled demo (empty when not yet scheduled). */
  demoDate: string;
  /** Whether the required approvals have been acquired (gates Resolve). */
  approvalsAcquired: boolean;
  /** Marked done via the modal's Resolve action → renders green. */
  successful: boolean;
}

/**
 * An initiative's "home" tab in the Estimation phase. `null` when it was added
 * directly to a later phase (Planning / Implementation) and never categorised.
 */
export type InitiativeCategory = "business" | "engineering" | "incoming" | "outgoing";

/** T-shirt size, kept in sync across every tab. "" = unset. */
export type TShirtSize = "" | "XS" | "S" | "M" | "L" | "XL" | "XXL";

/** Status of an Incoming Dependency. */
export type DependencyStatus = "open" | "accepted" | "rejected" | "cancelled";

/** Sizing dimension score (1..5); 0 means unset. */
export type SizingScore = 0 | 1 | 2 | 3 | 4 | 5;

/** A simple named, text-only config entry (OKRs, LOBs, NatCos, Platforms). */
export interface NamedItem {
  id: ID;
  name: string;
}

/** One outgoing dependency the team raises on another team. */
export interface OutgoingDep {
  id: ID;
  raised: string; // label of the raised item
  raisedLink: string; // optional url (renders ↗)
  team: string;
  handover: boolean;
  committed: boolean; // yes / no
  eta: string; // ISO yyyy-mm-dd
  note: string; // free text (e.g. the spreadsheet's commit notes)
}

/** Sizing dimensions feeding the suggested T-shirt size. */
export interface Sizing {
  scope: SizingScore;
  technicalComplexity: SizingScore;
  dependencies: SizingScore;
  archImpact: SizingScore;
  risk: SizingScore;
  notes: string;
}

/**
 * Which later phases an initiative additionally belongs to. Estimation membership
 * is implied by `category != null`; these flags are flipped by the promotion
 * actions (Estimate Size → sizing, Add to Planning → planning, Add to
 * Implementation → implementation) and stay set (additive, not a move).
 */
export interface InitiativeStages {
  sizing: boolean;
  planning: boolean;
  implementation: boolean;
}

/** A row in the initiatives table — the single model shared by every tab. */
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

  // --- lifecycle ---
  category: InitiativeCategory | null;
  stages: InitiativeStages;

  // --- Business / Engineering / Dependency fields ---
  okrIds: ID[];
  lobIds: ID[];
  natcoIds: ID[];
  flowIds: ID[];
  prdLink: string;
  description: string;
  tShirtSize: TShirtSize; // synced across all tabs
  status: DependencyStatus; // used by Incoming Dependencies
  outgoingDeps: OutgoingDep[]; // used by Outgoing Dependencies

  // --- Sizing ---
  sizing: Sizing;

  // --- Planning ---
  /** platformId -> sprints of effort */
  planningEffort: Record<ID, number>;
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

/** Per-platform capacity inputs for the Planning board. */
export interface PlatformCapacity {
  engineers: number;
  unavailable: number; // sprints
}

/** The single global Planning board setup. */
export interface PlanningConfig {
  qStart: string; // ISO yyyy-mm-dd
  qEnd: string; // ISO yyyy-mm-dd
  /** platformId -> capacity inputs */
  capacity: Record<ID, PlatformCapacity>;
}

export interface Config {
  /** Weeks per sprint. Drives time-left, bar length and the timeline grid. */
  sprintWeeks: number;
  /** Start the timeline at each quarter's start, or clip to the current date. */
  timelineStart: TimelineStart;
  /** Text-only managed lists used by the Estimation/Planning tabs. */
  okrs: NamedItem[];
  lobs: NamedItem[];
  natcos: NamedItem[];
  flows: NamedItem[];
  platforms: NamedItem[];
  /** Single global Planning board setup. */
  planning: PlanningConfig;
}

export interface AppState {
  components: Component[];
  initiatives: Initiative[];
  quarters: Quarter[];
  config: Config;
}

export type WarningLevel = "none" | "yellow" | "red";
