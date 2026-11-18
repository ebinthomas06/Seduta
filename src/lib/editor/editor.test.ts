import { describe, expect, it } from "vitest";
import { commit, redo, startHistory, undo } from "./history";
import {
  bestEmptySeat,
  clashNeighbours,
  clashSeats,
  moveToBestEmpty,
  rearrange,
  roomClashes,
  setSeatUsable,
  shortCode,
  swapSeats,
  type Snapshot,
} from "./ops";
import { useEditorStore } from "./store";
import {
  place,
  type Group,
  type Room,
  type Rules,
} from "@/lib/seating/seating";

const rules: Rules = { frontBack: true, diagonal: false };
const groups: Group[] = [
  {
    id: "a",
    label: "CSE",
    subject: "Maths",
    prefix: "24CS",
    from: 1,
    to: 60,
    exclude: [13, 44],
    pad: 3,
  },
  {
    id: "b",
    label: "ECE",
    subject: "Physics",
    prefix: "24EC",
    from: 1,
    to: 48,
    pad: 3,
  },
  {
    id: "c",
    label: "ME",
    subject: "Chemistry",
    prefix: "24ME",
    from: 1,
    to: 30,
    pad: 3,
  },
];
const rooms: Room[] = [
  {
    id: "r1",
    name: "101",
    rows: 6,
    cols: 6,
    seatsPerBench: 2,
    disabled: ["0,0"],
  },
  { id: "r2", name: "102", rows: 6, cols: 6, seatsPerBench: 2, disabled: [] },
  { id: "r3", name: "103", rows: 6, cols: 6, seatsPerBench: 2, disabled: [] },
  { id: "r4", name: "104", rows: 5, cols: 6, seatsPerBench: 2, disabled: [] },
];
const base = (): Snapshot => ({
  layout: place(groups, rooms, rules).layout,
  rooms,
});

/** Puts a same-subject twin next to (0,0)... returns a snapshot with at least one clash in r2. */
function withClash(snap: Snapshot): Snapshot {
  const grid = snap.layout["r2"];
  const subject = grid[0][0]!.subject;
  for (let r = 2; r < 6; r++)
    for (let c = 0; c < 6; c++)
      if (grid[r][c]?.subject === subject)
        return swapSeats(snap, "r2", [0, 1], [r, c]);
  throw new Error("no twin");
}

describe("history", () => {
  it("undo restores the exact previous state, redo reapplies", () => {
    const a = { n: 1 };
    const b = { n: 2 };
    const c = { n: 3 };
    let h = startHistory(a);
    h = commit(h, b);
    h = commit(h, c);
    h = undo(h);
    expect(h.present).toBe(b);
    h = undo(h);
    expect(h.present).toBe(a);
    h = undo(h);
    expect(h.present).toBe(a);
    h = redo(h);
    expect(h.present).toBe(b);
    h = commit(h, { n: 9 });
    expect(h.future).toEqual([]);
  });

  it("undoing a swap gives back the identical layout", () => {
    const snap = base();
    const store = useEditorStore.getState();
    store.load("p", snap);
    store.edit(swapSeats(snap, "r2", [0, 1], [3, 3]));
    expect(useEditorStore.getState().history!.present).not.toEqual(snap);
    useEditorStore.getState().undo();
    expect(useEditorStore.getState().history!.present).toBe(snap);
  });
});

describe("clashes", () => {
  it("a clean layout has none; a bad swap shows two red seats and a count", () => {
    const snap = base();
    expect(roomClashes(snap, rules, "r2")).toHaveLength(0);
    const bad = withClash(snap);
    expect(roomClashes(bad, rules, "r2").length).toBeGreaterThanOrEqual(1);
    expect(clashSeats(bad, rules, "r2").size).toBeGreaterThanOrEqual(2);
    expect(roomClashes(bad, rules, "r1")).toHaveLength(0);
  });

  it("describes who a seat clashes with and where", () => {
    const bad = withClash(base());
    const seat = [...clashSeats(bad, rules, "r2")][0]
      .split(",")
      .map(Number) as [number, number];
    const n = clashNeighbours(bad, rules, "r2", seat);
    expect(n.length).toBeGreaterThan(0);
    expect(["beside", "in front", "behind"]).toContain(n[0].where);
    expect(n[0].student.subject).toBe(
      bad.layout["r2"][seat[0]][seat[1]]!.subject,
    );
  });

  it("short codes drop the year", () => {
    const s = base()
      .layout["r2"].flat()
      .find((x) => x?.groupId === "b")!;
    expect(shortCode(s, groups)).toMatch(/^EC\d{2,3}$/);
  });
});

