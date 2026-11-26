import { describe, expect, it } from "vitest";
import { hoursForAmount } from "./calc";

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
