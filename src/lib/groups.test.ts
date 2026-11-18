import { describe, expect, it } from "vitest";
import { studentCount } from "./plan-utils";
import {
  emptyForm,
  formFromGroup,
  groupLabel,
  primaryOptions,
  rollSummary,
  validateGroupForm,
  type GroupForm,
} from "./groups";
import { place, type Group } from "./seating/seating";

const base: GroupForm = {
  primary: "2nd year",
  secondary: "CSE",
  prefix: "24CS",
  from: "1",
  to: "60",
  skip: "13, 44",
  subject: "Maths",
};

describe("validateGroupForm", () => {
  it("accepts a valid college group", () => {
    const { errors, group } = validateGroupForm(base, "college");
    expect(errors).toEqual({});
    expect(group).toMatchObject({
      label: "2nd yr · CSE",
      from: 1,
      to: 60,
      exclude: [13, 44],
      prefix: "24CS",
      pad: 3,
      subject: "Maths",
    });
  });

  it("requires from <= to", () => {
    const { errors, group } = validateGroupForm(
      { ...base, from: "50", to: "10" },
      "college",
    );
    expect(errors.to).toMatch(/at least Roll from/);
    expect(group).toBeUndefined();
  });

  it("rejects skip numbers outside the range", () => {
    const { errors } = validateGroupForm(
      { ...base, skip: "13, 99" },
      "college",
    );
    expect(errors.skip).toMatch(/between 1 and 60/);
  });

  it("rejects unreadable skip entries", () => {
    const { errors } = validateGroupForm(
      { ...base, skip: "13, abc" },
      "college",
    );
    expect(errors.skip).toMatch(/abc/);
  });

  it("requires a subject and a branch/section", () => {
    const { errors } = validateGroupForm(
      { ...base, subject: " ", secondary: "" },
      "school",
    );
    expect(errors.subject).toBeDefined();
    expect(errors.secondary).toMatch(/section/);
  });

  it("rejects non-numeric or zero rolls", () => {
    const { errors } = validateGroupForm(
      { ...base, from: "0", to: "x" },
      "college",
    );
    expect(errors.from).toBeDefined();
    expect(errors.to).toBeDefined();
  });

  it("reuses the spelling of a known subject", () => {
    const { group } = validateGroupForm(
      { ...base, subject: "maths" },
      "college",
      ["Maths"],
    );
    expect(group?.subject).toBe("Maths");
  });

  it("omits prefix, padding and skips when empty", () => {
    const { group } = validateGroupForm(
      { ...base, prefix: "", skip: "" },
      "college",
    );
    expect(group?.prefix).toBeUndefined();
    expect(group?.pad).toBeUndefined();
    expect(group?.exclude).toBeUndefined();
  });
});

describe("group helpers", () => {
  it("labels years and classes", () => {
    expect(groupLabel("2nd year", "CSE")).toBe("2nd yr · CSE");
    expect(groupLabel("Class 8", "B")).toBe("Class 8 · B");
  });

  it("summarises rolls", () => {
    const g = { from: 1, to: 60, exclude: [13, 44] } as Group;
    expect(rollSummary(g)).toBe("Rolls 1–60, skip 13, 44");
    expect(rollSummary({ from: 1, to: 48 } as Group)).toBe("Rolls 1–48");
    expect(
      rollSummary({ from: 1, to: 60, exclude: [50, 51, 52] } as Group),
    ).toBe("Rolls 1–60, skip 50–52");
  });

  it("round-trips a group through the form", () => {
    const { group } = validateGroupForm(base, "college");
    const form = formFromGroup({ id: "x", ...group! }, "college");
    expect(form).toEqual(base);
  });

  it("starts empty with the first year/class", () => {
    expect(emptyForm("college").primary).toBe("1st year");
    expect(emptyForm("school").primary).toBe("Class 1");
  });

  it("the sample three groups give 58 + 48 + 30 = 136 students", () => {
    const groups: Group[] = [
      { id: "a", ...validateGroupForm(base, "college").group! },
      {
        id: "b",
        ...validateGroupForm(
          {
            ...base,
            secondary: "ECE",
            prefix: "24EC",
            to: "48",
            skip: "",
            subject: "Physics",
          },
          "college",
        ).group!,
      },
      {
        id: "c",
        ...validateGroupForm(
          {
            ...base,
            secondary: "ME",
            prefix: "24ME",
            to: "30",
            skip: "",
            subject: "Chemistry",
          },
          "college",
        ).group!,
      },
    ];
    expect(groups.map((g) => studentCount({ groups: [g] }))).toEqual([
      58, 48, 30,
    ]);
    expect(studentCount({ groups })).toBe(136);
  });
});

describe("school plans (class and section, no roll prefix)", () => {
  const school: GroupForm = {
    primary: "Class 8",
    secondary: "B",
    prefix: "",
    from: "1",
    to: "40",
    skip: "7, 22",
    subject: "Science",
  };

  it("labels the group Class 8 · B with plain roll numbers", () => {
    const { errors, group } = validateGroupForm(school, "school");
    expect(errors).toEqual({});
    expect(group?.label).toBe("Class 8 · B");
    expect(group?.prefix).toBeUndefined();
    expect(group?.pad).toBeUndefined();
  });

  it("offers classes, and keeps a leftover college value visible", () => {
    expect(primaryOptions("school")).toContain("Class 12");
    expect(primaryOptions("school", "2nd year")[0]).toBe("2nd year");
    expect(primaryOptions("school", "Class 3")).toEqual(
      primaryOptions("school"),
    );
  });

  it("runs end to end: seating, summary and exports work without prefixes", async () => {
    const mk = (secondary: string, subject: string, to: string) =>
      ({
        id: secondary,
        ...validateGroupForm(
          { ...school, secondary, subject, to, skip: "" },
          "school",
        ).group!,
      }) as Group;
    const groups = [
      mk("A", "Science", "24"),
      mk("B", "Maths", "24"),
      mk("C", "English", "24"),
    ];
    const rooms = [
      {
        id: "r1",
        name: "Hall A",
        rows: 6,
        cols: 6,
        seatsPerBench: 3,
        disabled: [],
      },
      {
        id: "r2",
        name: "Hall B",
        rows: 6,
        cols: 6,
        seatsPerBench: 3,
        disabled: [],
      },
      {
        id: "r3",
        name: "Hall C",
        rows: 6,
        cols: 6,
        seatsPerBench: 3,
        disabled: [],
      },
    ];
    const rules = { frontBack: true, diagonal: false };
    const { layout, unplaced } = place(groups, rooms, rules);
    expect(unplaced).toHaveLength(0);

    const { buildRoomSummary } = await import("./export/summary");
    const summary = buildRoomSummary(rooms, layout, groups);
    expect(summary.grandTotal).toBe(72);
    expect(summary.sections[0].rows[0].rolls).toMatch(
      /^\d+(–\d+)?(, \d+(–\d+)?)*$/,
    );

    const { buildSeatingPdf } = await import("./export/pdf");
    const { buildRoomsDocx } = await import("./export/docx");
    expect(
      (
        await buildSeatingPdf({
          planName: "Unit test",
          rooms,
          layout,
          groups,
          paper: "a4",
        })
      ).length,
    ).toBeGreaterThan(1000);
    expect(
      (
        await buildRoomsDocx({
          planName: "Unit test",
          rooms,
          layout,
          groups,
          paper: "letter",
        })
      ).length,
    ).toBeGreaterThan(1000);
  });
});
