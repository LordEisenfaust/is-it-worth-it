import { describe, expect, it } from "vitest";
import { computeWage, hoursForAmount } from "./calc";
import type { Settings } from "./settings";

const base: Settings = {
  mode: "yearly",
  net: 40000,
  monthsPerYear: 12,
  weeklyHours: 40,
  workdays: [1, 2, 3, 4, 5],
  vacationDays: 30,
  state: "HH",
};

function wage(overrides: Partial<Settings> = {}, year = 2026) {
  const result = computeWage({ ...base, ...overrides }, year);
  if (!result.ok) throw new Error(result.error);
  return result.info;
}

describe("computeWage", () => {
  it("berechnet Arbeitstage und Stundenlohn (Hamburg 2026)", () => {
    const info = wage();
    expect(info.workingDaysPerYear).toBe(261 - 7 - 30);
    expect(info.hoursPerDay).toBe(8);
    expect(info.hourlyWage).toBeCloseTo(40000 / (224 * 8), 6);
  });

  it("multipliziert das Monatsnetto mit der Anzahl der Gehälter", () => {
    const info = wage({ mode: "monthly", net: 2500, monthsPerYear: 13 });
    expect(info.annualNet).toBe(32500);
    expect(wage({ mode: "yearly", net: 32500 }).hourlyWage).toBeCloseTo(info.hourlyWage, 9);
  });

  it("verteilt Wochenstunden auf die gewählten Arbeitstage", () => {
    expect(wage({ workdays: [1, 2, 3, 4], weeklyHours: 32 }).hoursPerDay).toBe(8);
    expect(wage({ workdays: [1, 2, 3], weeklyHours: 30 }).hoursPerDay).toBe(10);
  });

  it("zählt Feiertage am Wochenende nicht ab", () => {
    // Mo–Fr: 3 der 10 Hamburger Feiertage 2026 liegen am Wochenende.
    expect(wage({ vacationDays: 0 }).workingDaysPerYear).toBe(261 - 7);
  });

  it("zieht Urlaubstage ab", () => {
    expect(wage({ vacationDays: 0 }).workingDaysPerYear - wage({ vacationDays: 25 }).workingDaysPerYear).toBe(25);
  });

  it("meldet einen Fehler statt durch null zu teilen", () => {
    expect(computeWage({ ...base, vacationDays: 366 }, 2026).ok).toBe(false);
    expect(computeWage({ ...base, workdays: [] }, 2026).ok).toBe(false);
    expect(computeWage({ ...base, net: 0 }, 2026).ok).toBe(false);
  });
});

describe("hoursForAmount", () => {
  it("teilt den Betrag durch den Stundenlohn", () => {
    expect(hoursForAmount(600, 25)).toBe(24);
  });

  it("liefert NaN bei ungültigem Stundenlohn", () => {
    expect(hoursForAmount(600, 0)).toBeNaN();
    expect(hoursForAmount(600, -5)).toBeNaN();
    expect(hoursForAmount(600, Infinity)).toBeNaN();
  });
});

describe("computeWage – Feiertagsliste", () => {
  it("führt alle Feiertage auf und markiert die auf freien Tagen (NRW 2026, Mo–Fr)", () => {
    const info = wage({ state: "NW" });
    expect(info.allHolidays).toHaveLength(11);
    expect(info.holidaysOnWorkdays).toHaveLength(8);
    const off = info.allHolidays.filter((h) => !h.onWorkday).map((h) => h.name);
    expect(off).toEqual(["Tag der Deutschen Einheit", "Allerheiligen", "2. Weihnachtstag"]);
  });

  it("zählt einen Wochenendfeiertag mit, wenn der Tag als Arbeitstag gewählt ist", () => {
    const info = wage({ state: "NW", workdays: [1, 2, 3, 4, 5, 6] });
    expect(info.allHolidays.filter((h) => !h.onWorkday).map((h) => h.name)).toEqual(["Allerheiligen"]);
    expect(info.holidaysOnWorkdays).toHaveLength(10);
  });
});
