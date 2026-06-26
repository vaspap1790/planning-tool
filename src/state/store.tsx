// Central app state. Exposes immutable-update action helpers and persists on change.
// Persistence is injected via the Store interface, so a Supabase-backed store can
// replace localStore without touching components.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  AppState,
  Component,
  Config,
  Dependency,
  ID,
  Initiative,
  InitiativeCategory,
  InitiativeStages,
  NamedItem,
  OutgoingDep,
  PlatformCapacity,
  PlanningConfig,
  Quarter,
  ReadinessItem,
  Sizing,
  TargetDateEntry,
} from "../types";
import { localStore, newId, normalizeState, type Store } from "../lib/storage";
import { initiativeExtras } from "./seed";
import { DEFAULT_PRIORITY } from "../lib/priority";
import { defaultDevReadiness } from "../lib/readiness";
import { SUPABASE_ENABLED } from "../lib/supabase";
import {
  fetchRemoteState,
  saveRemoteState,
  subscribeRemoteState,
} from "../lib/remoteStore";

interface Actions {
  // Components list
  addComponent(name: string): void;
  updateComponent(id: ID, patch: Partial<Component>): void;
  deleteComponent(id: ID): void;
  // Initiatives
  addInitiative(
    category?: InitiativeCategory | null,
    stageOverride?: Partial<InitiativeStages>
  ): void;
  updateInitiative(id: ID, patch: Partial<Initiative>): void;
  deleteInitiative(id: ID): void;
  toggleComponent(initiativeId: ID, componentId: ID): void;
  // Lifecycle promotion (additive — flips a stage flag)
  estimateSize(id: ID): void;
  addToPlanning(id: ID): void;
  addToImplementation(id: ID): void;
  /** Set a single stage flag (e.g. remove an initiative from one tab). */
  setStage(id: ID, stage: keyof InitiativeStages, value: boolean): void;
  // Sizing
  updateSizing(id: ID, patch: Partial<Sizing>): void;
  // Outgoing dependencies
  addOutgoingDep(initiativeId: ID): void;
  updateOutgoingDep(initiativeId: ID, depId: ID, patch: Partial<OutgoingDep>): void;
  deleteOutgoingDep(initiativeId: ID, depId: ID): void;
  // Planning effort (per platform)
  setPlanningEffort(initiativeId: ID, platformId: ID, sprints: number): void;
  updateReadiness(
    initiativeId: ID,
    key: "architecture" | "analytics" | "designs",
    patch: Partial<ReadinessItem>
  ): void;
  // Dev-readiness dependencies (user-added)
  addDependency(initiativeId: ID): void;
  updateDependency(initiativeId: ID, depId: ID, patch: Partial<Dependency>): void;
  deleteDependency(initiativeId: ID, depId: ID): void;
  // Target dates
  addTargetDate(initiativeId: ID, componentId: ID): void;
  updateTargetDate(
    initiativeId: ID,
    componentId: ID,
    entryId: ID,
    patch: Partial<TargetDateEntry>
  ): void;
  deleteTargetDate(initiativeId: ID, componentId: ID, entryId: ID): void;
  // Quarters
  addQuarter(): void;
  updateQuarter(id: ID, patch: Partial<Quarter>): void;
  deleteQuarter(id: ID): void;
  // Config: simple named lists (OKRs / LOBs / NatCos / Platforms)
  addNamedItem(list: NamedList, name: string): void;
  updateNamedItem(list: NamedList, id: ID, patch: Partial<NamedItem>): void;
  deleteNamedItem(list: NamedList, id: ID): void;
  // Config: Planning board setup
  updatePlanningConfig(patch: Partial<PlanningConfig>): void;
  updatePlanningCapacity(platformId: ID, patch: Partial<PlatformCapacity>): void;
  // Config
  updateConfig(patch: Partial<Config>): void;
}

/** The config keys holding a `NamedItem[]`. */
export type NamedList = "okrs" | "lobs" | "natcos" | "flows" | "platforms";

interface Ctx extends Actions {
  state: AppState;
}

const AppContext = createContext<Ctx | null>(null);

