import { describe, expect, it } from "vitest";
import { t } from "../i18n";
import {
  ALL_INPUTS,
  defaultDraft,
  evaluateSettings,
  isDefaultDraft,
  sanitizeDraft,
  visibleErrors,
  type SettingsDraft,
  type SettingsInput,
} from "./settings";

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

  it("zieht einen Tag mit zwei Feiertagen nur einmal ab (1. Mai = Christi Himmelfahrt 2008)", () => {
    // NRW 2008, Mo–Fr: 262 Wochentage; 10 Feiertage auf Arbeitstagen, davon zwei am Do., 1. Mai.
    const result = info({ ...valid, vacationDays: "0" }, 2008);
    expect(result.holidaysOnWorkdays).toHaveLength(10);
    expect(result.workingDaysPerYear).toBe(262 - 9);
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
    expect(evaluateSettings({ ...valid, weeklyHours: "168", workdays: [0, 1, 2, 3, 4, 5, 6] }, 2026).ok).toBe(true);
    expect(errors({ ...valid, weeklyHours: "168,5" }).weeklyHours).toEqual({
      text: t.validation.weeklyHoursTooMany,
      sources: ["weeklyHours"],
    });
  });

  it("verlangt mindestens eine Stunde pro Arbeitstag", () => {
    // 3 Wochenstunden an Mo–Fr wären 36 Minuten am Tag; dann wären 45 Minuten Arbeit mehr als ein Arbeitstag.
    // Shown at the weekly hours, but the chosen workdays are just as much its source.
    const tooFew = { text: t.validation.hoursPerDayTooFew, sources: ["weeklyHours", "workdays"] };
    expect(errors({ ...valid, weeklyHours: "3" }).weeklyHours).toEqual(tooFew);
    expect(errors({ ...valid, weeklyHours: "4,9" }).weeklyHours).toEqual(tooFew);
    expect(info({ ...valid, weeklyHours: "5" }).hoursPerDay).toBe(1);
    expect(info({ ...valid, weeklyHours: "1", workdays: [3] }).hoursPerDay).toBe(1);
  });

  it("begrenzt das Netto nach oben", () => {
    expect(evaluateSettings({ ...valid, net: "1.000.000.000" }, 2026).ok).toBe(true);
    expect(errors({ ...valid, net: "1.000.000.001" }).net).toEqual({
      text: t.validation.netTooLarge(t.settings.monthly),
      sources: ["net"],
    });
  });

  it("verlangt mindestens einen Arbeitstag", () => {
    expect(errors({ ...valid, workdays: [] }).workdays).toBeDefined();
  });

  it("akzeptiert nur ganze, nicht negative Urlaubstage", () => {
    expect(evaluateSettings({ ...valid, vacationDays: "0" }, 2026).ok).toBe(true);
    expect(errors({ ...valid, vacationDays: "-1" }).vacationDays).toBeDefined();
    expect(errors({ ...valid, vacationDays: "2,5" }).vacationDays).toBeDefined();
    expect(errors({ ...valid, vacationDays: "" }).vacationDays).toBeDefined();
    // 366 is a valid entry but leaves no working day; 367 is rejected as such.
    expect(errors({ ...valid, vacationDays: "366" }).vacationDays?.text).toBe(t.validation.noWorkingDaysLeft);
    expect(errors({ ...valid, vacationDays: "367" }).vacationDays).toEqual({
      text: t.validation.vacationTooMany,
      sources: ["vacationDays"],
    });
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
      errors: {
        vacationDays: { text: t.validation.noWorkingDaysLeft, sources: ["workdays", "vacationDays", "state"] },
      },
    });
  });
});

describe("visibleErrors", () => {
  const visible = (draft: SettingsDraft, touched: SettingsInput[]) =>
    visibleErrors(evaluateSettings(draft, 2026), new Set(touched));

  it("zeigt zu viele Stunden pro Tag an den Wochenstunden, sobald die Arbeitstage berührt sind", () => {
    // 40 Wochenstunden an einem einzigen Tag; die Wochenstunden selbst wurden nie berührt.
    expect(visible({ ...valid, workdays: [1] }, ["workdays"])).toEqual({
      weeklyHours: t.validation.hoursPerDayTooMany,
    });
  });

  it("zeigt „kein Arbeitstag übrig“ an den Urlaubstagen, sobald das Bundesland berührt ist", () => {
    // 252 Urlaubstage: in NRW 2026 bleibt ein Arbeitstag, in Bayern (ein Feiertag mehr auf Mo–Fr) keiner.
    const nrw = { ...valid, vacationDays: "252" };
    expect(visible(nrw, ["state"])).toEqual({});
    expect(visible({ ...nrw, state: "BY" }, ["state"])).toEqual({ vacationDays: t.validation.noWorkingDaysLeft });
  });

  it("zeigt einen Fehler eines einzelnen Felds erst, wenn dieses Feld berührt ist", () => {
    const draft = { ...valid, weeklyHours: "viel" };
    expect(visible(draft, ["workdays", "vacationDays", "state"])).toEqual({});
    expect(visible(draft, ["weeklyHours"])).toEqual({ weeklyHours: t.validation.weeklyHoursInvalid });
  });

  it("zeigt alles, wenn alles berührt ist, und nichts, wenn nichts berührt ist", () => {
    const draft = { ...defaultDraft, weeklyHours: "", workdays: [], vacationDays: "-1" };
    expect(visible(draft, [...ALL_INPUTS])).toEqual({
      net: t.validation.netMissing(t.settings.monthly),
      weeklyHours: t.validation.weeklyHoursMissing,
      workdays: t.validation.workdaysMissing,
      vacationDays: t.validation.vacationInvalid,
    });
    expect(visible(draft, [])).toEqual({});
  });

  it("zeigt bei nutzbaren Gehaltsdaten keine Fehler", () => {
    expect(visible(valid, [...ALL_INPUTS])).toEqual({});
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
