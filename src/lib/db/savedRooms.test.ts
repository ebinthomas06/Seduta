import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { SedutaDB } from "./db";
import {
  deleteSavedRoom,
  listSavedRooms,
  saveRoomToLibrary,
} from "./savedRooms";
import { roomFromSaved } from "@/lib/rooms";

let db: SedutaDB;
beforeEach(() => {
  db = new SedutaDB(`test-${crypto.randomUUID()}`);
});

const room = {
  id: "plan-room",
  name: "Room 101",
  rows: 6,
  cols: 6,
  seatsPerBench: 2,
  disabled: ["0,0"],
};

describe("saved rooms library", () => {
  it("saves a copy, not the plan's room", async () => {
    const saved = await saveRoomToLibrary(room, db);
    expect(saved.id).not.toBe(room.id);
    expect(await listSavedRooms(db)).toHaveLength(1);
  });

  it("replaces a room with the same name", async () => {
    await saveRoomToLibrary(room, db);
    await saveRoomToLibrary({ ...room, name: "room 101", rows: 4 }, db);
    const list = await listSavedRooms(db);
    expect(list).toHaveLength(1);
    expect(list[0].rows).toBe(4);
  });

  it("editing a plan's copy does not change the library", async () => {
    const saved = await saveRoomToLibrary(room, db);
    const copy = roomFromSaved(saved);
    copy.disabled.push("3,3");
    copy.rows = 2;
    const [fromDb] = await listSavedRooms(db);
    expect(fromDb.disabled).toEqual(["0,0"]);
    expect(fromDb.rows).toBe(6);
  });

  it("deletes", async () => {
    const saved = await saveRoomToLibrary(room, db);
    await deleteSavedRoom(saved.id, db);
    expect(await listSavedRooms(db)).toHaveLength(0);
  });
});
