import { t } from "../i18n";
import { countWeekdaysInYear } from "./dates";
import { getHolidays, isStateCode, type Holiday, type StateCode } from "./holidays";
import { parseNumber } from "./parse";

export type IncomeMode = "yearly" | "monthly";

/** Validated settings used for calculations. Weekdays follow JavaScript: 0 = Sunday ... 6 = Saturday. */
interface Settings {
  mode: IncomeMode;
  /** Net income per year (mode "yearly") or per month (mode "monthly"), in euros. */
  net: number;
  monthsPerYear: number;
  weeklyHours: number;
  workdays: number[];
  vacationDays: number;
  state: StateCode;
}

/** What the form holds: text fields stay strings so half-typed input is never lost. */
export interface SettingsDraft {
  mode: IncomeMode;
  net: string;
  monthsPerYear: number;
  weeklyHours: string;
  workdays: number[];
  vacationDays: string;
  state: StateCode;
}

export type SettingsField = "net" | "monthsPerYear" | "weeklyHours" | "workdays" | "vacationDays";

export const MIN_MONTHS = 12;
export const MAX_MONTHS = 16;

export const defaultDraft: SettingsDraft = {
  mode: "monthly",
  net: "",
  monthsPerYear: 12,
  weeklyHours: "40",
  workdays: [1, 2, 3, 4, 5],
  vacationDays: "30",
  state: "NW",
};

/** Error text per field; a field without an entry is fine. */
export type FieldErrors = Partial<Record<SettingsField, string>>;

interface ValidationResult {
  settings: Settings | null;
  errors: FieldErrors;
}

/** Whether the draft holds the defaults, ignoring the order in which workdays were ticked. */
export function isDefaultDraft(draft: SettingsDraft): boolean {
  const normalize = (d: SettingsDraft) => JSON.stringify({ ...d, workdays: [...d.workdays].sort((a, b) => a - b) });
  return normalize(draft) === normalize(defaultDraft);
}

/** A fresh copy of the defaults, safe to hand to state without sharing the workdays array. */
export function freshDraft(): SettingsDraft {
  return { ...defaultDraft, workdays: [...defaultDraft.workdays] };
}

function annualNet(settings: Pick<Settings, "mode" | "net" | "monthsPerYear">): number {
  return settings.mode === "monthly" ? settings.net * settings.monthsPerYear : settings.net;
}

function validateDraft(draft: SettingsDraft): ValidationResult {
  const errors: ValidationResult["errors"] = {};

  const net = parseNumber(draft.net);
  const v = t.validation;
  const netLabel = draft.mode === "monthly" ? t.settings.monthly : t.settings.yearly;
  if (draft.net.trim() === "") errors.net = v.netMissing(netLabel);
  else if (!Number.isFinite(net) || net <= 0) errors.net = v.netInvalid(netLabel);
  else if (net > 1e9) errors.net = v.netTooLarge(netLabel);

  const months = draft.monthsPerYear;
  if (!Number.isInteger(months) || months < MIN_MONTHS || months > MAX_MONTHS) {
    errors.monthsPerYear = v.monthsOutOfRange(MIN_MONTHS, MAX_MONTHS);
  }

  const weeklyHours = parseNumber(draft.weeklyHours);
  if (draft.weeklyHours.trim() === "") errors.weeklyHours = v.weeklyHoursMissing;
  else if (!Number.isFinite(weeklyHours) || weeklyHours <= 0) {
    errors.weeklyHours = v.weeklyHoursInvalid;
  } else if (weeklyHours > 168) errors.weeklyHours = v.weeklyHoursTooMany;

  const workdays = [...new Set(draft.workdays)].filter((d) => Number.isInteger(d) && d >= 0 && d <= 6);
  if (workdays.length === 0) errors.workdays = v.workdaysMissing;
  else if (!errors.weeklyHours) {
    // Below one hour per day the work time could not be split into minutes, hours and days in that order.
    const hoursPerDay = weeklyHours / workdays.length;
    if (hoursPerDay > 24) errors.weeklyHours = v.hoursPerDayTooMany;
    else if (hoursPerDay < 1) errors.weeklyHours = v.hoursPerDayTooFew;
  }

  const vacationDays = parseNumber(draft.vacationDays);
  if (draft.vacationDays.trim() === "") errors.vacationDays = v.vacationMissing;
  else if (!Number.isInteger(vacationDays) || vacationDays < 0) {
    errors.vacationDays = v.vacationInvalid;
  } else if (vacationDays > 366) errors.vacationDays = v.vacationTooMany;

  if (Object.keys(errors).length > 0) return { settings: null, errors };

  return {
    settings: {
      mode: draft.mode,
      net,
      monthsPerYear: months,
      weeklyHours,
      workdays: workdays.sort((a, b) => a - b),
      vacationDays,
      state: draft.state,
    },
    errors,
  };
}

