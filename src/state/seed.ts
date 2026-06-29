// Initial demo data mirroring the source spreadsheets so the prototype looks familiar.
import type { AppState, Initiative, TargetDateEntry } from "../types";

/** Build a target-date entry, defaulting the modal-only fields. */
function td(
  e: Pick<TargetDateEntry, "id" | "date" | "releaseVersion" | "env">
): TargetDateEntry {
  return {
    mergeLink: "",
    handoverNeeded: false,
    handoverTo: [],
    demoScheduled: false,
    demoDate: "",
    approvalsAcquired: false,
    successful: false,
    ...e,
  };
}

/** Stable ids for the default Planning platforms (Web / App / BFF / MAPI). */
export const DEFAULT_PLATFORM_IDS = {
  web: "pf-web",
  app: "pf-app",
  bff: "pf-bff",
  mapi: "pf-mapi",
} as const;

/** Defaults for every field added after the original Initiative shape. */
export function initiativeExtras(): Omit<
  Initiative,
  | "id"
  | "name"
  | "link"
  | "priority"
  | "estimationSprints"
  | "devReadiness"
  | "startDate"
  | "checkedComponents"
  | "targetDates"
> {
  return {
    category: null,
    stages: { sizing: false, planning: false, implementation: true },
    okrIds: [],
    lobIds: [],
    natcoIds: [],
    flowIds: [],
    prdLink: "",
    description: "",
    tShirtSize: "",
    status: "open",
    outgoingDeps: [],
    sizing: {
      scope: 0,
      technicalComplexity: 0,
      dependencies: 0,
      archImpact: 0,
      risk: 0,
      notes: "",
    },
    planningEffort: {},
  };
}

export function seed(): AppState {
  const MAPI = "c-mapi";
  const MAVI = "c-mavi";
  const MMKC = "c-mmkc";
  const ONEAPP = "c-oneapp";

  return {
    components: [
      { id: MAPI, name: "MAPI", releaseCalendarLink: "" },
      {
        id: MAVI,
        name: "MaVi",
        releaseCalendarLink: "https://confluence.example.com/mavi/release-calendar",
      },
      { id: MMKC, name: "MMKC", releaseCalendarLink: "" },
      { id: ONEAPP, name: "OneApp", releaseCalendarLink: "" },
    ],
    initiatives: [
      {
        id: "i1",
        name: "Initiative 1",
        link: "",
        priority: "blocker",
        estimationSprints: 3,
        devReadiness: {
          architecture: { status: "provided", eta: "" },
          analytics: { status: "provided", eta: "" },
          designs: { status: "na", eta: "" },
          dependencies: [],
        },
        startDate: "2026-06-09",
        checkedComponents: { [MAVI]: true, [MMKC]: true },
        targetDates: {
          [MAVI]: [
            td({ id: "t1", date: "2026-08-27", releaseVersion: "16.5.0", env: "SIT" }),
            td({ id: "t2", date: "2026-08-27", releaseVersion: "16.5.0", env: "UAT" }),
          ],
          [MMKC]: [td({ id: "t3", date: "2026-08-29", releaseVersion: "18.2.0", env: "UAT" })],
        },
        ...initiativeExtras(),
      },
      {
        id: "i2",
        name: "Initiative 2",
        link: "",
        priority: "major",
        estimationSprints: 2,
        devReadiness: {
          architecture: { status: "not_provided", eta: "2026-06-26" },
          analytics: { status: "na", eta: "" },
          designs: { status: "provided", eta: "" },
          dependencies: [
            {
              id: "dep1",
              name: "Payments API",
              status: "not_provided",
              eta: "2026-06-20",
            },
          ],
        },
        startDate: "2026-07-07",
        checkedComponents: { [MAVI]: true, [MMKC]: true },
        targetDates: {
          [MAVI]: [td({ id: "t4", date: "2026-08-27", releaseVersion: "16.5.0", env: "UAT" })],
          [MMKC]: [td({ id: "t5", date: "2026-08-29", releaseVersion: "18.2.0", env: "UAT" })],
        },
        ...initiativeExtras(),
      },
      {
        id: "i3",
        name: "Initiative 3",
        link: "",
        priority: "minor",
        estimationSprints: 3,
        devReadiness: {
          architecture: { status: "not_provided", eta: "" },
          analytics: { status: "not_provided", eta: "" },
          designs: { status: "not_provided", eta: "" },
          dependencies: [],
        },
        startDate: "2026-07-07",
        checkedComponents: { [MAVI]: true, [MMKC]: true },
        targetDates: {
          [MAVI]: [td({ id: "t6", date: "2026-08-27", releaseVersion: "16.5.0", env: "UAT" })],
          [MMKC]: [td({ id: "t7", date: "2026-08-29", releaseVersion: "18.2.0", env: "UAT" })],
        },
        ...initiativeExtras(),
      },
    ],
    quarters: [
      { id: "q2", quarter: 2, year: 2026, start: "2026-03-03", end: "2026-07-06" },
      { id: "q3", quarter: 3, year: 2026, start: "2026-07-07", end: "2026-10-12" },
    ],
    config: {
      sprintWeeks: 2,
      timelineStart: "current",
      okrs: [],
      lobs: [],
      natcos: [],
      flows: [],
      platforms: [
        { id: DEFAULT_PLATFORM_IDS.web, name: "Web" },
        { id: DEFAULT_PLATFORM_IDS.app, name: "App" },
        { id: DEFAULT_PLATFORM_IDS.bff, name: "BFF" },
        { id: DEFAULT_PLATFORM_IDS.mapi, name: "MAPI" },
      ],
      planning: {
        qStart: "",
        qEnd: "",
        capacity: {},
      },
    },
  };
}
