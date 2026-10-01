import { t } from "../i18n";
import { isStateCode, type StateCode } from "./holidays";
import { parseNumber } from "./parse";

export type IncomeMode = "yearly" | "monthly";

/** Validated settings used for calculations. Weekdays follow JavaScript: 0 = Sunday ... 6 = Saturday. */
export interface Settings {
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

export interface ValidationResult {
  settings: Settings | null;
  errors: Partial<Record<SettingsField, string>>;
}

export function annualNet(settings: Pick<Settings, "mode" | "net" | "monthsPerYear">): number {
  return settings.mode === "monthly" ? settings.net * settings.monthsPerYear : settings.net;
}

export function validateDraft(draft: SettingsDraft): ValidationResult {
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
  else if (!errors.weeklyHours && weeklyHours / workdays.length > 24) {
    errors.weeklyHours = v.hoursPerDayTooMany;
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

/** Turns untrusted stored data into a well-formed draft, falling back to defaults per field. */
export function sanitizeDraft(raw: unknown): SettingsDraft {
  if (typeof raw !== "object" || raw === null) return { ...defaultDraft, workdays: [...defaultDraft.workdays] };
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
