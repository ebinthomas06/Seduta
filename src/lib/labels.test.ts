import { describe, expect, it } from "vitest";
import { institutionHint, institutionLabels } from "./labels";

describe("institutionLabels", () => {
  it("uses Year / Branch for college", () => {
    const l = institutionLabels("college");
    expect(l.primary).toBe("Year");
    expect(l.secondary).toBe("Branch");
  });

  it("uses Class / Section for school", () => {
    const l = institutionLabels("school");
    expect(l.primary).toBe("Class");
    expect(l.secondary).toBe("Section");
  });

  it("explains the mapping in the setup hint", () => {
    expect(institutionHint("college")).toBe(
      "Students are entered as year, branch and roll number. For a school this becomes class, section and roll number.",
    );
    expect(institutionHint("school")).toContain(
      "class, section and roll number",
    );
    expect(institutionHint("school")).toContain("For a college");
  });
});
