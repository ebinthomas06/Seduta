import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import {
  backupFileName,
  createBackup,
  parseBackup,
  restoreBackup,
} from "./backup";
import { SedutaDB } from "./db/db";
import { createPlan, listPlans, updatePlan } from "./db/plans";
import { saveRoomToLibrary } from "./db/savedRooms";
import { listSavedRooms } from "./db/savedRooms";
import { place } from "./seating/seating";

let db: SedutaDB;
beforeEach(() => {
  db = new SedutaDB(`test-${crypto.randomUUID()}`);
});

const room = {
  id: "r",
  name: "Room 101",
  rows: 6,
  cols: 6,
  seatsPerBench: 2,
  disabled: ["0,0"],
};

async function seed() {
  const plan = await createPlan({ name: "Mid-semester exam" }, db);
  const groups = [
    {
      id: "g",
      label: "CSE",
      subject: "Maths",
      prefix: "24CS",
      from: 1,
      to: 20,
      pad: 3,
    },
  ];
  const layout = place(groups, [room], {
    frontBack: true,
    diagonal: false,
  }).layout;
  await updatePlan(
    plan.id,
    { groups, rooms: [room], layout, status: "ready" },
    db,
  );
  await saveRoomToLibrary(room, db);
  return plan.id;
}

describe("backup", () => {
  it("round-trips plans and saved rooms through JSON into an empty database", async () => {
    await seed();
    const json = JSON.stringify(await createBackup(db));

    const parsed = parseBackup(json);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const fresh = new SedutaDB(`test-${crypto.randomUUID()}`);
    const counts = await restoreBackup(parsed.backup, fresh);
    expect(counts).toEqual({ plans: 1, savedRooms: 1 });
    expect(await listPlans(fresh)).toEqual(await listPlans(db));
    expect(await listSavedRooms(fresh)).toEqual(await listSavedRooms(db));
  });

  it("replaces a plan with the same id and keeps the others", async () => {
    const id = await seed();
    const backup = await createBackup(db);
    await updatePlan(id, { name: "Changed after backup" }, db);
    const other = await createPlan({ name: "Made after backup" }, db);

    await restoreBackup(backup, db);
    const names = (await listPlans(db)).map((p) => p.name).sort();
    expect(names).toEqual(["Made after backup", "Mid-semester exam"]);
    expect(other.id).not.toBe(id);
  });
});

describe("parseBackup", () => {
  it("rejects things that are not backups", () => {
    expect(parseBackup("not json").ok).toBe(false);
    expect(parseBackup("[]").ok).toBe(false);
    expect(parseBackup('{"app":"other"}').ok).toBe(false);
    expect(
      parseBackup('{"app":"seduta","version":2,"plans":[],"savedRooms":[]}'),
    ).toMatchObject({
      ok: false,
    });
  });

  it("rejects a damaged plan without accepting any of the file", async () => {
    await seed();
    const backup = await createBackup(db);
    const bad = { ...backup, plans: [{ ...backup.plans[0], rooms: "nope" }] };
    const res = parseBackup(JSON.stringify(bad));
    expect(res.ok).toBe(false);
    expect(!res.ok && res.error).toMatch(/Plan 1/);
  });

  it("rejects a damaged layout", async () => {
    await seed();
    const backup = await createBackup(db);
    const bad = {
      ...backup,
      plans: [{ ...backup.plans[0], layout: { r: [[{ roll: "x" }]] } }],
    };
    expect(parseBackup(JSON.stringify(bad)).ok).toBe(false);
  });

  it("accepts an empty backup", () => {
    expect(
      parseBackup(
        '{"app":"seduta","version":1,"exportedAt":"","plans":[],"savedRooms":[]}',
      ).ok,
    ).toBe(true);
  });
});

describe("backupFileName", () => {
  it("includes the date", () => {
    expect(backupFileName(new Date(2026, 10, 18))).toBe(
      "Seduta backup 2026-11-18.json",
    );
  });
});
