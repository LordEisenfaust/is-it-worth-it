import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ACCENT, BACKGROUND } from "./brand.ts";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

/** The custom properties of the first `:root` block in styles.css, which is the light theme. */
function lightTheme(): Record<string, string> {
  const css = read("../src/styles.css");
  const block = css.match(/:root\s*\{([^}]*)\}/);
  if (!block) throw new Error("src/styles.css has no :root block");
  return Object.fromEntries([...block[1].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
}

describe("Markenfarben", () => {
  it("sind Orange und Hellgrau", () => {
    // Written out, so a slip in brand.ts itself shows here too.
    expect(ACCENT).toBe("#f26b1d");
    expect(BACKGROUND).toBe("#f4f4f2");
  });

  it("stehen im hellen Theme von styles.css wie in brand.ts", () => {
    const theme = lightTheme();
    expect(theme["--accent"]).toBe(ACCENT);
    expect(theme["--bg"]).toBe(BACKGROUND);
  });

  it("stehen als theme-color in index.html wie in brand.ts", () => {
    const meta = read("../index.html").match(/<meta name="theme-color" content="([^"]+)"/);
    expect(meta?.[1]).toBe(ACCENT);
  });
});
