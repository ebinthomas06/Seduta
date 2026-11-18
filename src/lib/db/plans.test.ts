import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { SedutaDB } from "./db";
import {
  createPlan,
  deletePlan,
  duplicatePlan,
  getPlan,
  listPlans,
  updatePlan,
} from "./plans";

let db: SedutaDB;

beforeEach(() => {
  db = new SedutaDB(`test-${crypto.randomUUID()}`);
});

describe("plans repository", () => {
  it("creates a draft with defaults", async () => {
    const plan = await createPlan({}, db);
    expect(plan.name).toBe("Untitled plan");
    expect(plan.status).toBe("draft");
    expect(plan.layout).toBeNull();
    expect(plan.rules).toEqual({ frontBack: true, diagonal: false });
    expect(await getPlan(plan.id, db)).toEqual(plan);
  });

  it("lists plans most recently edited first", async () => {
    const a = await createPlan({ name: "A" }, db);
    await new Promise((r) => setTimeout(r, 5));
    const b = await createPlan({ name: "B" }, db);
    await new Promise((r) => setTimeout(r, 5));
    await updatePlan(a.id, { name: "A2" }, db);
    const names = (await listPlans(db)).map((p) => p.name);
    expect(names).toEqual(["A2", "B"]);
    expect(b.id).not.toBe(a.id);
  });

  it("update merges the patch and bumps updatedAt, keeping createdAt", async () => {
    const plan = await createPlan({ name: "X" }, db);
    await new Promise((r) => setTimeout(r, 5));
    const next = await updatePlan(plan.id, { status: "ready" }, db);
    expect(next?.status).toBe("ready");
    expect(next?.name).toBe("X");
    expect(next?.createdAt).toBe(plan.createdAt);
    expect(next!.updatedAt).toBeGreaterThan(plan.updatedAt);
    expect(await updatePlan("missing", { name: "Y" }, db)).toBeUndefined();
  });

  it("duplicates deeply with a new id", async () => {
    const plan = await createPlan({ name: "Mid" }, db);
    await updatePlan(
      plan.id,
      {
        groups: [{ id: "g", label: "CSE", subject: "Maths", from: 1, to: 5 }],
      },
      db,
    );
    const copy = await duplicatePlan(plan.id, db);
    expect(copy?.name).toBe("Mid (copy)");
    expect(copy?.id).not.toBe(plan.id);
    expect(copy?.groups).toHaveLength(1);
    await updatePlan(copy!.id, { groups: [] }, db);
    expect((await getPlan(plan.id, db))?.groups).toHaveLength(1);
    expect(await listPlans(db)).toHaveLength(2);
  });

  it("deletes", async () => {
    const plan = await createPlan({}, db);
    await deletePlan(plan.id, db);
    expect(await getPlan(plan.id, db)).toBeUndefined();
    expect(await listPlans(db)).toHaveLength(0);
  });
});
