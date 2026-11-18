"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { getPlan } from "./plans";
import type { Plan } from "./types";

/** Live plan: undefined while loading, null if no plan has this id. */
export function usePlan(id: string): Plan | null | undefined {
  return useLiveQuery(async () => (await getPlan(id)) ?? null, [id]);
}
