import { addDays, utcDate } from "./dates";
import { easterSunday } from "./easter";

export const STATE_CODES = [
  "BW",
  "BY",
  "BE",
  "BB",
  "HB",
  "HH",
  "HE",
  "MV",
  "NI",
  "NW",
  "RP",
  "SL",
  "SN",
  "ST",
  "SH",
  "TH",
] as const;

export type StateCode = (typeof STATE_CODES)[number];

export const STATE_NAMES: Record<StateCode, string> = {
  BW: "Baden-Württemberg",
  BY: "Bayern",
  BE: "Berlin",
  BB: "Brandenburg",
  HB: "Bremen",
  HH: "Hamburg",
  HE: "Hessen",
  MV: "Mecklenburg-Vorpommern",
  NI: "Niedersachsen",
  NW: "Nordrhein-Westfalen",
  RP: "Rheinland-Pfalz",
  SL: "Saarland",
  SN: "Sachsen",
  ST: "Sachsen-Anhalt",
  SH: "Schleswig-Holstein",
  TH: "Thüringen",
};

export function isStateCode(value: unknown): value is StateCode {
  return typeof value === "string" && (STATE_CODES as readonly string[]).includes(value);
}

export interface Holiday {
  name: string;
  date: Date;
}

interface HolidayRule {
  name: string;
  states: readonly StateCode[] | "all";
  /** First year in which the holiday applies (for recently introduced holidays). */
  since?: number;
  date: (year: number, easter: Date) => Date;
}

const fixed = (month: number, day: number) => (year: number) => utcDate(year, month, day);
const afterEaster = (days: number) => (_year: number, easter: Date) => addDays(easter, days);

/** Wednesday before 23 November (strictly before). */
function bussUndBettag(year: number): Date {
  let date = utcDate(year, 11, 22);
  while (date.getUTCDay() !== 3) date = addDays(date, -1);
  return date;
}

// Only statutory holidays that apply state-wide. Holidays that apply to parts of a state
// (Fronleichnam/Mariä Himmelfahrt in Sachsen and Thüringen, Augsburger Friedensfest, ...) are left out.
// Mariä Himmelfahrt in Bayern is included although it applies only to mostly Catholic municipalities,
// because that is the usual convention. One-off holidays (Berlin: 8 May in 2020 and 2025) are not modelled.
const RULES: readonly HolidayRule[] = [
  { name: "Neujahr", states: "all", date: fixed(1, 1) },
  { name: "Heilige Drei Könige", states: ["BW", "BY", "ST"], date: fixed(1, 6) },
  { name: "Internationaler Frauentag", states: ["BE"], since: 2019, date: fixed(3, 8) },
  { name: "Internationaler Frauentag", states: ["MV"], since: 2023, date: fixed(3, 8) },
  { name: "Karfreitag", states: "all", date: afterEaster(-2) },
  { name: "Ostersonntag", states: ["BB"], date: afterEaster(0) },
  { name: "Ostermontag", states: "all", date: afterEaster(1) },
  { name: "Tag der Arbeit", states: "all", date: fixed(5, 1) },
  { name: "Christi Himmelfahrt", states: "all", date: afterEaster(39) },
  { name: "Pfingstsonntag", states: ["BB"], date: afterEaster(49) },
  { name: "Pfingstmontag", states: "all", date: afterEaster(50) },
  { name: "Fronleichnam", states: ["BW", "BY", "HE", "NW", "RP", "SL"], date: afterEaster(60) },
  { name: "Mariä Himmelfahrt", states: ["BY", "SL"], date: fixed(8, 15) },
  { name: "Weltkindertag", states: ["TH"], since: 2019, date: fixed(9, 20) },
  { name: "Tag der Deutschen Einheit", states: "all", date: fixed(10, 3) },
  { name: "Reformationstag", states: ["BB", "MV", "SN", "ST", "TH"], date: fixed(10, 31) },
  { name: "Reformationstag", states: ["HB", "HH", "NI", "SH"], since: 2018, date: fixed(10, 31) },
  { name: "Allerheiligen", states: ["BW", "BY", "NW", "RP", "SL"], date: fixed(11, 1) },
  { name: "Buß- und Bettag", states: ["SN"], date: bussUndBettag },
  { name: "1. Weihnachtstag", states: "all", date: fixed(12, 25) },
  { name: "2. Weihnachtstag", states: "all", date: fixed(12, 26) },
];

/** All statutory holidays of a state in a year, sorted by date (weekends included). */
export function getHolidays(year: number, state: StateCode): Holiday[] {
  const easter = easterSunday(year);
  return RULES.filter(
    (rule) =>
      (rule.states === "all" || rule.states.includes(state)) &&
      (rule.since === undefined || year >= rule.since),
  )
    .map((rule) => ({ name: rule.name, date: rule.date(year, easter) }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

/** Holidays that fall on one of the given weekdays (0 = Sunday ... 6 = Saturday). */
export function getHolidaysOnWorkdays(
  year: number,
  state: StateCode,
  workdays: readonly number[],
): Holiday[] {
  const wanted = new Set(workdays);
  return getHolidays(year, state).filter((h) => wanted.has(h.date.getUTCDay()));
}