describe("edits", () => {
  it("move to empty seat moves a student without a new clash", () => {
    const snap = base();
    // free a seat in r2 by marking it empty
    const grid = snap.layout["r2"].map((r) => r.slice());
    const victim = grid[5][5]!;
    grid[5][5] = null;
    const withHole: Snapshot = {
      ...snap,
      layout: { ...snap.layout, r2: grid },
    };
    const seat: [number, number] = [0, 1];
    expect(bestEmptySeat(withHole, rules, "r2", seat)).toEqual([5, 5]);
    const moved = moveToBestEmpty(withHole, rules, "r2", seat)!;
    expect(moved.layout["r2"][5][5]).toBe(withHole.layout["r2"][0][1]);
    expect(moved.layout["r2"][0][1]).toBeNull();
    expect(victim).toBeDefined();
    expect(moveToBestEmpty(base(), rules, "r3", [0, 0])).toBeNull();
  });

  it("marking a seat unusable relocates its student, or refuses if the room is full", () => {
    const snap = base();
    const full = setSeatUsable(snap, rules, "r2", [2, 2], false);
    expect(full.ok).toBe(false);

    const grid = snap.layout["r2"].map((r) => r.slice());
    grid[5][5] = null;
    const withHole: Snapshot = {
      ...snap,
      layout: { ...snap.layout, r2: grid },
    };
    const res = setSeatUsable(withHole, rules, "r2", [2, 2], false);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.snapshot.rooms.find((r) => r.id === "r2")!.disabled).toContain(
        "2,2",
      );
      expect(res.snapshot.layout["r2"][2][2]).toBeNull();
      const count = res.snapshot.layout["r2"].flat().filter(Boolean).length;
      expect(count).toBe(withHole.layout["r2"].flat().filter(Boolean).length);
    }
  });

  it("marks a seat usable again", () => {
    const snap = base();
    const res = setSeatUsable(snap, rules, "r1", [0, 0], true);
    expect(res.ok && res.snapshot.rooms[0].disabled).toEqual([]);
  });

  it("rearranging a room reseats the same students with no clashes", () => {
    const bad = withClash(base());
    const fixed = rearrange(bad, rules, "r2")!;
    expect(fixed).not.toBeNull();
    expect(roomClashes(fixed, rules, "r2")).toHaveLength(0);
    const before = bad.layout["r2"]
      .flat()
      .filter(Boolean)
      .map((s) => `${s!.groupId}${s!.roll}`)
      .sort();
    const after = fixed.layout["r2"]
      .flat()
      .filter(Boolean)
      .map((s) => `${s!.groupId}${s!.roll}`)
      .sort();
    expect(after).toEqual(before);
  });
});

import {
  clashPosition,
  roomOccupancy,
  seatedBySubject,
  suggestionEffect,
} from "./ops";

describe("inspector text", () => {
  it("describes where a clash is", () => {
    expect(clashPosition([2, 1], [3, 1])).toBe("Row 3 and row 4, seat 2");
    expect(clashPosition([0, 0], [0, 1])).toBe("Row 1, seats 1 and 2");
    expect(clashPosition([1, 0], [2, 1])).toBe(
      "Row 2, seat 1 and row 3, seat 2",
    );
  });

  it("describes what a swap clears", () => {
    expect(suggestionEffect(2, 0)).toBe("Clears both clashes");
    expect(suggestionEffect(2, 1)).toBe("Clears one of the two");
    expect(suggestionEffect(1, 0)).toBe("Clears the clash");
    expect(suggestionEffect(5, 0)).toBe("Clears all 5 clashes");
    expect(suggestionEffect(5, 3)).toBe("Clears 2 of 5 clashes");
  });

  it("counts seated and usable seats and subjects", () => {
    const snap = base();
    expect(roomOccupancy(snap, "r1")).toEqual({ seated: 35, usable: 35 });
    const r4 = roomOccupancy(snap, "r4");
    expect(r4.usable).toBe(30);
    const total = ["r1", "r2", "r3", "r4"]
      .map((id) => roomOccupancy(snap, id).seated)
      .reduce((a, b) => a + b, 0);
    expect(total).toBe(136);
    const by = seatedBySubject(snap);
    expect(by.get("Maths")).toBe(58);
    expect(by.get("Physics")).toBe(48);
    expect(by.get("Chemistry")).toBe(30);
  });
});
