import { describe, expect, it } from "vitest";
import { STATE_CODES } from "../lib/holidays";
import { de } from "./de";

/** Collects every string in the catalog (functions are called with sample arguments). */
function allTexts(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (typeof value === "function") return [String(value("X", 1))];
  if (Array.isArray(value)) return value.flatMap(allTexts);
  if (value && typeof value === "object") return Object.values(value).flatMap(allTexts);
  return [];
}

describe("Textkatalog (de)", () => {
  it("enthält keine leeren Texte", () => {
    for (const text of allTexts(de)) expect(text.trim()).not.toBe("");
  });

  it("hat alle sieben Wochentage genau einmal", () => {
    expect(de.weekdays.map((d) => d.value).sort()).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it("hat für jedes Bundesland einen Namen", () => {
    for (const code of STATE_CODES) expect(de.states[code]).toBeTruthy();
  });
});
