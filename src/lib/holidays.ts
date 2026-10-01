import { t } from "../i18n";
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

/** Display names of the states, from the text catalog. */
export const STATE_NAMES: Record<StateCode, string> = t.states;

export function isStateCode(value: unknown): value is StateCode {
  return typeof value === "string" && (STATE_CODES as readonly string[]).includes(value);
}

export interface Holiday {
  name: string;
  date: Date;
}

type HolidayId = keyof typeof t.holidays;

interface HolidayRule {
  id: HolidayId;
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
  { id: "newYear", states: "all", date: fixed(1, 1) },
  { id: "epiphany", states: ["BW", "BY", "ST"], date: fixed(1, 6) },
  { id: "womensDay", states: ["BE"], since: 2019, date: fixed(3, 8) },
  { id: "womensDay", states: ["MV"], since: 2023, date: fixed(3, 8) },
  { id: "goodFriday", states: "all", date: afterEaster(-2) },
  { id: "easterSunday", states: ["BB"], date: afterEaster(0) },
  { id: "easterMonday", states: "all", date: afterEaster(1) },
  { id: "labourDay", states: "all", date: fixed(5, 1) },
  { id: "ascension", states: "all", date: afterEaster(39) },
  { id: "whitSunday", states: ["BB"], date: afterEaster(49) },
  { id: "whitMonday", states: "all", date: afterEaster(50) },
  { id: "corpusChristi", states: ["BW", "BY", "HE", "NW", "RP", "SL"], date: afterEaster(60) },
  { id: "assumption", states: ["BY", "SL"], date: fixed(8, 15) },
  { id: "childrensDay", states: ["TH"], since: 2019, date: fixed(9, 20) },
  { id: "unityDay", states: "all", date: fixed(10, 3) },
  { id: "reformationDay", states: ["BB", "MV", "SN", "ST", "TH"], date: fixed(10, 31) },
  { id: "reformationDay", states: ["HB", "HH", "NI", "SH"], since: 2018, date: fixed(10, 31) },
  { id: "allSaints", states: ["BW", "BY", "NW", "RP", "SL"], date: fixed(11, 1) },
  { id: "repentanceDay", states: ["SN"], date: bussUndBettag },
  { id: "christmasDay", states: "all", date: fixed(12, 25) },
  { id: "boxingDay", states: "all", date: fixed(12, 26) },
];

/** All statutory holidays of a state in a year, sorted by date (weekends included). */
export function getHolidays(year: number, state: StateCode): Holiday[] {
  const easter = easterSunday(year);
  return RULES.filter(
    (rule) =>
      (rule.states === "all" || rule.states.includes(state)) &&
      (rule.since === undefined || year >= rule.since),
  )
    .map((rule) => ({ name: t.holidays[rule.id], date: rule.date(year, easter) }))
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
