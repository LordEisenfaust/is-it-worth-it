import { describe, expect, it } from "vitest";
import { t } from "../i18n";
import type { SettingsOutcome } from "./settings";
import { evaluateAmount } from "./verdict";

/**
 * Gehaltsdaten with 10 € per hour and 8 h per working day, so an amount is hours × 10.
 * Only hourlyWage, hoursPerDay and workdaysPerWeek matter for the result; the other fields are placeholders.
 */
function usable(workdaysPerWeek = 5): SettingsOutcome {
  return {
    ok: true,
    info: {
      year: 2026,
      annualNet: 0,
      workingDaysPerYear: 0,
      hoursPerDay: 8,
      workdaysPerWeek,
      hourlyWage: 10,
      holidaysOnWorkdays: [],
      allHolidays: [],
    },
  };
}

/** The verdict for an amount at 10 € per hour, Mo–Fr unless given. */
function verdict(amountText: string, workdaysPerWeek = 5) {
  const result = evaluateAmount(amountText, usable(workdaysPerWeek));
  if (result.kind !== "verdict") throw new Error(`expected a verdict, got ${JSON.stringify(result)}`);
  return result;
}

describe("evaluateAmount – leerer Kasten und Hinweise", () => {
  it("zeigt ohne Betrag einen leeren Kasten", () => {
    expect(evaluateAmount("", usable())).toEqual({ kind: "empty" });
    expect(evaluateAmount("   ", usable())).toEqual({ kind: "empty" });
  });

  it("verlangt zuerst nutzbare Gehaltsdaten, auch wenn schon ein Betrag dasteht", () => {
    const unusable: SettingsOutcome = { ok: false, errors: { net: "fehlt" } };
    const settingsHint = { kind: "hint", text: t.calculator.settingsMissing, cause: "settings" };
    expect(evaluateAmount("", unusable)).toEqual(settingsHint);
    expect(evaluateAmount("600", unusable)).toEqual(settingsHint);
    expect(evaluateAmount("abc", unusable)).toEqual(settingsHint);
  });

  it("meldet einen ungültigen Betrag am Betrag", () => {
    expect(evaluateAmount("abc", usable())).toEqual({
      kind: "hint",
      text: t.validation.amountInvalid,
      cause: "amount",
    });
    expect(evaluateAmount("0", usable())).toEqual({ kind: "hint", text: t.validation.amountZero, cause: "amount" });
  });
});

describe("evaluateAmount – Verdict", () => {
  it("Stufe 1: unter einer Stunde gelassen, ohne graue Zeile", () => {
    expect(evaluateAmount("7,50", usable())).toEqual({
      kind: "verdict",
      level: 1,
      headline: "45 Minuten. Gönn dir.",
      comment: "So schnell verdient, so schnell ausgegeben.",
      greyLine: null,
    });
    // 0,17 € ≈ 1 Minute, 0,01 € ≈ 4 Sekunden.
    expect(verdict("0,17").headline).toBe("1 Minute. Gönn dir.");
    expect(verdict("0,01").headline).toBe("Nicht mal eine Minute. Gönn dir.");
  });

  it("Stufe 2: unter einem Arbeitstag nachdenklich, in Stunden und Minuten, ohne graue Zeile", () => {
    expect(verdict("59")).toEqual({
      kind: "verdict",
      level: 2,
      headline: "5 Stunden und 54 Minuten Arbeit.",
      comment: "Ein Großteil deines Arbeitstags. Brauchst du das wirklich?",
      greyLine: null,
    });
    expect(verdict("20").comment).toBe("Ein ordentliches Stück deines Arbeitstags. Brauchst du das wirklich?");
    expect(verdict("10").headline).toBe("1 Stunde Arbeit.");
  });

  it("Stufe 3: ab einem Arbeitstag frech, mit grauer Zeile aus Betrag und genauer Arbeitszeit", () => {
    expect(verdict("297")).toEqual({
      kind: "verdict",
      level: 3,
      headline: "3 Tage und 6 Stunden Schufterei.",
      comment: "Schlaf lieber noch eine Nacht drüber.",
      greyLine: "297,00 € · ≈ 29 Stunden und 42 Minuten",
    });
    expect(verdict("80").headline).toBe("1 Tag Schufterei.");
  });

  it("Stufe 4: ab einer Arbeitswoche mit Wochen und Tagen", () => {
    expect(verdict("992")).toEqual({
      kind: "verdict",
      level: 4,
      headline: "12 Tage und 3 Stunden Arbeit. Ernsthaft?",
      comment: "2 Wochen und 2 Tage deines Lebens. Das muss es dir wert sein.",
      greyLine: "992,00 € · ≈ 99 Stunden und 12 Minuten",
    });
    expect(verdict("400").comment).toBe("1 Woche deines Lebens. Das muss es dir wert sein.");
  });

  it("Stufe 4: Wochenzeile widerspricht der Überschrift nicht", () => {
    // 84,9 h = 10 Tage und 5 Stunden; früher stand darunter "2 Wochen und 1 Tag" (aufgerundet).
    expect(verdict("849").headline).toBe("10 Tage und 5 Stunden Arbeit. Ernsthaft?");
    expect(verdict("849").comment).toBe("2 Wochen deines Lebens. Das muss es dir wert sein.");
    // Bei einer 4-Tage-Woche zählen 9 ganze Tage als 2 Wochen und 1 Tag (die 0,6 Tage werden nicht mitgerundet).
    expect(verdict("768", 4).headline).toBe("9 Tage und 5 Stunden Arbeit. Ernsthaft?");
    expect(verdict("768", 4).comment).toBe("2 Wochen und 1 Tag deines Lebens. Das muss es dir wert sein.");
  });

  it("richtet die Wochengrenze nach den gewählten Arbeitstagen", () => {
    expect(verdict("320").level).toBe(3);
    expect(verdict("320", 4).level).toBe(4);
  });
});
