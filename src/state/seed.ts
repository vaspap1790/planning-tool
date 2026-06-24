// Initial demo data mirroring the source spreadsheets so the prototype looks familiar.
import type { AppState } from "../types";

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
            { id: "t1", date: "2026-08-27", releaseVersion: "16.5.0", env: "SIT" },
            { id: "t2", date: "2026-08-27", releaseVersion: "16.5.0", env: "UAT" },
          ],
          [MMKC]: [{ id: "t3", date: "2026-08-29", releaseVersion: "18.2.0", env: "UAT" }],
        },
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
          [MAVI]: [{ id: "t4", date: "2026-08-27", releaseVersion: "16.5.0", env: "UAT" }],
          [MMKC]: [{ id: "t5", date: "2026-08-29", releaseVersion: "18.2.0", env: "UAT" }],
        },
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
          [MAVI]: [{ id: "t6", date: "2026-08-27", releaseVersion: "16.5.0", env: "UAT" }],
          [MMKC]: [{ id: "t7", date: "2026-08-29", releaseVersion: "18.2.0", env: "UAT" }],
        },
      },
    ],
    quarters: [
      { id: "q2", quarter: 2, year: 2026, start: "2026-03-03", end: "2026-07-06" },
      { id: "q3", quarter: 3, year: 2026, start: "2026-07-07", end: "2026-10-12" },
    ],
    config: {
      sprintWeeks: 2,
      timelineStart: "current",
    },
  };
}
