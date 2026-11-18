import { describe, expect, it } from "vitest";
import { formatEdited, planHref, studentCount } from "./plan-utils";

describe("formatEdited", () => {
  const now = new Date(2026, 10, 18, 15, 0).getTime();
  it("says Today and Yesterday", () => {
    expect(formatEdited(new Date(2026, 10, 18, 1, 0).getTime(), now)).toBe(
      "Today",
    );
    expect(formatEdited(new Date(2026, 10, 17, 23, 0).getTime(), now)).toBe(
      "Yesterday",
    );
  });
  it("uses day and month this year, adding the year otherwise", () => {
    expect(formatEdited(new Date(2026, 10, 3).getTime(), now)).toBe("3 Nov");
    expect(formatEdited(new Date(2025, 11, 25).getTime(), now)).toBe(
      "25 Dec 2025",
    );
  });
});

describe("plan helpers", () => {
  it("counts students, honouring skipped rolls", () => {
    expect(
      studentCount({
        groups: [
          {
            id: "a",
            label: "A",
            subject: "M",
            from: 1,
            to: 60,
            exclude: [13, 44],
          },
          { id: "b", label: "B", subject: "P", from: 1, to: 48 },
          { id: "c", label: "C", subject: "C", from: 1, to: 30 },
        ],
      }),
    ).toBe(136);
  });
  it("links ready plans to the editor and drafts to setup", () => {
    expect(planHref({ id: "x", status: "ready" })).toBe("/plan/x/layout");
    expect(planHref({ id: "x", status: "draft" })).toBe("/plan/x/setup");
  });
});
