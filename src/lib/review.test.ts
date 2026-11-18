import { describe, expect, it } from "vitest";
import { reviewPlan, rulesSummary, unplacedStudents } from "./review";
import { place, type Group, type Room } from "./seating/seating";

const rules = { frontBack: true, diagonal: false };
const groups: Group[] = [
  {
    id: "a",
    label: "CSE",
    subject: "Maths",
    from: 1,
    to: 60,
    exclude: [13, 44],
  },
  { id: "b", label: "ECE", subject: "Physics", from: 1, to: 48 },
  { id: "c", label: "ME", subject: "Chemistry", from: 1, to: 30 },
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

describe("reviewPlan", () => {
  it("sample data: warns about spare seats, subjects fine, not blocked", () => {
    const r = reviewPlan({ groups, rooms, rules });
    expect(r.blocked).toBe(false);
    expect(r.cards.map((c) => c.title)).toEqual([
      "Almost no spare seats",
      "No subject is too large",
    ]);
    expect(r.cards[0].kind).toBe("warning");
    expect(r.cards[0].body).toContain("137 seats for 136 students");
    expect(r.cards[1].body).toBe(
      "Maths is the biggest at 58 students. These rooms can hold about 69 of one subject under your rules.",
    );
  });

  it("blocks when there are too few seats", () => {
    const r = reviewPlan({ groups, rooms: rooms.slice(0, 2), rules });
    expect(r.blocked).toBe(true);
    expect(r.cards[0]).toMatchObject({
      kind: "blocking",
      title: "Not enough seats",
    });
    expect(r.cards[0].body).toContain("136 students but only 71 usable seats");
  });

  it("blocks with no groups or no rooms", () => {
    expect(reviewPlan({ groups: [], rooms, rules }).blocked).toBe(true);
    expect(reviewPlan({ groups, rooms: [], rules }).blocked).toBe(true);
  });

  it("warns, but does not block, when one subject is too large", () => {
    const big: Group[] = [
      { id: "g", label: "All", subject: "Physics", from: 1, to: 30 },
    ];
    const r = reviewPlan({
      groups: big,
      rooms: [
        {
          id: "r",
          name: "R",
          rows: 5,
          cols: 6,
          seatsPerBench: 2,
          disabled: [],
        },
      ],
      rules,
    });
    expect(r.blocked).toBe(false);
    expect(r.cards.some((c) => c.title === "Too many Physics students")).toBe(
      true,
    );
  });

  it("no spare-seat warning when there is plenty of room", () => {
    const r = reviewPlan({ groups: groups.slice(2), rooms, rules });
    expect(r.cards.map((c) => c.kind)).toEqual(["ok"]);
  });
});

describe("unplacedStudents", () => {
  it("is empty when everyone is seated", () => {
    const { layout } = place(groups, rooms, rules);
    expect(unplacedStudents(groups, layout)).toEqual([]);
  });

  it("matches the engine's unplaced list", () => {
    const big: Group[] = [
      { id: "g", label: "All", subject: "Physics", from: 1, to: 30 },
    ];
    const small = rooms.slice(3);
    const result = place(big, small, rules);
    expect(result.unplaced.length).toBeGreaterThan(0);
    expect(unplacedStudents(big, result.layout).map((s) => s.roll)).toEqual(
      result.unplaced.map((s) => s.roll),
    );
  });
});

describe("generating", () => {
  it("is deterministic for the same input", () => {
    expect(place(groups, rooms, rules).layout).toEqual(
      place(groups, rooms, rules).layout,
    );
  });
});

describe("rulesSummary", () => {
  it("lists the active rules", () => {
    expect(rulesSummary({ frontBack: true, diagonal: false })).toBe(
      "Side by side, in front and behind",
    );
    expect(rulesSummary({ frontBack: false, diagonal: false })).toBe(
      "Side by side",
    );
    expect(rulesSummary({ frontBack: true, diagonal: true })).toBe(
      "Side by side, in front and behind, diagonally",
    );
  });
});
