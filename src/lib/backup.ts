import { getDb, type SedutaDB } from "@/lib/db/db";
import type { Plan, SavedRoom } from "@/lib/db/types";

/** Everything stored on this device, as one file the user can keep. */
export interface Backup {
  app: "seduta";
  version: 1;
  exportedAt: string;
  plans: Plan[];
  savedRooms: SavedRoom[];
}

export async function createBackup(db: SedutaDB = getDb()): Promise<Backup> {
  const [plans, savedRooms] = await Promise.all([
    db.plans.toArray(),
    db.savedRooms.toArray(),
  ]);
  return {
    app: "seduta",
    version: 1,
    exportedAt: new Date().toISOString(),
    plans,
    savedRooms,
  };
}

export function backupFileName(date = new Date()): string {
  const d = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
  return `Seduta backup ${d}.json`;
}

/* ───────────────────────── Validation ───────────────────────── */

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === "string";
const isNum = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);
const isStrArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every(isStr);

function validRoom(r: unknown): boolean {
  return (
    isObj(r) &&
    isStr(r.id) &&
    isStr(r.name) &&
    isNum(r.rows) &&
    isNum(r.cols) &&
    isNum(r.seatsPerBench) &&
    isStrArray(r.disabled)
  );
}

function validGroup(g: unknown): boolean {
  return (
    isObj(g) &&
    isStr(g.id) &&
    isStr(g.label) &&
    isStr(g.subject) &&
    isNum(g.from) &&
    isNum(g.to) &&
    (g.exclude === undefined ||
      (Array.isArray(g.exclude) && g.exclude.every(isNum)))
  );
}

function validStudent(s: unknown): boolean {
  return (
    s === null ||
    (isObj(s) &&
      isStr(s.groupId) &&
      isStr(s.subject) &&
      isNum(s.roll) &&
      isStr(s.label))
  );
}

function validLayout(l: unknown): boolean {
  if (l === null) return true;
  if (!isObj(l)) return false;
  return Object.values(l).every(
    (grid) =>
      Array.isArray(grid) &&
      grid.every((row) => Array.isArray(row) && row.every(validStudent)),
  );
}

function validPlan(p: unknown): p is Plan {
  return (
    isObj(p) &&
    isStr(p.id) &&
    isStr(p.name) &&
    (p.institution === "school" || p.institution === "college") &&
    isObj(p.rules) &&
    typeof p.rules.frontBack === "boolean" &&
    typeof p.rules.diagonal === "boolean" &&
    Array.isArray(p.groups) &&
    p.groups.every(validGroup) &&
    Array.isArray(p.rooms) &&
    p.rooms.every(validRoom) &&
    validLayout(p.layout) &&
    (p.status === "draft" || p.status === "ready") &&
    isNum(p.createdAt) &&
    isNum(p.updatedAt)
  );
}

export type ParsedBackup =
  { ok: true; backup: Backup } | { ok: false; error: string };

/** Reads and checks a backup file. Nothing is written until this says ok. */
export function parseBackup(text: string): ParsedBackup {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return {
      ok: false,
      error: "That file isn't a Seduta backup (it isn't valid JSON).",
    };
  }
  if (!isObj(data) || data.app !== "seduta")
    return { ok: false, error: "That file isn't a Seduta backup." };
  if (data.version !== 1)
    return {
      ok: false,
      error:
        "This backup was made by a newer version of Seduta and can't be read here.",
    };
  if (!Array.isArray(data.plans) || !Array.isArray(data.savedRooms))
    return {
      ok: false,
      error: "The backup is missing its plans or saved rooms.",
    };

  const badPlan = data.plans.findIndex((p) => !validPlan(p));
  if (badPlan >= 0)
    return {
      ok: false,
      error: `Plan ${badPlan + 1} in the backup is damaged, so nothing was restored.`,
    };
  const badRoom = data.savedRooms.findIndex((r) => !validRoom(r));
  if (badRoom >= 0)
    return {
      ok: false,
      error: `Saved room ${badRoom + 1} in the backup is damaged, so nothing was restored.`,
    };

  return {
    ok: true,
    backup: {
      app: "seduta",
      version: 1,
      exportedAt: isStr(data.exportedAt) ? data.exportedAt : "",
      plans: data.plans as Plan[],
      savedRooms: data.savedRooms as SavedRoom[],
    },
  };
}

/**
 * Adds everything in the backup. A plan or room with the same id is replaced by the backup's
 * copy; everything else already on this device is left alone. All or nothing.
 */
export async function restoreBackup(
  backup: Backup,
  db: SedutaDB = getDb(),
): Promise<{ plans: number; savedRooms: number }> {
  await db.transaction("rw", db.plans, db.savedRooms, async () => {
    await db.plans.bulkPut(backup.plans);
    await db.savedRooms.bulkPut(backup.savedRooms);
  });
  return { plans: backup.plans.length, savedRooms: backup.savedRooms.length };
}
