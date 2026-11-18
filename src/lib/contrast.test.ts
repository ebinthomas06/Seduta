import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/** Reads the colour tokens straight from globals.css so the test can't drift from the app. */
const css = readFileSync(path.resolve(__dirname, "../app/globals.css"), "utf8");

function tokens(selector: string): Record<string, string> {
  const start = css.indexOf(selector);
  const open = css.indexOf("{", start);
  const close = css.indexOf("}", open);
  const out: Record<string, string> = {};
  for (const m of css
    .slice(open, close)
    .matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g))
    out[m[1]] = m[2];
  return out;
}

const light = tokens(":root {");
const dark = { ...light, ...tokens(':root[data-theme="dark"]') };

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** [foreground, background] pairs that carry text. */
const TEXT_PAIRS: [string, string][] = [
  ["ink", "bg"],
  ["ink", "surface"],
  ["ink2", "bg"],
  ["ink2", "surface"],
  ["ink3", "bg"],
  ["ink3", "surface"],
  ["accent", "bg"],
  ["accent", "surface"],
  ["alert", "bg"],
  ["alert", "surface"],
  ["on-accent", "accent"],
  ["bg", "ink"], // primary buttons
  ["on-alert", "alert"], // clash badges
  ["ink", "tint-1"],
  ["ink", "tint-2"],
  ["ink", "tint-3"],
  ["ink2", "tint-1"],
];

describe.each([
  ["light", light],
  ["dark", dark],
] as const)("%s theme contrast", (_name, theme) => {
  it.each(TEXT_PAIRS)("%s on %s is at least 4.5:1", (fg, bg) => {
    expect(theme[fg], `missing --${fg}`).toBeDefined();
    expect(theme[bg], `missing --${bg}`).toBeDefined();
    expect(ratio(theme[fg], theme[bg])).toBeGreaterThanOrEqual(4.5);
  });

  it("input borders are at least 3:1 against the page", () => {
    expect(ratio(theme["rule2"], theme["bg"])).toBeGreaterThanOrEqual(3);
  });
});
