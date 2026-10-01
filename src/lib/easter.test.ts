import { describe, expect, it } from "vitest";
import { toIso } from "./dates";
import { easterSunday } from "./easter";

describe("easterSunday", () => {
  it.each([
    [2000, "2000-04-23"],
    [2019, "2019-04-21"],
    [2023, "2023-04-09"],
    [2024, "2024-03-31"],
    [2025, "2025-04-20"],
    [2026, "2026-04-05"],
    [2027, "2027-03-28"],
    [2038, "2038-04-25"],
  ])("Ostersonntag %i ist am %s", (year, expected) => {
    expect(toIso(easterSunday(year))).toBe(expected);
  });

  it("fällt immer auf einen Sonntag", () => {
    for (let year = 1990; year <= 2060; year++) {
      expect(easterSunday(year).getUTCDay()).toBe(0);
    }
  });
});
