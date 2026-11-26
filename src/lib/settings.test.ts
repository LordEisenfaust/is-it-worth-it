import { describe, expect, it } from "vitest";
import { t } from "../i18n";
import { defaultDraft, evaluateSettings, isDefaultDraft, sanitizeDraft, type SettingsDraft } from "./settings";

/** Defaults (Monatsnetto, 12 Gehälter, 40 h, Mo–Fr, 30 Urlaubstage, NRW) plus a net salary. */
const valid: SettingsDraft = { ...defaultDraft, net: "2.500,50" };

/** Hamburg, 40.000 € Jahresnetto, 40 Wochenstunden, Mo–Fr, 30 Urlaubstage. */
const hamburg: SettingsDraft = { ...defaultDraft, mode: "yearly", net: "40000", state: "HH" };

function info(draft: SettingsDraft, year = 2026) {
  const outcome = evaluateSettings(draft, year);
  if (!outcome.ok) throw new Error(`expected usable Gehaltsdaten, got ${JSON.stringify(outcome.errors)}`);
  return outcome.info;
}

function errors(draft: SettingsDraft, year = 2026) {
  const outcome = evaluateSettings(draft, year);
  return outcome.ok ? {} : outcome.errors;
}

describe("evaluateSettings – Netto-Stundenlohn", () => {
  it("berechnet Arbeitstage und Stundenlohn (Hamburg 2026)", () => {
    const result = info(hamburg);
    expect(result.workingDaysPerYear).toBe(261 - 7 - 30);
    expect(result.hoursPerDay).toBe(8);
    expect(result.hourlyWage).toBeCloseTo(40000 / (224 * 8), 6);
  });

  it("liest das Netto im deutschen Format und rechnet mit dem Jahr der Eingabe", () => {
    const result = info(valid);
    expect(result.year).toBe(2026);
    expect(result.annualNet).toBeCloseTo(2500.5 * 12, 6);
    // NRW 2026, Mo–Fr: 261 Wochentage − 8 Feiertage − 30 Urlaubstage.
    expect(result.workingDaysPerYear).toBe(223);
  });

  it("multipliziert das Monatsnetto mit der Anzahl der Gehälter", () => {
    const monthly = info({ ...hamburg, mode: "monthly", net: "2500", monthsPerYear: 13 });
    expect(monthly.annualNet).toBe(32500);
    expect(info({ ...hamburg, net: "32500" }).hourlyWage).toBeCloseTo(monthly.hourlyWage, 9);
  });

  it("verteilt Wochenstunden auf die gewählten Arbeitstage", () => {
    expect(info({ ...hamburg, workdays: [1, 2, 3, 4], weeklyHours: "32" }).hoursPerDay).toBe(8);
    expect(info({ ...hamburg, workdays: [1, 2, 3], weeklyHours: "30" }).hoursPerDay).toBe(10);
  });

  it("liefert die Anzahl der gewählten Arbeitstage pro Woche", () => {
    expect(info({ ...hamburg, workdays: [4, 1, 2], weeklyHours: "24" }).workdaysPerWeek).toBe(3);
    expect(info({ ...hamburg, workdays: [1, 1, 2], weeklyHours: "16" }).workdaysPerWeek).toBe(2);
  });

  it("zählt Feiertage am Wochenende nicht ab", () => {
    // Mo–Fr: 3 der 10 Hamburger Feiertage 2026 liegen am Wochenende.
    expect(info({ ...hamburg, vacationDays: "0" }).workingDaysPerYear).toBe(261 - 7);
  });

  it("zieht Urlaubstage ab", () => {
    const without = info({ ...hamburg, vacationDays: "0" }).workingDaysPerYear;
    expect(without - info({ ...hamburg, vacationDays: "25" }).workingDaysPerYear).toBe(25);
  });
});

describe("evaluateSettings – Feiertagsliste", () => {
  it("führt alle Feiertage auf und markiert die auf freien Tagen (NRW 2026, Mo–Fr)", () => {
    const result = info(valid);
    expect(result.allHolidays).toHaveLength(11);
    expect(result.holidaysOnWorkdays).toHaveLength(8);
    const off = result.allHolidays.filter((h) => !h.onWorkday).map((h) => h.name);
    expect(off).toEqual(["Tag der Deutschen Einheit", "Allerheiligen", "2. Weihnachtstag"]);
  });

  it("zählt einen Wochenendfeiertag mit, wenn der Tag als Arbeitstag gewählt ist", () => {
    const result = info({ ...valid, workdays: [1, 2, 3, 4, 5, 6] });
    expect(result.allHolidays.filter((h) => !h.onWorkday).map((h) => h.name)).toEqual(["Allerheiligen"]);
    expect(result.holidaysOnWorkdays).toHaveLength(10);
  });
});

