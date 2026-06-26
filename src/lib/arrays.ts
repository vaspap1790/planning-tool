// Tiny immutable helpers for id-list (pill) fields.
import type { ID } from "../types";

/** Append `id` if not already present. */
export function addId(ids: ID[], id: ID): ID[] {
  return ids.includes(id) ? ids : [...ids, id];
}

/** Remove `id` if present. */
export function removeId(ids: ID[], id: ID): ID[] {
  return ids.filter((x) => x !== id);
}
