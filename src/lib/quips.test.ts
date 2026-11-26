import { describe, expect, it } from "vitest";
import { t } from "../i18n";
import { pickFrom } from "./quips";

function expectDistinctAndFilled(list: readonly string[]) {
  expect(list.length).toBeGreaterThan(0);
  expect(new Set(list).size).toBe(list.length);
  for (const text of list) expect(text.trim()).not.toBe("");
}

describe("Sprüche in der Fußzeile", () => {
  it("gibt es mindestens einen, alle verschieden und keiner leer (die Anzahl ist frei)", () => {
    expectDistinctAndFilled(t.footer.quips);
  });

  it("endet das Präfix mit Claude als Satzsubjekt", () => {
    // The model name itself is configured in one place (MODEL in src/i18n/de.ts), so it is not pinned here.
    expect(t.footer.creditPrefix).toMatch(/^Vibecoded with ♥️ by Claude [^–]+ –$/);
  });
});

describe("Texte im leeren Ergebniskasten", () => {
  it("gibt es mindestens einen, alle verschieden und keiner leer", () => {
    expectDistinctAndFilled(t.calculator.emptyPrompts);
  });
});

describe("pickFrom", () => {
  const list = ["a", "b", "c", "d"];

  it("wählt über den ganzen Bereich aus", () => {
    expect(pickFrom(list, () => 0)).toBe("a");
    expect(pickFrom(list, () => 0.5)).toBe("c");
    expect(pickFrom(list, () => 0.999999)).toBe("d");
  });

  it("bleibt bei Zufallswerten außerhalb von [0, 1) in den Grenzen", () => {
    expect(pickFrom(list, () => 1)).toBe("d");
    expect(pickFrom(list, () => -0.1)).toBe("a");
  });
});
