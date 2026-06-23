// Initial demo data mirroring the source spreadsheets so the prototype looks familiar.
import type { AppState } from "../types";

export function seed(): AppState {
  const MAPI = "c-mapi";
  const MAVI = "c-mavi";
  const MMKC = "c-mmkc";
  const ONEAPP = "c-oneapp";

  return {
    components: [
      { id: MAPI, name: "MAPI" },
      { id: MAVI, name: "MaVi" },
      { id: MMKC, name: "MMKC" },
      { id: ONEAPP, name: "OneApp" },
    ],
    initiatives: [
      {
        id: "i1",
        name: "Initiative 1",
        link: "",
        estimationSprints: 3,
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
        estimationSprints: 2,
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
        estimationSprints: 3,
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
