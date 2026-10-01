import { describe, expect, it } from "vitest";
import { countWeekdaysInYear, toIso } from "./dates";
import { getHolidays, getHolidaysOnWorkdays, STATE_CODES, type StateCode } from "./holidays";

const MON_FRI = [1, 2, 3, 4, 5];

describe("getHolidays 2026", () => {
  const expectedCounts: Record<StateCode, number> = {
    BW: 12,
    BY: 13,
    BE: 10,
    BB: 12,
    HB: 10,
    HH: 10,
    HE: 10,
    MV: 11,
    NI: 10,
    NW: 11,
    RP: 11,
    SL: 12,
    SN: 11,
    ST: 11,
    SH: 10,
    TH: 11,
  };

  it.each(STATE_CODES)("Feiertagsanzahl %s", (state) => {
    expect(getHolidays(2026, state)).toHaveLength(expectedCounts[state]);
  });

  it("berechnet bewegliche Feiertage 2026 aus Ostern", () => {
    const byName = new Map(getHolidays(2026, "NW").map((h) => [h.name, toIso(h.date)]));
    expect(byName.get("Karfreitag")).toBe("2026-04-03");
    expect(byName.get("Ostermontag")).toBe("2026-04-06");
    expect(byName.get("Christi Himmelfahrt")).toBe("2026-05-14");
    expect(byName.get("Pfingstmontag")).toBe("2026-05-25");
    expect(byName.get("Fronleichnam")).toBe("2026-06-04");
  });

  it("kennt Landessonderfälle", () => {
    const names = (s: StateCode) => getHolidays(2026, s).map((h) => h.name);
    expect(names("BY")).toContain("Mariä Himmelfahrt");
    expect(names("NW")).not.toContain("Mariä Himmelfahrt");
    expect(names("SN")).toContain("Buß- und Bettag");
    expect(names("BE")).toContain("Internationaler Frauentag");
    expect(names("HH")).not.toContain("Fronleichnam");
  });

  it("legt den Buß- und Bettag auf den Mittwoch vor dem 23. November", () => {
    const day = (year: number) => toIso(getHolidays(year, "SN").find((h) => h.name === "Buß- und Bettag")!.date);
    expect(day(2026)).toBe("2026-11-18");
    expect(day(2025)).toBe("2025-11-19");
    expect(day(2024)).toBe("2024-11-20");
  });

  it("ist nach Datum sortiert", () => {
    const times = getHolidays(2026, "BY").map((h) => h.date.getTime());
    expect(times).toEqual([...times].sort((a, b) => a - b));
  });
});

describe("neu eingeführte Feiertage", () => {
  it("gelten erst ab dem Einführungsjahr", () => {
    const has = (year: number, state: StateCode, name: string) =>
      getHolidays(year, state).some((h) => h.name === name);
    expect(has(2018, "BE", "Internationaler Frauentag")).toBe(false);
    expect(has(2019, "BE", "Internationaler Frauentag")).toBe(true);
    expect(has(2022, "MV", "Internationaler Frauentag")).toBe(false);
    expect(has(2023, "MV", "Internationaler Frauentag")).toBe(true);
    expect(has(2017, "NI", "Reformationstag")).toBe(false);
    expect(has(2018, "NI", "Reformationstag")).toBe(true);
  });
});

describe("getHolidaysOnWorkdays", () => {
  it("zählt Feiertage am Wochenende nicht", () => {
    // Hamburg 2026: Einheit (Sa), Reformationstag (Sa) und 2. Weihnachtstag (Sa) fallen aufs Wochenende.
    expect(getHolidays(2026, "HH")).toHaveLength(10);
    const onWorkdays = getHolidaysOnWorkdays(2026, "HH", MON_FRI);
    expect(onWorkdays).toHaveLength(7);
    expect(onWorkdays.map((h) => h.name)).not.toContain("Tag der Deutschen Einheit");
  });

  it("zählt Wochenendfeiertage, wenn der Tag als Arbeitstag gewählt ist", () => {
    const withSaturday = getHolidaysOnWorkdays(2026, "HH", [...MON_FRI, 6]);
    expect(withSaturday.map((h) => h.name)).toContain("Tag der Deutschen Einheit");
    expect(withSaturday).toHaveLength(10);
  });
});

describe("countWeekdaysInYear", () => {
  it("zählt Mo–Fr in Normal- und Schaltjahren", () => {
    expect(countWeekdaysInYear(2026, MON_FRI)).toBe(261);
    expect(countWeekdaysInYear(2024, MON_FRI)).toBe(262);
  });

  it("zählt alle Tage und einzelne Wochentage", () => {
    expect(countWeekdaysInYear(2026, [0, 1, 2, 3, 4, 5, 6])).toBe(365);
    expect(countWeekdaysInYear(2024, [0, 1, 2, 3, 4, 5, 6])).toBe(366);
    expect(countWeekdaysInYear(2026, [0])).toBe(52);
  });
});
