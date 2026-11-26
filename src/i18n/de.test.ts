import { describe, expect, it } from "vitest";
import { STATE_CODES } from "../lib/holidays";
import { de } from "./de";

/** Collects every string in the catalog (functions are called with sample arguments). */
function allTexts(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (typeof value === "function") return allTexts(value("X", 1));
  if (Array.isArray(value)) return value.flatMap(allTexts);
  if (value && typeof value === "object") return Object.values(value).flatMap(allTexts);
  return [];
}

function expectDistinctAndFilled(list: readonly string[]) {
  expect(list.length).toBeGreaterThan(0);
  expect(new Set(list).size).toBe(list.length);
  for (const text of list) expect(text.trim()).not.toBe("");
}

describe("Textkatalog (de)", () => {
  it("enthält keine leeren Texte", () => {
    for (const text of allTexts(de)) expect(text.trim()).not.toBe("");
  });

  it("hat alle sieben Wochentage genau einmal", () => {
    expect(de.weekdays.map((d) => d.value).sort()).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it("hat Sprüche für die Fußzeile: mindestens einen, alle verschieden (die Anzahl ist frei)", () => {
    expectDistinctAndFilled(de.footer.quips);
  });

  it("endet das Credit-Präfix mit Claude als Satzsubjekt", () => {
    // The model name itself is configured in one place (MODEL in de.ts), so it is not pinned here.
    expect(de.footer.creditPrefix).toMatch(/^Vibecoded with ♥️ by Claude [^–]+ –$/);
  });

  it("hat Texte für den leeren Ergebniskasten: mindestens einen, alle verschieden", () => {
    expectDistinctAndFilled(de.calculator.emptyPrompts);
  });

  it("setzt die Versionszeile um den Commit-Link herum zusammen", () => {
    expect(de.footer.versionLine("0.4.14")).toEqual({ before: "Version 0.4.14 (", after: ") ·" });
  });

  it("hat für jedes Bundesland einen Namen", () => {
    for (const code of STATE_CODES) expect(de.states[code]).toBeTruthy();
  });
});
