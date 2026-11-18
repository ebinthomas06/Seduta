import { getDb, type SedutaDB } from "./db";
import type { Plan } from "./types";

type NewPlanInput = Partial<Pick<Plan, "name" | "institution" | "rules">>;

/** Fields a caller may change. id and createdAt are fixed. */
export type PlanPatch = Partial<Omit<Plan, "id" | "createdAt" | "updatedAt">>;

export async function createPlan(
  input: NewPlanInput = {},
  db: SedutaDB = getDb(),
): Promise<Plan> {
  const now = Date.now();
  const plan: Plan = {
    id: crypto.randomUUID(),
    name: input.name?.trim() || "Untitled plan",
    institution: input.institution ?? "college",
    rules: input.rules ?? { frontBack: true, diagonal: false },
    groups: [],
    rooms: [],
    layout: null,
    status: "draft",
    createdAt: now,
    updatedAt: now,
  };
  await db.plans.add(plan);
  return plan;
}

export function getPlan(
  id: string,
  db: SedutaDB = getDb(),
): Promise<Plan | undefined> {
  return db.plans.get(id);
}

/** Most recently edited first. */
export function listPlans(db: SedutaDB = getDb()): Promise<Plan[]> {
  return db.plans.orderBy("updatedAt").reverse().toArray();
}

/** Applies a patch and bumps updatedAt. Returns the new plan, or undefined if it does not exist. */
export async function updatePlan(
  id: string,
  patch: PlanPatch,
  db: SedutaDB = getDb(),
): Promise<Plan | undefined> {
  return db.transaction("rw", db.plans, async () => {
    const current = await db.plans.get(id);
    if (!current) return undefined;
    const next: Plan = { ...current, ...patch, updatedAt: Date.now() };
    await db.plans.put(next);
    return next;
  });
}

/**
 * Changes what a layout is generated from (groups, rooms or rules). Any existing
 * layout would now be out of date, so it is cleared and the plan goes back to draft.
 */
export function updatePlanInputs(
  id: string,
  patch: Partial<Pick<Plan, "groups" | "rooms" | "rules">>,
  db: SedutaDB = getDb(),
): Promise<Plan | undefined> {
  return updatePlan(id, { ...patch, layout: null, status: "draft" }, db);
}

/**
 * Read-modify-write of the plan's inputs inside one transaction, so rapid edits from several
 * fields never overwrite each other with stale data. Clears any layout, like updatePlanInputs.
 */
export function mutatePlanInputs(
  id: string,
  change: (plan: Plan) => Partial<Pick<Plan, "groups" | "rooms" | "rules">>,
  db: SedutaDB = getDb(),
): Promise<Plan | undefined> {
  return db.transaction("rw", db.plans, async () => {
    const current = await db.plans.get(id);
    if (!current) return undefined;
    const next: Plan = {
      ...current,
      ...change(current),
      layout: null,
      status: "draft",
      updatedAt: Date.now(),
    };
    await db.plans.put(next);
    return next;
  });
}

/** Deep copy with a new id and "(copy)" appended to the name. */
export async function duplicatePlan(
  id: string,
  db: SedutaDB = getDb(),
): Promise<Plan | undefined> {
  const source = await db.plans.get(id);
  if (!source) return undefined;
  const now = Date.now();
  const copy: Plan = {
    ...structuredClone(source),
    id: crypto.randomUUID(),
    name: `${source.name} (copy)`,
    createdAt: now,
    updatedAt: now,
  };
  await db.plans.add(copy);
  return copy;
}

export function deletePlan(id: string, db: SedutaDB = getDb()): Promise<void> {
  return db.plans.delete(id);
}
