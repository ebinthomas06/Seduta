import { describe, expect, it } from "vitest";
import {
  expandGroup,
  findConflicts,
  formatRoll,
  parseSkipList,
  parseSkipListDetailed,
  place,
  precheck,
  roomSummary,
  suggestSwaps,
  swap,
  toRanges,
  type Group,
  type Room,
  type Rules,
} from "./seating";

const rules: Rules = { frontBack: true, diagonal: false };

const sampleGroups: Group[] = [
  {
    id: "g1",
    label: "2nd yr CSE",
    subject: "Physics",
    prefix: "24CS",
    from: 1,
    to: 60,
    exclude: [13, 44],
    pad: 3,
  },
  {
    id: "g2",
    label: "2nd yr ECE",
    subject: "Maths",
    prefix: "24EC",
    from: 1,
    to: 48,
    pad: 2,
  },
  {
    id: "g3",
    label: "2nd yr ME",
    subject: "Chemistry",
    prefix: "24ME",
    from: 1,
    to: 30,
    pad: 2,
  },
];

const sampleRooms: Room[] = [
  {
    id: "r1",
    name: "Room 101",
    rows: 6,
    cols: 6,
    seatsPerBench: 2,
    disabled: ["0,0"],
  }, // 35
  {
    id: "r2",
    name: "Room 102",
    rows: 6,
    cols: 6,
    seatsPerBench: 2,
    disabled: [],
  }, // 36
  {
    id: "r3",
    name: "Room 103",
    rows: 6,
    cols: 6,
    seatsPerBench: 2,
    disabled: [],
  }, // 36
  {
    id: "r4",
    name: "Room 104",
    rows: 5,
    cols: 6,
    seatsPerBench: 2,
    disabled: [],
  }, // 30
];

const seated = (layout: ReturnType<typeof place>["layout"]) =>
  Object.values(layout).flat(2).filter(Boolean).length;

describe("helpers", () => {
  it("formatRoll pads and prefixes", () => {
    expect(formatRoll("KTE24CS", 7, 3)).toBe("KTE24CS007");
    expect(formatRoll(undefined, 7)).toBe("7");
    expect(formatRoll("A", 123, 2)).toBe("A123");
  });

  it("parseSkipList handles numbers and ranges", () => {
    expect(parseSkipList("13, 44, 50-52")).toEqual([13, 44, 50, 51, 52]);
    expect(parseSkipList("5 3;3, 1–2")).toEqual([1, 2, 3, 5]);
    expect(parseSkipList("")).toEqual([]);
  });

  it("parseSkipListDetailed reports invalid tokens", () => {
    expect(parseSkipListDetailed("4, abc, 9-3, 7")).toEqual({
      numbers: [4, 7],
      invalid: ["abc", "9-3"],
    });
  });

  it("expandGroup skips excluded rolls", () => {
    const students = expandGroup(sampleGroups[0]);
    expect(students).toHaveLength(58);
    expect(students[0].label).toBe("24CS001");
    expect(students.some((s) => s.roll === 13 || s.roll === 44)).toBe(false);
  });
});

describe("precheck", () => {
  it("warns when there are too few seats", () => {
    const warnings = precheck(sampleGroups, sampleRooms.slice(0, 1), rules);
    expect(warnings.some((w) => w.includes("usable seats"))).toBe(true);
  });

  it("warns when a single subject is too big for the rooms", () => {
    const groups: Group[] = [
      { id: "g", label: "All", subject: "Physics", from: 1, to: 30 },
    ];
    const rooms: Room[] = [
      { id: "r", name: "R", rows: 5, cols: 6, seatsPerBench: 2, disabled: [] },
    ];
    const warnings = precheck(groups, rooms, rules);
    expect(warnings.some((w) => w.includes("Physics"))).toBe(true);
  });

  it("has no warnings for the sample data", () => {
    expect(precheck(sampleGroups, sampleRooms, rules)).toEqual([]);
  });
});

