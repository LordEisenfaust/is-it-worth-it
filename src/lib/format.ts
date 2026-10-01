export type TimeUnit = "minutes" | "hours" | "days";

export interface WorkTimeDisplay {
  unit: TimeUnit;
  /** Headline, e.g. "ca. 4,3 Arbeitstage". */
  primary: string;
  /** Equivalent in the other unit, e.g. "≈ 34 Arbeitsstunden"; empty if not useful. */
  secondary: string;
}

const number = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1 });
const euro = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });

export function formatEuro(value: number): string {
  return euro.format(value);
}

function withUnit(value: number, singular: string, plural: string): string {
  const text = number.format(value);
  return `${text} ${text === "1" ? singular : plural}`;
}

const minutesText = (minutes: number) => withUnit(minutes, "Minute", "Minuten");
const hoursText = (hours: number) => withUnit(hours, "Arbeitsstunde", "Arbeitsstunden");
const daysText = (days: number) => withUnit(days, "Arbeitstag", "Arbeitstage");

/**
 * Picks the unit by size: below one hour minutes, below one working day hours, otherwise working days.
 * Thresholds use the rounded value, so "60 Minuten" or "8 Stunden" never appear as headline.
 */
export function formatWorkTime(hours: number, hoursPerDay: number): WorkTimeDisplay {
  if (!Number.isFinite(hours) || hours < 0 || !(hoursPerDay > 0)) {
    return { unit: "hours", primary: "–", secondary: "" };
  }

  const minutes = Math.round(hours * 60);
  if (minutes < 60) {
    return { unit: "minutes", primary: `ca. ${minutesText(minutes)}`, secondary: "" };
  }

  const roundedHours = Math.round(hours * 10) / 10;
  if (roundedHours < hoursPerDay) {
    return {
      unit: "hours",
      primary: `ca. ${hoursText(roundedHours)}`,
      secondary: `≈ ${daysText(hours / hoursPerDay)}`,
    };
  }

  return {
    unit: "days",
    primary: `ca. ${daysText(hours / hoursPerDay)}`,
    secondary: `≈ ${hoursText(hours)}`,
  };
}
