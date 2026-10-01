import { describe, expect, it } from "vitest";
import { defaultDraft, sanitizeDraft, validateDraft, type SettingsDraft } from "./settings";

const valid: SettingsDraft = { ...defaultDraft, net: "2.500,50" };

describe("validateDraft", () => {
  it("liefert validierte Einstellungen", () => {
    const { settings, errors } = validateDraft(valid);
    expect(errors).toEqual({});
    expect(settings).toMatchObject({ net: 2500.5, weeklyHours: 40, vacationDays: 30, state: "NW" });
    expect(settings?.workdays).toEqual([1, 2, 3, 4, 5]);
  });

  it("verlangt ein Nettogehalt", () => {
    expect(validateDraft(defaultDraft).errors.net).toBeDefined();
    expect(validateDraft({ ...valid, net: "-100" }).errors.net).toBeDefined();
    expect(validateDraft({ ...valid, net: "0" }).errors.net).toBeDefined();
  });

  it("prüft Wochenstunden", () => {
    expect(validateDraft({ ...valid, weeklyHours: "" }).errors.weeklyHours).toBeDefined();
    expect(validateDraft({ ...valid, weeklyHours: "0" }).errors.weeklyHours).toBeDefined();
    expect(validateDraft({ ...valid, weeklyHours: "200" }).errors.weeklyHours).toBeDefined();
    expect(validateDraft({ ...valid, weeklyHours: "100", workdays: [1, 2, 3] }).errors.weeklyHours).toBeDefined();
  });

  it("verlangt mindestens einen Arbeitstag", () => {
    expect(validateDraft({ ...valid, workdays: [] }).errors.workdays).toBeDefined();
  });

  it("akzeptiert nur ganze, nicht negative Urlaubstage", () => {
    expect(validateDraft({ ...valid, vacationDays: "0" }).settings).not.toBeNull();
    expect(validateDraft({ ...valid, vacationDays: "-1" }).errors.vacationDays).toBeDefined();
    expect(validateDraft({ ...valid, vacationDays: "2,5" }).errors.vacationDays).toBeDefined();
    expect(validateDraft({ ...valid, vacationDays: "" }).errors.vacationDays).toBeDefined();
  });

  it("begrenzt die Monatsgehälter auf 12 bis 16", () => {
    expect(validateDraft({ ...valid, monthsPerYear: 11 }).errors.monthsPerYear).toBeDefined();
    expect(validateDraft({ ...valid, monthsPerYear: 17 }).errors.monthsPerYear).toBeDefined();
    expect(validateDraft({ ...valid, monthsPerYear: 16 }).settings).not.toBeNull();
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
