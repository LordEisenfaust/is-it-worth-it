import { countWeekdaysInYear } from "./dates";
import { getHolidaysOnWorkdays, type Holiday } from "./holidays";
import { annualNet, type Settings } from "./settings";

export interface WageInfo {
  year: number;
  annualNet: number;
  /** Weekdays in the year on chosen workdays, minus holidays on those days, minus vacation. */
  workingDaysPerYear: number;
  hoursPerDay: number;
  hourlyWage: number;
  holidaysOnWorkdays: Holiday[];
}

export type WageResult = { ok: true; info: WageInfo } | { ok: false; error: string };

export function computeWage(settings: Settings, year: number): WageResult {
  if (settings.workdays.length === 0) return { ok: false, error: "Es ist kein Arbeitstag gewählt." };

  const holidaysOnWorkdays = getHolidaysOnWorkdays(year, settings.state, settings.workdays);
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
    info: { year, annualNet: net, workingDaysPerYear, hoursPerDay, hourlyWage, holidaysOnWorkdays },
  };
}

/** Working hours needed to earn `amount` euros at `hourlyWage` euros per hour. */
export function hoursForAmount(amount: number, hourlyWage: number): number {
  if (!(hourlyWage > 0) || !Number.isFinite(hourlyWage)) return NaN;
  return amount / hourlyWage;
}
