import Dexie, { type Table } from "dexie";
import type { Plan, SavedRoom } from "./types";

export class SedutaDB extends Dexie {
  plans!: Table<Plan, string>;
  savedRooms!: Table<SavedRoom, string>;

  constructor(name = "seduta") {
    super(name);
    this.version(1).stores({
      plans: "id, updatedAt",
      savedRooms: "id",
    });
  }
}

let instance: SedutaDB | null = null;

/** The app database. Browser only: IndexedDB does not exist during server rendering. */
export function getDb(): SedutaDB {
  instance ??= new SedutaDB();
  return instance;
}
