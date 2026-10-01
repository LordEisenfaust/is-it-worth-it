import { describe, expect, it } from "vitest";
import { CREDIT_PREFIX, pickQuip, QUIPS } from "./quips";

describe("Sprüche in der Fußzeile", () => {
  it("enthält 40 verschiedene, nicht leere Sprüche", () => {
    expect(QUIPS).toHaveLength(40);
    expect(new Set(QUIPS).size).toBe(40);
    for (const quip of QUIPS) expect(quip.trim()).not.toBe("");
  });

  it("endet das Präfix mit Claude als Satzsubjekt", () => {
    expect(CREDIT_PREFIX).toBe("Vibecoded with ♥️ by Claude Opus 5.5 –");
  });

  it("wählt über den ganzen Bereich aus und bleibt in den Grenzen", () => {
    expect(pickQuip(() => 0)).toBe(QUIPS[0]);
    expect(pickQuip(() => 0.999999)).toBe(QUIPS[39]);
    expect(pickQuip(() => 0.5)).toBe(QUIPS[20]);
    expect(pickQuip(() => 1)).toBe(QUIPS[39]);
    expect(pickQuip(() => -0.1)).toBe(QUIPS[0]);
  });
});