export function AppProvider({
  children,
  store = localStore,
}: {
  children: ReactNode;
  store?: Store;
}) {
  const [state, setState] = useState<AppState>(() => store.load());

  // --- Supabase sync -------------------------------------------------------
  // `localStore` is an instant cache; Supabase is the shared source of truth.
  const remoteReady = useRef(false); // don't push to remote before first load
  const fromRemote = useRef(false); // suppress re-saving state we just received
  const lastSyncedJSON = useRef<string>(""); // ignore our own realtime echoes

  useEffect(() => {
    if (!SUPABASE_ENABLED) return;
    let active = true;

    (async () => {
      const remote = await fetchRemoteState();
      if (!active) return;
      if (remote) {
        const normalized = normalizeState(remote);
        lastSyncedJSON.current = JSON.stringify(normalized);
        fromRemote.current = true;
        setState(normalized);
      } else {
        // First ever run: seed the shared row from current (local) state.
        await saveRemoteState(state);
        lastSyncedJSON.current = JSON.stringify(state);
      }
      remoteReady.current = true;
    })();

    const unsubscribe = subscribeRemoteState((next) => {
      const normalized = normalizeState(next);
      const json = JSON.stringify(normalized);
      if (json === lastSyncedJSON.current) return; // echo of our own write
      lastSyncedJSON.current = json;
      fromRemote.current = true;
      setState(normalized);
    });

    return () => {
      active = false;
      unsubscribe();
    };
    // Runs once on mount; intentionally not re-run on `state` changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist on every change: localStorage immediately, Supabase debounced.
  useEffect(() => {
    store.save(state);

    if (fromRemote.current) {
      fromRemote.current = false; // this change came from remote — don't echo it back
      return;
    }
    if (!SUPABASE_ENABLED || !remoteReady.current) return;

    const json = JSON.stringify(state);
    if (json === lastSyncedJSON.current) return;
    const timer = setTimeout(() => {
      lastSyncedJSON.current = json;
      saveRemoteState(state);
    }, 400);
    return () => clearTimeout(timer);
  }, [state, store]);

  const mapInitiative = useCallback(
    (id: ID, fn: (i: Initiative) => Initiative) =>
      setState((s) => ({
        ...s,
        initiatives: s.initiatives.map((i) => (i.id === id ? fn(i) : i)),
      })),
    []
  );

  const actions: Actions = useMemo(
    () => ({
      addComponent: (name) =>
        setState((s) => ({
          ...s,
          components: [...s.components, { id: newId(), name, releaseCalendarLink: "" }],
        })),
      updateComponent: (id, patch) =>
        setState((s) => ({
          ...s,
          components: s.components.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),
      deleteComponent: (id) =>
        setState((s) => ({
          ...s,
          components: s.components.filter((c) => c.id !== id),
          initiatives: s.initiatives.map((i) => {
            const { [id]: _c, ...checked } = i.checkedComponents;
            const { [id]: _t, ...targets } = i.targetDates;
            return { ...i, checkedComponents: checked, targetDates: targets };
          }),
        })),

      addInitiative: (category = null, stageOverride) =>
        setState((s) => {
          const extras = initiativeExtras();
          // Explicit override (Sizing/Planning direct-add) wins; otherwise an
          // Estimation-born initiative lives only in its category, and a plain
          // direct add lands on the Board (extras' implementation: true).
          const stages = stageOverride
            ? { sizing: false, planning: false, implementation: false, ...stageOverride }
            : category
            ? { sizing: false, planning: false, implementation: false }
            : extras.stages;
          return {
            ...s,
            initiatives: [
              ...s.initiatives,
              {
                ...extras,
                id: newId(),
                name: "New initiative",
                link: "",
                priority: DEFAULT_PRIORITY,
                estimationSprints: 1,
                devReadiness: defaultDevReadiness(),
                startDate: new Date().toISOString().slice(0, 10),
                checkedComponents: {},
                targetDates: {},
                category,
                stages,
              },
            ],
          };
        }),
      updateInitiative: (id, patch) => mapInitiative(id, (i) => ({ ...i, ...patch })),
      estimateSize: (id) =>
        mapInitiative(id, (i) => ({ ...i, stages: { ...i.stages, sizing: true } })),
      addToPlanning: (id) =>
        mapInitiative(id, (i) => ({ ...i, stages: { ...i.stages, planning: true } })),
      setStage: (id, stage, value) =>
        mapInitiative(id, (i) => ({ ...i, stages: { ...i.stages, [stage]: value } })),
      addToImplementation: (id) =>
        mapInitiative(id, (i) => ({
          ...i,
          stages: { ...i.stages, implementation: true },
        })),
      updateSizing: (id, patch) =>
        mapInitiative(id, (i) => ({ ...i, sizing: { ...i.sizing, ...patch } })),
      addOutgoingDep: (initiativeId) =>
        mapInitiative(initiativeId, (i) => ({
          ...i,
          outgoingDeps: [
            ...i.outgoingDeps,
            {
              id: newId(),
              raised: "",
              raisedLink: "",
              team: "",
              handover: false,
              committed: false,
              eta: "",
              note: "",
            },
          ],
        })),
      updateOutgoingDep: (initiativeId, depId, patch) =>
        mapInitiative(initiativeId, (i) => ({
          ...i,
          outgoingDeps: i.outgoingDeps.map((d) =>
            d.id === depId ? { ...d, ...patch } : d
          ),
        })),
      deleteOutgoingDep: (initiativeId, depId) =>
        mapInitiative(initiativeId, (i) => ({
          ...i,
          outgoingDeps: i.outgoingDeps.filter((d) => d.id !== depId),
        })),
      setPlanningEffort: (initiativeId, platformId, sprints) =>
        mapInitiative(initiativeId, (i) => ({
          ...i,
          planningEffort: { ...i.planningEffort, [platformId]: sprints },
        })),
      deleteInitiative: (id) =>
        setState((s) => ({
          ...s,
          initiatives: s.initiatives.filter((i) => i.id !== id),
        })),
      toggleComponent: (initiativeId, componentId) =>
        mapInitiative(initiativeId, (i) => {
          const checked = !i.checkedComponents[componentId];
          const next: Initiative = {
            ...i,
            checkedComponents: { ...i.checkedComponents, [componentId]: checked },
          };
          if (checked && !next.targetDates[componentId]) {
            next.targetDates = { ...next.targetDates, [componentId]: [] };
          }
          return next;
        }),
      updateReadiness: (initiativeId, key, patch) =>
        mapInitiative(initiativeId, (i) => ({
          ...i,
          devReadiness: {
            ...i.devReadiness,
            [key]: { ...i.devReadiness[key], ...patch },
          },
        })),
      addDependency: (initiativeId) =>
        mapInitiative(initiativeId, (i) => ({
          ...i,
          devReadiness: {
            ...i.devReadiness,
            dependencies: [
              ...i.devReadiness.dependencies,
              { id: newId(), name: "", status: "not_provided", eta: "" },
            ],
          },
        })),
      updateDependency: (initiativeId, depId, patch) =>
        mapInitiative(initiativeId, (i) => ({
          ...i,
          devReadiness: {
            ...i.devReadiness,
            dependencies: i.devReadiness.dependencies.map((d) =>
              d.id === depId ? { ...d, ...patch } : d
            ),
          },
        })),
      deleteDependency: (initiativeId, depId) =>
        mapInitiative(initiativeId, (i) => ({
          ...i,
          devReadiness: {
            ...i.devReadiness,
            dependencies: i.devReadiness.dependencies.filter((d) => d.id !== depId),
          },
        })),

      addTargetDate: (initiativeId, componentId) =>
        mapInitiative(initiativeId, (i) => ({
          ...i,
          targetDates: {
            ...i.targetDates,
            [componentId]: [
              ...(i.targetDates[componentId] ?? []),
              {
                id: newId(),
                date: new Date().toISOString().slice(0, 10),
                releaseVersion: "",
                env: "",
              },
            ],
          },
        })),
      updateTargetDate: (initiativeId, componentId, entryId, patch) =>
        mapInitiative(initiativeId, (i) => ({
          ...i,
          targetDates: {
            ...i.targetDates,
            [componentId]: (i.targetDates[componentId] ?? []).map((e) =>
              e.id === entryId ? { ...e, ...patch } : e
            ),
          },
        })),
      deleteTargetDate: (initiativeId, componentId, entryId) =>
        mapInitiative(initiativeId, (i) => ({
          ...i,
          targetDates: {
            ...i.targetDates,
            [componentId]: (i.targetDates[componentId] ?? []).filter(
              (e) => e.id !== entryId
            ),
          },
        })),

      addQuarter: () =>
        setState((s) => ({
          ...s,
          quarters: [
            ...s.quarters,
            {
              id: newId(),
              quarter: 1,
              year: new Date().getFullYear(),
              start: new Date().toISOString().slice(0, 10),
              end: new Date().toISOString().slice(0, 10),
            },
          ],
        })),
      updateQuarter: (id, patch) =>
        setState((s) => ({
          ...s,
          quarters: s.quarters.map((q) => (q.id === id ? { ...q, ...patch } : q)),
        })),
      deleteQuarter: (id) =>
        setState((s) => ({ ...s, quarters: s.quarters.filter((q) => q.id !== id) })),

      addNamedItem: (list, name) =>
        setState((s) => ({
          ...s,
          config: { ...s.config, [list]: [...s.config[list], { id: newId(), name }] },
        })),
      updateNamedItem: (list, id, patch) =>
        setState((s) => ({
          ...s,
          config: {
            ...s.config,
            [list]: s.config[list].map((it) => (it.id === id ? { ...it, ...patch } : it)),
          },
        })),
      deleteNamedItem: (list, id) =>
        setState((s) => {
          const config: Config = {
            ...s.config,
            [list]: s.config[list].filter((it) => it.id !== id),
          };
          // Also drop the deleted item from the Planning capacity map.
          if (list === "platforms") {
            const { [id]: _drop, ...capacity } = s.config.planning.capacity;
            config.planning = { ...s.config.planning, capacity };
          }
          // Strip references off every initiative.
          const initiatives = s.initiatives.map((i) => {
            if (list === "okrs") return { ...i, okrIds: i.okrIds.filter((x) => x !== id) };
            if (list === "lobs") return { ...i, lobIds: i.lobIds.filter((x) => x !== id) };
            if (list === "natcos")
              return { ...i, natcoIds: i.natcoIds.filter((x) => x !== id) };
            if (list === "flows")
              return { ...i, flowIds: i.flowIds.filter((x) => x !== id) };
            // platforms
            const { [id]: _e, ...planningEffort } = i.planningEffort;
            return { ...i, planningEffort };
          });
          return { ...s, config, initiatives };
        }),
      updatePlanningConfig: (patch) =>
        setState((s) => ({
          ...s,
          config: { ...s.config, planning: { ...s.config.planning, ...patch } },
        })),
      updatePlanningCapacity: (platformId, patch) =>
        setState((s) => {
          const current = s.config.planning.capacity[platformId] ?? {
            engineers: 0,
            unavailable: 0,
          };
          return {
            ...s,
            config: {
              ...s.config,
              planning: {
                ...s.config.planning,
                capacity: {
                  ...s.config.planning.capacity,
                  [platformId]: { ...current, ...patch },
                },
              },
            },
          };
        }),
      updateConfig: (patch) =>
        setState((s) => ({ ...s, config: { ...s.config, ...patch } })),
    }),
    [mapInitiative]
  );

  const value = useMemo<Ctx>(() => ({ state, ...actions }), [state, actions]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): Ctx {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

/** Components checked by at least one initiative — drives Tab 1 dynamic columns. */
export function useActiveComponents(): Component[] {
  const { state } = useApp();
  return useMemo(
    () =>
      state.components.filter((c) =>
        state.initiatives.some((i) => i.checkedComponents[c.id])
      ),
    [state.components, state.initiatives]
  );
}

/** Initiatives whose Estimation home is `category` (Business / Engineering / …). */
export function useInitiativesByCategory(
  category: InitiativeCategory
): Initiative[] {
  const { state } = useApp();
  return useMemo(
    () => state.initiatives.filter((i) => i.category === category),
    [state.initiatives, category]
  );
}

/** Initiatives that have been promoted into the Sizing tab. */
export function useSizingInitiatives(): Initiative[] {
  const { state } = useApp();
  return useMemo(
    () => state.initiatives.filter((i) => i.stages.sizing),
    [state.initiatives]
  );
}

/** Initiatives that have been promoted into the Planning tab. */
export function usePlanningInitiatives(): Initiative[] {
  const { state } = useApp();
  return useMemo(
    () => state.initiatives.filter((i) => i.stages.planning),
    [state.initiatives]
  );
}

/** Initiatives on the Implementation Board (and feeding Timeline / Split). */
export function useBoardInitiatives(): Initiative[] {
  const { state } = useApp();
  return useMemo(
    () => state.initiatives.filter((i) => i.stages.implementation),
    [state.initiatives]
  );
}