describe("place", () => {
  it("seats all 136 sample students with zero clashes (front/back rule)", () => {
    const result = place(sampleGroups, sampleRooms, rules);
    expect(result.unplaced).toHaveLength(0);
    expect(seated(result.layout)).toBe(136);
    expect(findConflicts(result.layout, sampleRooms, rules)).toEqual([]);
  });

  it("is deterministic", () => {
    const a = place(sampleGroups, sampleRooms, rules);
    const b = place(sampleGroups, sampleRooms, rules);
    expect(a.layout).toEqual(b.layout);
  });

  it("never uses disabled seats", () => {
    const result = place(sampleGroups, sampleRooms, rules);
    expect(result.layout["r1"][0][0]).toBeNull();
  });

  it("skips excluded roll numbers", () => {
    const result = place(sampleGroups, sampleRooms, rules);
    const physics = Object.values(result.layout)
      .flat(2)
      .filter((s) => s?.subject === "Physics")
      .map((s) => s!.roll);
    expect(physics).not.toContain(13);
    expect(physics).not.toContain(44);
    expect(physics).toHaveLength(58);
  });

  it("produces no clashes under the diagonal rule too", () => {
    const diag: Rules = { frontBack: true, diagonal: true };
    const rooms: Room[] = [
      { id: "a", name: "A", rows: 6, cols: 8, seatsPerBench: 2, disabled: [] },
      { id: "b", name: "B", rows: 6, cols: 8, seatsPerBench: 2, disabled: [] },
    ];
    const groups: Group[] = [
      { id: "1", label: "1", subject: "S1", from: 1, to: 20 },
      { id: "2", label: "2", subject: "S2", from: 1, to: 20 },
      { id: "3", label: "3", subject: "S3", from: 1, to: 20 },
      { id: "4", label: "4", subject: "S4", from: 1, to: 20 },
    ];
    const result = place(groups, rooms, diag);
    expect(findConflicts(result.layout, rooms, diag)).toEqual([]);
  });

  it("leaves leftovers unplaced instead of breaking the rule", () => {
    const groups: Group[] = [
      { id: "g", label: "All", subject: "Physics", from: 1, to: 30 },
    ];
    const rooms: Room[] = [
      { id: "r", name: "R", rows: 5, cols: 6, seatsPerBench: 2, disabled: [] },
    ];
    const result = place(groups, rooms, rules);
    expect(result.unplaced.length).toBeGreaterThan(0);
    expect(findConflicts(result.layout, rooms, rules)).toEqual([]);
    expect(seated(result.layout) + result.unplaced.length).toBe(30);
  });
});

describe("findConflicts, swap and suggestSwaps", () => {
  it("detects a manual bad swap", () => {
    const result = place(sampleGroups, sampleRooms, rules);
    expect(findConflicts(result.layout, sampleRooms, rules)).toHaveLength(0);

    // find two seats in r2 with different subjects, then put a same-subject student next to a twin
    const grid = result.layout["r2"];
    const target = grid[0][0]!;
    let twin: [number, number] | null = null;
    for (let r = 0; r < 6 && !twin; r++)
      for (let c = 0; c < 6; c++)
        if (
          grid[r][c]?.subject === target.subject &&
          !(r === 0 && c === 0) &&
          r > 1
        ) {
          twin = [r, c];
          break;
        }
    expect(twin).not.toBeNull();
    // move the twin next to (0,0): swap whatever sits at (0,1) with the twin
    const bad = swap(result.layout, "r2", [0, 1], twin!);
    expect(findConflicts(bad, sampleRooms, rules).length).toBeGreaterThan(0);
  });

  it("swap returns a new layout and leaves the original untouched", () => {
    const result = place(sampleGroups, sampleRooms, rules);
    const before = result.layout["r2"][0][0];
    const next = swap(result.layout, "r2", [0, 0], [0, 1]);
    expect(result.layout["r2"][0][0]).toBe(before);
    expect(next["r2"][0][1]).toBe(before);
  });

  it("suggestSwaps proposes seats that lower the clash count", () => {
    const result = place(sampleGroups, sampleRooms, rules);
    const grid = result.layout["r2"];
    let twin: [number, number] | null = null;
    for (let r = 2; r < 6 && !twin; r++)
      for (let c = 0; c < 6; c++)
        if (grid[r][c]?.subject === grid[0][0]!.subject) {
          twin = [r, c];
          break;
        }
    const bad = swap(result.layout, "r2", [0, 1], twin!);
    const before = findConflicts(bad, sampleRooms, rules).filter(
      (x) => x.roomId === "r2",
    ).length;
    expect(before).toBeGreaterThan(0);

    const suggestions = suggestSwaps(bad, sampleRooms, rules, "r2", [0, 1]);
    expect(suggestions.length).toBeGreaterThan(0);
    for (const s of suggestions) expect(s.clashesAfter).toBeLessThan(before);
    // sorted best first
    const after = suggestions.map((s) => s.clashesAfter);
    expect(after).toEqual([...after].sort((a, b) => a - b));
  });

  it("suggestSwaps returns nothing for a clean room, empty seat or disabled seat", () => {
    const result = place(sampleGroups, sampleRooms, rules);
    expect(
      suggestSwaps(result.layout, sampleRooms, rules, "r2", [0, 0]),
    ).toEqual([]);
    expect(
      suggestSwaps(result.layout, sampleRooms, rules, "r1", [0, 0]),
    ).toEqual([]);
    expect(
      suggestSwaps(result.layout, sampleRooms, rules, "nope", [0, 0]),
    ).toEqual([]);
  });
});

describe("roomSummary", () => {
  it("compresses ranges", () => {
    expect(toRanges([1, 2, 3, 14, 15, 5])).toEqual(["1–3", "5", "14–15"]);
    expect(toRanges([])).toEqual([]);
  });

  it("summarises each room per group and counts match", () => {
    const result = place(sampleGroups, sampleRooms, rules);
    const summary = roomSummary(result.layout, sampleRooms, sampleGroups);
    expect(summary).toHaveLength(4);
    const total = summary
      .flatMap((r) => r.entries)
      .reduce((s, e) => s + e.count, 0);
    expect(total).toBe(136);
  });

  it("shows gaps such as 1–12, 14–25", () => {
    const rolls = [...Array(12).keys()]
      .map((i) => i + 1)
      .concat([...Array(12).keys()].map((i) => i + 14));
    expect(toRanges(rolls).join(", ")).toBe("1–12, 14–25");
  });
});
