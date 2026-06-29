// Shared, display-only table sorting: a tri-state header toggle (asc → desc →
// off) plus rank helpers for the non-alphabetical columns. The underlying order
// in state is never mutated — callers sort a copy for rendering only.
import { useState } from "react";
import type { DependencyStatus, TShirtSize } from "../types";
import { T_SHIRT_SIZES } from "./sizing";

export interface Sort<K extends string> {
  key: K;
  dir: "asc" | "desc";
}

/**
 * Tri-state sort state for a table header: first click sorts ascending, second
 * descending, third clears. Returns the current sort plus a toggler and an arrow
 * helper for the active column.
 */
export function useSort<K extends string>() {
  const [sort, setSort] = useState<Sort<K> | null>(null);
  const toggleSort = (key: K) =>
    setSort((s) =>
      s?.key === key
        ? s.dir === "asc"
          ? { key, dir: "desc" }
          : null // third click clears
        : { key, dir: "asc" }
    );
  const sortArrow = (key: K) =>
    sort?.key === key ? (sort.dir === "asc" ? " ▲" : " ▼") : "";
  return { sort, toggleSort, sortArrow };
}

/** T-shirt size rank (XS→XXL); unset ("") sorts last. */
export function tShirtRank(size: TShirtSize): number {
  const idx = T_SHIRT_SIZES.indexOf(size);
  return idx === -1 ? T_SHIRT_SIZES.length : idx;
}

const STATUS_ORDER: DependencyStatus[] = ["open", "accepted", "rejected", "cancelled"];

/** Dependency status rank, following the dropdown order. */
export function statusRank(status: DependencyStatus): number {
  const idx = STATUS_ORDER.indexOf(status);
  return idx === -1 ? STATUS_ORDER.length : idx;
}
