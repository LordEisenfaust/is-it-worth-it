import { describe, expect, it } from "vitest";
import { formatWorkTime } from "./format";

describe("formatWorkTime (8 h pro Tag)", () => {
  it("zeigt Minuten unter einer Stunde", () => {
    expect(formatWorkTime(0.5, 8)).toMatchObject({ unit: "minutes", primary: "ca. 30 Minuten" });
    expect(formatWorkTime(1 / 60, 8).primary).toBe("ca. 1 Minute");
    expect(formatWorkTime(0, 8).primary).toBe("ca. 0 Minuten");
  });

  it("rundet 59,6 Minuten nicht auf 60 Minuten", () => {
    expect(formatWorkTime(59.6 / 60, 8).unit).toBe("hours");
  });

  it("zeigt Stunden unter einem Arbeitstag", () => {
    const r = formatWorkTime(2.5, 8);
    expect(r.unit).toBe("hours");
    expect(r.primary).toBe("ca. 2,5 Arbeitsstunden");
    expect(r.secondary).toBe("≈ 0,3 Arbeitstage");
  });

  it("zeigt Arbeitstage ab einem vollen Tag", () => {
    const r = formatWorkTime(32, 8);
    expect(r.unit).toBe("days");
    expect(r.primary).toBe("ca. 4 Arbeitstage");
    expect(r.secondary).toBe("≈ 32 Arbeitsstunden");
  });

  it("nutzt Singular und deutsches Dezimalkomma", () => {
    expect(formatWorkTime(8, 8).primary).toBe("ca. 1 Arbeitstag");
    expect(formatWorkTime(34.4, 8).primary).toBe("ca. 4,3 Arbeitstage");
  });

  it("gibt bei ungültigen Werten einen Platzhalter zurück", () => {
    expect(formatWorkTime(NaN, 8).primary).toBe("–");
    expect(formatWorkTime(5, 0).primary).toBe("–");
  });
});
