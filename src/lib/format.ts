export type TimeUnit = "minutes" | "hours" | "days";

const number = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1 });
const euro = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });

export function formatEuro(value: number): string {
  return euro.format(value);
}

function count(value: number, singular: string, plural: string): string {
  const text = number.format(value);
  return `${text} ${text === "1" ? singular : plural}`;
}

/** "6 Tage und 1 Stunde"; the smaller unit is left out when it is zero. */
function pair(big: number, bigWords: [string, string], small: number, smallWords: [string, string]): string {
  const head = count(big, ...bigWords);
  return small === 0 ? head : `${head} und ${count(small, ...smallWords)}`;
}

const MINUTE: [string, string] = ["Minute", "Minuten"];
const HOUR: [string, string] = ["Stunde", "Stunden"];
const DAY: [string, string] = ["Tag", "Tage"];
const WEEK: [string, string] = ["Woche", "Wochen"];

export interface WorkTimeParts {
  unit: TimeUnit;
  /** At most two units, e.g. "45 Minuten", "3 Stunden und 48 Minuten", "6 Tage und 1 Stunde". */
  text: string;
  /** Whole working days in the text (0 below one day). */
  days: number;
}

/**
 * Breaks working time into at most two units, picked by size: below one hour minutes,
 * below one working day hours + minutes, otherwise working days + hours.
 * The smaller unit is rounded; a rounding that reaches the next bigger unit carries over.
 */
export function splitWorkTime(hours: number, hoursPerDay: number): WorkTimeParts | null {
  if (!Number.isFinite(hours) || hours < 0 || !(hoursPerDay > 0)) return null;

  const totalMinutes = Math.round(hours * 60);
  if (totalMinutes < 60) return { unit: "minutes", text: count(totalMinutes, ...MINUTE), days: 0 };

  const minutesPerDay = hoursPerDay * 60;
  if (totalMinutes < minutesPerDay) {
    const h = Math.floor(totalMinutes / 60);
    return { unit: "hours", text: pair(h, HOUR, totalMinutes - h * 60, MINUTE), days: 0 };
  }

  let days = Math.floor(totalMinutes / minutesPerDay);
  let restHours = Math.round((totalMinutes - days * minutesPerDay) / 60);
  if (restHours * 60 >= minutesPerDay) {
    days += 1;
    restHours = 0;
  }
  return { unit: "days", text: pair(days, DAY, restHours, HOUR), days };
}

/** "29 Stunden und 42 Minuten" (or just minutes below one hour). */
export function formatHoursMinutes(hours: number): string {
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  return h === 0 ? count(totalMinutes, ...MINUTE) : pair(h, HOUR, totalMinutes - h * 60, MINUTE);
}

/** "2 Wochen und 2 Tage" for working days, with a week of `workdaysPerWeek` days. */
export function formatWeeksDays(days: number, workdaysPerWeek: number): string {
  let weeks = Math.floor(days / workdaysPerWeek);
  let restDays = Math.round(days - weeks * workdaysPerWeek);
  if (restDays >= workdaysPerWeek) {
    weeks += 1;
    restDays = 0;
  }
  return pair(weeks, WEEK, restDays, DAY);
}