describe("evaluateSettings – Feldfehler", () => {
  it("verlangt ein Nettogehalt", () => {
    expect(errors(defaultDraft).net).toBeDefined();
    expect(errors({ ...valid, net: "-100" }).net).toBeDefined();
    expect(errors({ ...valid, net: "0" }).net).toBeDefined();
  });

  it("prüft Wochenstunden", () => {
    expect(errors({ ...valid, weeklyHours: "" }).weeklyHours).toBeDefined();
    expect(errors({ ...valid, weeklyHours: "0" }).weeklyHours).toBeDefined();
    expect(errors({ ...valid, weeklyHours: "200" }).weeklyHours).toBeDefined();
    expect(errors({ ...valid, weeklyHours: "100", workdays: [1, 2, 3] }).weeklyHours).toBeDefined();
  });

  it("verlangt mindestens einen Arbeitstag", () => {
    expect(errors({ ...valid, workdays: [] }).workdays).toBeDefined();
  });

  it("akzeptiert nur ganze, nicht negative Urlaubstage", () => {
    expect(evaluateSettings({ ...valid, vacationDays: "0" }, 2026).ok).toBe(true);
    expect(errors({ ...valid, vacationDays: "-1" }).vacationDays).toBeDefined();
    expect(errors({ ...valid, vacationDays: "2,5" }).vacationDays).toBeDefined();
    expect(errors({ ...valid, vacationDays: "" }).vacationDays).toBeDefined();
  });

  it("begrenzt die Monatsgehälter auf 12 bis 16", () => {
    expect(errors({ ...valid, monthsPerYear: 11 }).monthsPerYear).toBeDefined();
    expect(errors({ ...valid, monthsPerYear: 17 }).monthsPerYear).toBeDefined();
    expect(evaluateSettings({ ...valid, monthsPerYear: 16 }, 2026).ok).toBe(true);
  });

  it("meldet am Feld Urlaubstage, wenn kein Arbeitstag im Jahr übrig bleibt", () => {
    // NRW 2026, Mo–Fr: 261 Wochentage − 8 Feiertage = 253 Tage vor dem Urlaub.
    expect(evaluateSettings({ ...valid, vacationDays: "252" }, 2026).ok).toBe(true);
    expect(evaluateSettings({ ...valid, vacationDays: "253" }, 2026)).toEqual({
      ok: false,
      errors: { vacationDays: t.validation.noWorkingDaysLeft },
    });
  });
});

describe("isDefaultDraft", () => {
  it("erkennt die Standardwerte, auch in anderer Reihenfolge der Arbeitstage", () => {
    expect(isDefaultDraft(defaultDraft)).toBe(true);
    expect(isDefaultDraft({ ...defaultDraft, workdays: [1, 2, 4, 5, 3] })).toBe(true);
  });

  it("erkennt eigene Gehaltsdaten", () => {
    expect(isDefaultDraft(valid)).toBe(false);
    expect(isDefaultDraft({ ...defaultDraft, vacationDays: "28" })).toBe(false);
    expect(isDefaultDraft({ ...defaultDraft, workdays: [1, 2, 3, 4] })).toBe(false);
  });
});

describe("sanitizeDraft", () => {
  it("fällt bei Müll auf Standardwerte zurück", () => {
    expect(sanitizeDraft(null)).toEqual(defaultDraft);
    expect(sanitizeDraft("x")).toEqual(defaultDraft);
    expect(sanitizeDraft({ mode: "weekly", state: "XX", workdays: [9], monthsPerYear: 99, net: 5 })).toEqual({
      ...defaultDraft,
      net: "",
    });
  });

  it("übernimmt gültige Felder", () => {
    const stored = { ...valid, mode: "yearly", state: "BY", workdays: [1, 2], monthsPerYear: 14 };
    expect(sanitizeDraft(stored)).toEqual(stored);
  });
});
