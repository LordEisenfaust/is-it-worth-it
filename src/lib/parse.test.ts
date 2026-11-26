import { describe, expect, it } from "vitest";
import { t } from "../i18n";
import { parseAmount, parseNumber } from "./parse";

describe("parseNumber", () => {
  it.each([
    ["600", 600],
    ["1234,56", 1234.56],
    ["1.234,56", 1234.56],
    ["1.234.567", 1234567],
    ["12.5", 12.5],
    [" 99,90 € ", 99.9],
    ["€ 50", 50],
    ["€50", 50],
    ["0,5", 0.5],
    ["1.500", 1500],
  ])("parst %j", (input, expected) => {
    expect(parseNumber(input)).toBeCloseTo(expected, 6);
  });

  it.each(["", "  ", "abc", "-5", "1,2,3", "12.34.5", "1e5", "NaN", ",5", "€", "€50€", "50 EUR"])("lehnt %j ab", (input) => {
    expect(parseNumber(input)).toBeNaN();
  });
});

describe("parseAmount", () => {
  it("akzeptiert positive Beträge", () => {
    expect(parseAmount("600")).toEqual({ ok: true, amount: 600 });
  });

  it("lehnt leere, negative und Nullbeträge ab", () => {
    expect(parseAmount("").ok).toBe(false);
    expect(parseAmount("-10").ok).toBe(false);
    expect(parseAmount("0").ok).toBe(false);
    expect(parseAmount("zehn").ok).toBe(false);
  });

  it("begrenzt den Betrag nach oben", () => {
    expect(parseAmount("1.000.000.000.000")).toEqual({ ok: true, amount: 1e12 });
    expect(parseAmount("1.000.000.000.001")).toEqual({ ok: false, error: t.validation.amountTooLarge });
  });
});
