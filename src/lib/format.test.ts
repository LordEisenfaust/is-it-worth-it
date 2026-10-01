import { describe, expect, it } from "vitest";
import { formatHoursMinutes, formatWeeksDays, splitWorkTime } from "./format";

describe("splitWorkTime (8 h pro Tag)", () => {
  const text = (hours: number) => splitWorkTime(hours, 8)?.text;

  it("zeigt nur Minuten unter einer Stunde", () => {
    expect(splitWorkTime(0.75, 8)).toEqual({ unit: "minutes", text: "45 Minuten", days: 0 });
    expect(text(1 / 60)).toBe("1 Minute");
    expect(text(0)).toBe("0 Minuten");
  });

  it("zerlegt Stunden in Stunden und Minuten", () => {
    expect(splitWorkTime(3.8, 8)).toEqual({ unit: "hours", text: "3 Stunden und 48 Minuten", days: 0 });
    expect(text(1)).toBe("1 Stunde");
    expect(text(2.5)).toBe("2 Stunden und 30 Minuten");
    expect(text(1 + 1 / 60)).toBe("1 Stunde und 1 Minute");
  });

  it("zerlegt Arbeitstage in Tage und Stunden", () => {
    expect(splitWorkTime(6.1 * 8, 8)).toEqual({ unit: "days", text: "6 Tage und 1 Stunde", days: 6 });
    expect(text(8)).toBe("1 Tag");
    expect(text(29.7)).toBe("3 Tage und 6 Stunden");
    expect(text(10)).toBe("1 Tag und 2 Stunden");
  });

  it("überträgt Rundungen in die nächstgrößere Einheit", () => {
    expect(text(59.6 / 60)).toBe("1 Stunde");
    expect(text(31.9)).toBe("4 Tage");
    expect(splitWorkTime(31.9, 8)?.days).toBe(4);
  });

  it("kommt mit krummen Stunden pro Tag zurecht (38,5 h an 5 Tagen)", () => {
    expect(splitWorkTime(7.6, 7.7)?.text).toBe("7 Stunden und 36 Minuten");
    expect(splitWorkTime(7.7 * 3 + 2, 7.7)?.text).toBe("3 Tage und 2 Stunden");
  });

  it("liefert null bei ungültigen Werten", () => {
    expect(splitWorkTime(NaN, 8)).toBeNull();
    expect(splitWorkTime(-1, 8)).toBeNull();
    expect(splitWorkTime(5, 0)).toBeNull();
  });
});

describe("formatHoursMinutes", () => {
  it("zeigt Stunden und Minuten", () => {
    expect(formatHoursMinutes(29.7)).toBe("29 Stunden und 42 Minuten");
    expect(formatHoursMinutes(40)).toBe("40 Stunden");
    expect(formatHoursMinutes(0.5)).toBe("30 Minuten");
  });
});

describe("formatWeeksDays", () => {
  it("zeigt Wochen und Tage", () => {
    expect(formatWeeksDays(12.4, 5)).toBe("2 Wochen und 2 Tage");
    expect(formatWeeksDays(5, 5)).toBe("1 Woche");
    expect(formatWeeksDays(6, 5)).toBe("1 Woche und 1 Tag");
    expect(formatWeeksDays(9.6, 5)).toBe("2 Wochen");
    expect(formatWeeksDays(8, 4)).toBe("2 Wochen");
  });
});
