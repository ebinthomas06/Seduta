import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { exportFileName } from "./files";
import { buildSeatingPdf, PAPER } from "./pdf";
import { place, type Group, type Room } from "@/lib/seating/seating";

const rules = { frontBack: true, diagonal: false };
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
const layout = place(groups, rooms, rules).layout;

describe("PDF export", () => {
  it("makes one A4 page per room", async () => {
    const bytes = await buildSeatingPdf({
      planName: "Mid-semester exam",
      rooms,
      layout,
      groups,
      paper: "a4",
    });
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe("%PDF-");
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBe(4);
    const { width, height } = doc.getPage(0).getSize();
    expect(width).toBeCloseTo(PAPER.a4[0], 1);
    expect(height).toBeCloseTo(PAPER.a4[1], 1);
  });

  it("supports Letter paper", async () => {
    const bytes = await buildSeatingPdf({
      planName: "X",
      rooms: rooms.slice(0, 1),
      layout,
      groups,
      paper: "letter",
    });
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBe(1);
    expect(doc.getPage(0).getSize()).toEqual({ width: 612, height: 792 });
  });

  it("does not fail on names the built-in fonts cannot draw", async () => {
    const bytes = await buildSeatingPdf({
      planName: "परीक्षा 期末",
      rooms: rooms.slice(0, 1),
      layout,
      groups,
      paper: "a4",
    });
    expect((await PDFDocument.load(bytes)).getPageCount()).toBe(1);
  });

  it("copes with a large room (20 rows, 24 columns)", async () => {
    const big: Room = {
      id: "big",
      name: "Hall",
      rows: 20,
      cols: 24,
      seatsPerBench: 3,
      disabled: [],
    };
    const bigGroups: Group[] = [1, 2, 3, 4].map((n) => ({
      id: `g${n}`,
      label: `G${n}`,
      subject: `S${n}`,
      prefix: "KTE24CS",
      from: 1,
      to: 100,
      pad: 3,
    }));
    const l = place(bigGroups, [big], rules).layout;
    const bytes = await buildSeatingPdf({
      planName: "Big",
      rooms: [big],
      layout: l,
      groups: bigGroups,
      paper: "a4",
    });
    expect((await PDFDocument.load(bytes)).getPageCount()).toBe(1);
  });
});

describe("exportFileName", () => {
  it("builds the name shown in the dialog", () => {
    expect(exportFileName("Mid-semester exam", "layout", "pdf")).toBe(
      "Mid-semester exam, layout.pdf",
    );
    expect(exportFileName("Mid-semester exam", "rooms", "docx")).toBe(
      "Mid-semester exam, rooms.docx",
    );
  });

  it("removes characters files cannot contain", () => {
    expect(exportFileName("Unit test 2: classes 8/10?", "layout", "pdf")).toBe(
      "Unit test 2 classes 810, layout.pdf",
    );
    expect(exportFileName("  ", "layout", "pdf")).toBe(
      "Seating plan, layout.pdf",
    );
    expect(exportFileName("Test...", "rooms", "docx")).toBe("Test, rooms.docx");
  });
});
