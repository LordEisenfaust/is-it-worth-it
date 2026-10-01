import { describe, expect, it } from "vitest";
import { CREDIT_PREFIX, EMPTY_PROMPTS, pickFrom, pickQuip, QUIPS } from "./quips";

describe("Sprüche in der Fußzeile", () => {
  it("enthält 40 verschiedene, nicht leere Sprüche", () => {
    expect(QUIPS).toHaveLength(40);
    expect(new Set(QUIPS).size).toBe(40);
    for (const quip of QUIPS) expect(quip.trim()).not.toBe("");
  });

  it("endet das Präfix mit Claude als Satzsubjekt", () => {
    // The model name itself is configured in one place (MODEL in src/i18n/de.ts), so it is not pinned here.
    expect(CREDIT_PREFIX).toMatch(/^Vibecoded with ♥️ by Claude [^–]+ –$/);
  });

  it("wählt über den ganzen Bereich aus und bleibt in den Grenzen", () => {
    expect(pickQuip(() => 0)).toBe(QUIPS[0]);
    expect(pickQuip(() => 0.999999)).toBe(QUIPS[39]);
    expect(pickQuip(() => 0.5)).toBe(QUIPS[20]);
    expect(pickQuip(() => 1)).toBe(QUIPS[39]);
    expect(pickQuip(() => -0.1)).toBe(QUIPS[0]);
  });
});

describe("Texte im leeren Ergebniskasten", () => {
  it("enthält sechs verschiedene Texte", () => {
    expect(EMPTY_PROMPTS).toHaveLength(6);
    expect(new Set(EMPTY_PROMPTS).size).toBe(6);
  });

  it("wählt über pickFrom aus der Liste", () => {
    expect(pickFrom(EMPTY_PROMPTS, () => 0)).toBe(EMPTY_PROMPTS[0]);
    expect(pickFrom(EMPTY_PROMPTS, () => 0.99)).toBe(EMPTY_PROMPTS[5]);
  });
});
