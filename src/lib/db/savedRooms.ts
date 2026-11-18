import { savedFromRoom } from "@/lib/rooms";
import type { Room } from "@/lib/seating/seating";
import { getDb, type SedutaDB } from "./db";
import type { SavedRoom } from "./types";

/** Alphabetical. The library is small, so sorting in memory avoids a name index. */
export async function listSavedRooms(
  db: SedutaDB = getDb(),
): Promise<SavedRoom[]> {
  const all = await db.savedRooms.toArray();
  return all.sort((a, b) => a.name.localeCompare(b.name));
}

/** Adds a room to the library. A room with the same name is replaced, so the library has no duplicates. */
export async function saveRoomToLibrary(
  room: Room,
  db: SedutaDB = getDb(),
): Promise<SavedRoom> {
  const copy = savedFromRoom(room);
  return db.transaction("rw", db.savedRooms, async () => {
    const existing = await db.savedRooms
      .filter((s) => s.name.toLowerCase() === room.name.trim().toLowerCase())
      .first();
    if (existing) copy.id = existing.id;
    copy.name = room.name.trim();
    await db.savedRooms.put(copy);
    return copy;
  });
}

export function deleteSavedRoom(
  id: string,
  db: SedutaDB = getDb(),
): Promise<void> {
  return db.savedRooms.delete(id);
}
