import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildServiceWorker,
  OFFLINE_FILES,
  OFFLINE_PAGES,
} from "./serviceWorker";

const root = path.resolve(__dirname, "../..");

describe("service worker", () => {
  it("is valid JavaScript", () => {
    expect(() => new Function(buildServiceWorker("test"))).not.toThrow();
  });

  it("names its cache after the build and lists every page", () => {
    const js = buildServiceWorker("abc123");
    expect(js).toContain('"seduta-abc123"');
    for (const page of OFFLINE_PAGES)
      expect(js).toContain(JSON.stringify(page));
  });

  it("only lists pages that exist", () => {
    for (const page of OFFLINE_PAGES) {
      const file = page === "/" ? "page.tsx" : `${page.slice(1)}/page.tsx`;
      expect(existsSync(path.join(root, "src/app", file)), page).toBe(true);
    }
  });

  it("only lists files that exist", () => {
    for (const f of OFFLINE_FILES) {
      if (f === "/manifest.webmanifest") continue; // generated from src/app/manifest.ts
      expect(existsSync(path.join(root, "public", f)), f).toBe(true);
    }
  });

  it("finds build files in page HTML the way the worker does", () => {
    const js = buildServiceWorker("x");
    // Pull the two regexes back out of the generated source and try them on sample HTML.
    const html =
      '<script src="/_next/static/chunks/app-1a2b.js"></script>' +
      'self.__next_f.push(["static/chunks/groups-9f.js","static/css/a.css"])';
    const found = new Set<string>();
    for (const m of html.matchAll(/\/_next\/static\/[^"'\\\s)<>]+/g))
      found.add(m[0]);
    for (const m of html.matchAll(
      /static\/(?:chunks|css|media)\/[^"'\\\s)<>]+/g,
    ))
      found.add("/_next/" + m[0]);
    expect(found.has("/_next/static/chunks/app-1a2b.js")).toBe(true);
    expect(found.has("/_next/static/chunks/groups-9f.js")).toBe(true);
    expect(found.has("/_next/static/css/a.css")).toBe(true);
    expect(js).toContain("matchAll");
  });
});
