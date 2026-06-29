// Pure date helpers. No framework dependencies so they are trivially unit-testable.
import type { Quarter, TargetDateEntry, WarningLevel } from "../types";

export const DEFAULT_SPRINT_WEEKS = 2;

/** Today as ISO yyyy-mm-dd. Centralised so it can be overridden in tests. */
export function todayISO(): string {
  return toISO(new Date());
}

export function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseISO(iso: string): Date {
  // Parse as local date (avoid TZ shifting that `new Date('yyyy-mm-dd')` causes).
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Display format dd.mm.yyyy to match the source spreadsheets. */
export function formatDisplay(iso: string | undefined): string {
  if (!iso) return "";
  const d = parseISO(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}.${m}.${d.getFullYear()}`;
}

export function addDays(iso: string, days: number): string {
  const d = parseISO(iso);
  d.setDate(d.getDate() + days);
  return toISO(d);
}

/** Whole days from `a` to `b` (b - a). */
export function diffDays(aISO: string, bISO: string): number {
  const a = parseISO(aISO).getTime();
  const b = parseISO(bISO).getTime();
  return Math.round((b - a) / 86_400_000);
}

/**
 * Inclusive last day an initiative occupies: start + estimation×sprint weeks − 1 day.
 * (estimation × sprintWeeks calendar weeks total, no extra week.)
 */
export function initiativeLastDay(
  startISO: string,
  estimationSprints: number,
  sprintWeeks = DEFAULT_SPRINT_WEEKS
): string {
  return addDays(startISO, estimationSprints * sprintWeeks * 7 - 1);
}

/**
 * Sprints left = estimation minus sprints already elapsed since start, rounded to
 * the nearest half sprint. Not-yet-started initiatives return the full estimation;
 * clamped to [0, estimation].
 */
export function timeLeftSprints(
  startISO: string,
  estimationSprints: number,
  sprintWeeks = DEFAULT_SPRINT_WEEKS,
  today = todayISO()
): number {
  const sprintDays = sprintWeeks * 7;
  const elapsedDays = diffDays(startISO, today);
  const elapsedSprints = elapsedDays <= 0 ? 0 : elapsedDays / sprintDays;
  const left = Math.round((estimationSprints - elapsedSprints) * 2) / 2; // nearest 0.5
  return Math.max(0, Math.min(estimationSprints, left));
}

/**
 * Whole sprints in the inclusive date range [startISO, endISO], given sprint
 * length in weeks. Returns 0 when the range or inputs are invalid.
 */
export function sprintsBetween(
  startISO: string,
  endISO: string,
  sprintWeeks = DEFAULT_SPRINT_WEEKS
): number {
  if (!startISO || !endISO || sprintWeeks <= 0) return 0;
  const days = diffDays(startISO, endISO) + 1; // inclusive
  if (days <= 0) return 0;
  return Math.round(days / (sprintWeeks * 7));
}

/** Red within one week of (or past) the target, yellow within two weeks. */
export function warningLevel(targetISO: string, today = todayISO()): WarningLevel {
  const days = diffDays(today, targetISO);
  if (days <= 7) return "red";
  if (days <= 14) return "yellow";
  return "none";
}

/** True once the target date has arrived (today is on or after it). */
export function targetReached(targetISO: string, today = todayISO()): boolean {
  return diffDays(today, targetISO) <= 0;
}

/**
 * Colour band for a target-date entry: green once resolved (`successful`),
 * otherwise the proximity warning level (red/yellow/none).
 */
export function targetEntryLevel(
  entry: Pick<TargetDateEntry, "date" | "successful">,
  today = todayISO()
): "green" | WarningLevel {
  if (entry.successful) return "green";
  return warningLevel(entry.date, today);
}

/** Number of required handovers still not marked done (0 when none pending). */
export function pendingHandoverCount(
  entry: Pick<TargetDateEntry, "handoverNeeded" | "handoverTo">
): number {
  if (!entry.handoverNeeded) return 0;
  return entry.handoverTo.filter((h) => !h.done).length;
}

/** True when a demo is required but has not yet been scheduled (no date set). */
export function demoPending(
  entry: Pick<TargetDateEntry, "demoRequired" | "demoDate">
): boolean {
  return entry.demoRequired && entry.demoDate.trim().length === 0;
}

/**
 * Total pending-action count shown on a target-date badge: pending handovers
 * plus one when a required demo has not been scheduled.
 */
export function pendingBadgeCount(
  entry: Pick<
    TargetDateEntry,
    "handoverNeeded" | "handoverTo" | "demoRequired" | "demoDate"
  >
): number {
  return pendingHandoverCount(entry) + (demoPending(entry) ? 1 : 0);
}

// ---- Tab 2 timeline generation ---------------------------------------------

export interface TimelineWeek {
  index: number; // global column index, 0-based
  start: string;
  end: string;
  weekInSprint: number; // 1-based position within its sprint
}

export interface TimelineSpan {
  label: string;
  weeks: number; // number of week-columns this span covers
}

export interface Timeline {
  weeks: TimelineWeek[];
  quarters: TimelineSpan[];
  sprints: TimelineSpan[];
}

export interface TimelineOptions {
  sprintWeeks?: number;
  /** Drop weeks ending before this date (used for the "current date" start mode). */
  startBound?: string;
}

/**
 * Build a continuous week grid across all quarters (sorted by start).
 * Week boundaries stay aligned to each quarter's start so sprint cadence is stable;
 * when `startBound` is set, earlier weeks are simply omitted (numbering preserved).
 * Sprint numbering restarts at 1 within each quarter.
 */
export function buildTimeline(
  quarters: Quarter[],
  { sprintWeeks = DEFAULT_SPRINT_WEEKS, startBound }: TimelineOptions = {}
): Timeline {
  const sorted = [...quarters].sort((a, b) => a.start.localeCompare(b.start));
  const weeks: TimelineWeek[] = [];
  const quarterSpans: TimelineSpan[] = [];
  const sprintSpans: TimelineSpan[] = [];
  let index = 0;

  for (const q of sorted) {
    let qWeeks = 0;
    let cursor = q.start;
    let sprintNo = 0;
    let posInSprint = 0; // 0-based week position within the current sprint
    let emittedInSprint = 0;

    const flushSprint = () => {
      if (emittedInSprint > 0) {
        sprintSpans.push({ label: `Sprint ${sprintNo}`, weeks: emittedInSprint });
      }
      emittedInSprint = 0;
    };

    while (diffDays(cursor, q.end) >= 0) {
      if (posInSprint === 0) {
        flushSprint();
        sprintNo += 1;
      }
      const weekEnd = addDays(cursor, 6);
      // Include the week unless it ends before the start bound.
      if (!startBound || diffDays(weekEnd, startBound) <= 0) {
        weeks.push({ index, start: cursor, end: weekEnd, weekInSprint: posInSprint + 1 });
        index += 1;
        qWeeks += 1;
        emittedInSprint += 1;
      }
      posInSprint = (posInSprint + 1) % sprintWeeks;
      cursor = addDays(cursor, 7);
    }
    flushSprint();
    if (qWeeks > 0) quarterSpans.push({ label: `Q${q.quarter}`, weeks: qWeeks });
  }

  return { weeks, quarters: quarterSpans, sprints: sprintSpans };
}

/** Column index of the week containing `iso`, clamped to the grid edges. */
export function weekIndexForDate(weeks: TimelineWeek[], iso: string): number {
  if (weeks.length === 0) return 0;
  if (diffDays(iso, weeks[0].start) > 0) return 0;
  const last = weeks[weeks.length - 1];
  if (diffDays(last.end, iso) > 0) return last.index;
  for (const w of weeks) {
    if (diffDays(iso, w.start) <= 0 && diffDays(w.end, iso) <= 0) return w.index;
  }
  return weeks.length - 1;
}
