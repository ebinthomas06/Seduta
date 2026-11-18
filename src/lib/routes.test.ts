import { describe, expect, it } from "vitest";
import { routes } from "./routes";

describe("routes", () => {
  it("puts the plan in the query string", () => {
    expect(routes.setup("abc")).toBe("/setup?plan=abc");
    expect(routes.layout("abc")).toBe("/layout?plan=abc");
    expect(routes.room("abc", "new")).toBe("/room?plan=abc&room=new");
  });

  it("encodes unusual ids", () => {
    expect(routes.groups("a b&c")).toBe("/groups?plan=a%20b%26c");
  });
});
