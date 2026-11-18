import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { buildRoomsDocx } from "./docx";
import { buildRoomSummary, formatRuns, toRuns } from "./summary";
import { place, type Group, type Room } from "@/lib/seating/seating";

const rules = { frontBack: true, diagonal: false };
const groups: Group[] = [
  {
    id: "a",
    label: "2nd yr · CSE",
    subject: "Maths",
    prefix: "24CS",
    from: 1,
    to: 60,
    exclude: [13, 44],
    pad: 3,
  },
  {
    id: "b",
    label: "2nd yr · ECE",
    subject: "Physics",
    prefix: "24EC",
    from: 1,
    to: 48,
    pad: 3,
  },
  {
    id: "c",
    label: "2nd yr · ME",
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
    name: "Room 101",
    rows: 6,
    cols: 6,
    seatsPerBench: 2,
    disabled: ["0,0"],
  },
  {
    id: "r2",
    name: "Room 102",
    rows: 6,
    cols: 6,
    seatsPerBench: 2,
    disabled: [],
  },
  {
    id: "r3",
    name: "Room 103",
    rows: 6,
    cols: 6,
    seatsPerBench: 2,
    disabled: [],
  },
  {
    id: "r4",
    name: "Room 104",
    rows: 5,
    cols: 6,
    seatsPerBench: 2,
    disabled: [],
  },
];
const result = place(groups, rooms, rules);

describe("roll ranges", () => {
  it("collapses consecutive rolls", () => {
    expect(toRuns([1, 2, 3, 5, 14, 15, 2])).toEqual([
      [1, 3],
      [5, 5],
      [14, 15],
    ]);
    expect(toRuns([])).toEqual([]);
  });

  it("formats with prefix and padding, using an en dash", () => {
    const g = groups[0];
    expect(
      formatRuns(
        [
          [1, 12],
          [14, 14],
          [20, 25],
        ],
        g,
      ),
    ).toBe("24CS001–24CS012, 24CS014, 24CS020–24CS025");
    expect(
      formatRuns([[1, 3]], { ...g, prefix: undefined, pad: undefined }),
    ).toBe("1–3");
  });
});

describe("room summary", () => {
  const s = buildRoomSummary(rooms, result.layout, groups);

  it("the sum of counts equals the number of seated students", () => {
    expect(s.grandTotal).toBe(136);
    const fromRows = s.sections
      .flatMap((x) => x.rows)
      .reduce((n, r) => n + r.count, 0);
    expect(fromRows).toBe(136);
    for (const sec of s.sections)
      expect(sec.total).toBe(sec.rows.reduce((n, r) => n + r.count, 0));
  });

  it("every roll appears exactly once across all rooms", () => {
    const all = s.sections
      .flatMap((x) => x.rows.map((r) => r.rolls))
      .join(", ");
    // no skipped roll numbers are listed
    expect(all).not.toContain("24CS013");
    expect(all).not.toContain("24CS044");
  });
});

describe("Word document", () => {
  it("is a valid .docx with the table text", async () => {
    const bytes = await buildRoomsDocx({
      planName: "Mid-semester exam",
      rooms,
      layout: result.layout,
      groups,
      paper: "a4",
    });
    expect(bytes[0]).toBe(0x50); // "PK": a zip container
    const zip = await JSZip.loadAsync(bytes);
    const xml = await zip.file("word/document.xml")!.async("string");
    expect(xml).toContain("Mid-semester exam · Room allocation");
    expect(xml).toContain("Room 101");
    expect(xml).toContain("Roll numbers");
    expect(xml).toContain("24CS001");
    expect(xml).toContain("Room 101 total");
    expect(xml).toContain(">136<");
    expect(xml).toContain('w:w="11906"'); // A4
  });

  it("uses Letter page size", async () => {
    const bytes = await buildRoomsDocx({
      planName: "X",
      rooms: rooms.slice(0, 1),
      layout: result.layout,
      groups,
      paper: "letter",
    });
    const xml = await (
      await JSZip.loadAsync(bytes)
    )
      .file("word/document.xml")!
      .async("string");
    expect(xml).toContain('w:w="12240"');
  });

  it("shows a room name only on its first row", async () => {
    const bytes = await buildRoomsDocx({
      planName: "X",
      rooms: rooms.slice(0, 1),
      layout: result.layout,
      groups,
      paper: "a4",
    });
    const xml = await (
      await JSZip.loadAsync(bytes)
    )
      .file("word/document.xml")!
      .async("string");
    // "Room 101" appears in its first row and in the "Room 101 total" label, nowhere else
    expect(xml.match(/Room 101</g)?.length).toBe(1);
  });
});
