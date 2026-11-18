import {
  place,
  findConflicts,
  roomSummary,
  swap,
  Group,
  Room,
  Rules,
} from "./seating";

const groups: Group[] = [
  {
    id: "cse",
    label: "2nd yr CSE",
    subject: "Maths",
    prefix: "KTE24CS",
    pad: 3,
    from: 1,
    to: 60,
    exclude: [13, 44],
  },
  {
    id: "ece",
    label: "2nd yr ECE",
    subject: "Physics",
    prefix: "KTE24EC",
    pad: 3,
    from: 1,
    to: 48,
  },
  {
    id: "mech",
    label: "2nd yr ME",
    subject: "Chemistry",
    prefix: "KTE24ME",
    pad: 3,
    from: 1,
    to: 30,
  },
];
const rooms: Room[] = [
  {
    id: "r101",
    name: "Room 101",
    rows: 6,
    cols: 8,
    seatsPerBench: 2,
    disabled: ["0,0"],
  },
  {
    id: "r102",
    name: "Room 102",
    rows: 6,
    cols: 8,
    seatsPerBench: 2,
    disabled: [],
  },
  {
    id: "r103",
    name: "Room 103",
    rows: 5,
    cols: 6,
    seatsPerBench: 1,
    disabled: [],
  },
  {
    id: "r104",
    name: "Room 104",
    rows: 5,
    cols: 6,
    seatsPerBench: 1,
    disabled: [],
  },
];

for (const rules of [
  { frontBack: true, diagonal: false },
  { frontBack: true, diagonal: true },
] as Rules[]) {
  console.log("\n=== rules:", JSON.stringify(rules));
  const res = place(groups, rooms, rules);
  console.log("warnings:", res.warnings);
  console.log(
    "unplaced:",
    res.unplaced.length,
    "| conflicts:",
    findConflicts(res.layout, rooms, rules).length,
  );
  if (!rules.diagonal) {
    const g = res.layout["r102"];
    console.log(
      g
        .map((row) => row.map((s) => (s ? s.subject[0] : ".")).join(" "))
        .join("\n"),
    );
    console.log(
      JSON.stringify(roomSummary(res.layout, rooms, groups), null, 1).slice(
        0,
        900,
      ),
    );
    // manual edit that should create a conflict:
    const bad = swap(res.layout, "r102", [0, 1], [0, 2]);
    console.log(
      "conflicts after manual swap:",
      findConflicts(bad, rooms, rules).length,
    );
  }
}

// infeasible case: one huge subject
const huge: Group[] = [
  { id: "a", label: "A", subject: "Maths", from: 1, to: 120 },
  { id: "b", label: "B", subject: "Physics", from: 1, to: 10 },
];
console.log(
  "\n=== infeasible:",
  place(huge, rooms, { frontBack: true, diagonal: false }).warnings,
);
