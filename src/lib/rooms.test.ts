import { describe, expect, it } from "vitest";
import {
  clampDisabled,
  moveItem,
  newRoom,
  roomFromSaved,
  roomMeta,
  roomsCapacity,
  savedFromRoom,
  toggleDisabled,
  usableSeats,
  validateRoom,
} from "./rooms";

const room = {
  id: "r",
  name: "Room 101",
  rows: 6,
  cols: 6,
  seatsPerBench: 2,
  disabled: ["0,0"],
};

describe("rooms", () => {
  it("6 rows x 3 benches x 2 seats with one disabled seat has 35 usable", () => {
    expect(usableSeats(room)).toBe(35);
  });

  it("ignores disabled seats outside the grid", () => {
    expect(usableSeats({ ...room, disabled: ["0,0", "9,9"] })).toBe(35);
  });

  it("describes the layout", () => {
    expect(roomMeta(room)).toBe("6 rows · 3 benches of 2");
    expect(roomMeta({ rows: 1, cols: 1, seatsPerBench: 1 })).toBe(
      "1 row · 1 bench of 1",
    );
  });

  it("sums capacity across rooms", () => {
    expect(
      roomsCapacity([
        room,
        { ...room, id: "b", disabled: [] },
        { ...room, id: "c", rows: 5, disabled: [] },
      ]),
    ).toBe(35 + 36 + 30);
  });

  it("toggles and clamps disabled seats", () => {
    expect(toggleDisabled([], "1,1")).toEqual(["1,1"]);
    expect(toggleDisabled(["1,1"], "1,1")).toEqual([]);
    expect(clampDisabled(["0,0", "5,5", "6,0"], 6, 4)).toEqual(["0,0"]);
  });

  it("moves rooms to change fill order", () => {
    expect(moveItem(["a", "b", "c"], 2, 0)).toEqual(["c", "a", "b"]);
    expect(moveItem(["a", "b"], 0, -1)).toEqual(["a", "b"]);
  });

  it("copies saved rooms without sharing state", () => {
    const saved = savedFromRoom(room);
    const copy = roomFromSaved(saved);
    expect(copy.id).not.toBe(saved.id);
    copy.disabled.push("2,2");
    copy.name = "Changed";
    expect(saved.disabled).toEqual(["0,0"]);
    expect(saved.name).toBe("Room 101");
  });

  it("validates", () => {
    expect(validateRoom(room)).toBeNull();
    expect(validateRoom({ ...room, name: " " })).toMatch(/name/);
    expect(
      validateRoom({ ...room, rows: 1, cols: 1, disabled: ["0,0"] }),
    ).toMatch(/usable/);
    expect(newRoom("X").rows).toBe(6);
  });
});
