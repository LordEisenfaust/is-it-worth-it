import { countWeekdaysInYear } from "./dates";
import { getHolidays, type Holiday } from "./holidays";
import { annualNet, type Settings } from "./settings";

export interface WageInfo {
  year: number;
  annualNet: number;
  /** Weekdays in the year on chosen workdays, minus holidays on those days, minus vacation. */
  workingDaysPerYear: number;
  hoursPerDay: number;
  hourlyWage: number;
  /** Holidays on a chosen workday; these reduce the working days. */
  holidaysOnWorkdays: Holiday[];
  /** Every statutory holiday of the state in the year, flagged by whether it falls on a chosen workday. */
  allHolidays: (Holiday & { onWorkday: boolean })[];
}

export type WageResult = { ok: true; info: WageInfo } | { ok: false; error: string };

export function computeWage(settings: Settings, year: number): WageResult {
  if (settings.workdays.length === 0) return { ok: false, error: "Es ist kein Arbeitstag gewählt." };

  const allHolidays = getHolidays(year, settings.state).map((h) => ({
    ...h,
    onWorkday: settings.workdays.includes(h.date.getUTCDay()),
  }));
  const holidaysOnWorkdays: Holiday[] = allHolidays.filter((h) => h.onWorkday).map(({ name, date }) => ({ name, date }));
  const workingDaysPerYear =
    countWeekdaysInYear(year, settings.workdays) - holidaysOnWorkdays.length - settings.vacationDays;
  if (workingDaysPerYear <= 0) {
    return { ok: false, error: "Mit diesen Urlaubstagen bleibt kein Arbeitstag im Jahr übrig." };
  }

  const hoursPerDay = settings.weeklyHours / settings.workdays.length;
  const net = annualNet(settings);
  const hourlyWage = net / (workingDaysPerYear * hoursPerDay);
  if (!Number.isFinite(hourlyWage) || hourlyWage <= 0) {
    return { ok: false, error: "Der Stundenlohn lässt sich mit diesen Angaben nicht berechnen." };
  }

  return {
    ok: true,
    info: { year, annualNet: net, workingDaysPerYear, hoursPerDay, hourlyWage, holidaysOnWorkdays, allHolidays },
  };
}

/** Working hours needed to earn `amount` euros at `hourlyWage` euros per hour. */
export function hoursForAmount(amount: number, hourlyWage: number): number {
  if (!(hourlyWage > 0) || !Number.isFinite(hourlyWage)) return NaN;
  return amount / hourlyWage;
}