export interface WageInfo {
  year: number;
  annualNet: number;
  /** Weekdays in the year on chosen workdays, minus holidays on those days, minus vacation. */
  workingDaysPerYear: number;
  hoursPerDay: number;
  /** Number of chosen workdays per week (for the "weeks" wording). */
  workdaysPerWeek: number;
  hourlyWage: number;
  /** Holidays on a chosen workday; these reduce the working days. */
  holidaysOnWorkdays: Holiday[];
  /** Every statutory holiday of the state in the year, flagged by whether it falls on a chosen workday. */
  allHolidays: (Holiday & { onWorkday: boolean })[];
}

/** The evaluated Gehaltsdaten: either the Netto-Stundenlohn with its summary, or errors per field. */
export type SettingsOutcome =
  | { ok: true; info: WageInfo }
  | { ok: false; errors: FieldErrors };

/** Validates the form's draft and, if usable, computes the Netto-Stundenlohn for `year`. */
export function evaluateSettings(draft: SettingsDraft, year: number): SettingsOutcome {
  const { settings, errors } = validateDraft(draft);
  if (!settings) return { ok: false, errors };
  const info = computeWage(settings, year);
  // The only way usable fields can still fail: vacation and holidays leave no working day in the year.
  if (!info) return { ok: false, errors: { vacationDays: t.validation.noWorkingDaysLeft } };
  return { ok: true, info };
}

/** Null when vacation and holidays leave no working day in the year. */
function computeWage(settings: Settings, year: number): WageInfo | null {
  const allHolidays = getHolidays(year, settings.state).map((h) => ({
    ...h,
    onWorkday: settings.workdays.includes(h.date.getUTCDay()),
  }));
  const holidaysOnWorkdays: Holiday[] = allHolidays.filter((h) => h.onWorkday).map(({ name, date }) => ({ name, date }));
  // Two holidays can share a date (Christi Himmelfahrt on 1 May, as in 2008); that day is off only once.
  const holidayDaysOnWorkdays = new Set(holidaysOnWorkdays.map((h) => h.date.getTime())).size;
  const workingDaysPerYear =
    countWeekdaysInYear(year, settings.workdays) - holidayDaysOnWorkdays - settings.vacationDays;
  if (workingDaysPerYear <= 0) return null;

  // Validated settings guarantee net > 0, weeklyHours > 0 and at least one workday, so this divides by > 0.
  const hoursPerDay = settings.weeklyHours / settings.workdays.length;
  const net = annualNet(settings);
  return {
    year,
    annualNet: net,
    workingDaysPerYear,
    hoursPerDay,
    workdaysPerWeek: settings.workdays.length,
    hourlyWage: net / (workingDaysPerYear * hoursPerDay),
    holidaysOnWorkdays,
    allHolidays,
  };
}

/** Turns untrusted stored data into a well-formed draft, falling back to defaults per field. */
export function sanitizeDraft(raw: unknown): SettingsDraft {
  if (typeof raw !== "object" || raw === null) return freshDraft();
  const r = raw as Record<string, unknown>;
  const months = r.monthsPerYear;
  return {
    mode: r.mode === "yearly" || r.mode === "monthly" ? r.mode : defaultDraft.mode,
    net: typeof r.net === "string" ? r.net : defaultDraft.net,
    monthsPerYear:
      typeof months === "number" && Number.isInteger(months) && months >= MIN_MONTHS && months <= MAX_MONTHS
        ? months
        : defaultDraft.monthsPerYear,
    weeklyHours: typeof r.weeklyHours === "string" ? r.weeklyHours : defaultDraft.weeklyHours,
    workdays:
      Array.isArray(r.workdays) && r.workdays.every((d) => Number.isInteger(d) && d >= 0 && d <= 6)
        ? [...new Set(r.workdays as number[])]
        : [...defaultDraft.workdays],
    vacationDays: typeof r.vacationDays === "string" ? r.vacationDays : defaultDraft.vacationDays,
    state: isStateCode(r.state) ? r.state : defaultDraft.state,
  };
}
