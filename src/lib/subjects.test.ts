import { describe, expect, it } from "vitest";
import { buildSubjectMap } from "./subjects";

describe("buildSubjectMap", () => {
  it("assigns first letters and rotating tints", () => {
    const m = buildSubjectMap(["Maths", "Physics", "Chemistry", "Biology"]);
    expect(m.get("Maths")).toEqual({ letter: "M", tint: 1 });
    expect(m.get("Physics")).toEqual({ letter: "P", tint: 2 });
    expect(m.get("Chemistry")).toEqual({ letter: "C", tint: 3 });
    expect(m.get("Biology")).toEqual({ letter: "B", tint: 1 });
  });

  it("avoids duplicate letters", () => {
    const m = buildSubjectMap(["Physics", "Poetry", "Pottery"]);
    const letters = [...m.values()].map((v) => v.letter);
    expect(new Set(letters).size).toBe(3);
    expect(m.get("Physics")?.letter).toBe("P");
  });

  it("ignores repeats and blanks", () => {
    const m = buildSubjectMap(["Maths", " Maths ", "", "Art"]);
    expect([...m.keys()]).toEqual(["Maths", "Art"]);
  });
});
