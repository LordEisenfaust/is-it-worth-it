import { formatWorkTime } from "./format";

/** 1 = under an hour, 2 = under a working day, 3 = under a working week, 4 = a week or more. */
export type VerdictLevel = 1 | 2 | 3 | 4;

export interface Verdict {
  level: VerdictLevel;
  headline: string;
  comment: string;
  /** Exact equivalent in the other unit, e.g. "≈ 29,7 Arbeitsstunden"; empty if not useful. */
  detail: string;
}

const number = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1 });

function count(value: number, singular: string, plural: string): string {
  const text = number.format(value);
  return `${text} ${text === "1" ? singular : plural}`;
}

/**
 * Turns working time into a cheeky verdict whose tone escalates with the amount
 * ("Vorschlag C" in docs/ausgabe-varianten.md). The unit thresholds follow formatWorkTime.
 */
export function workTimeVerdict(hours: number, hoursPerDay: number, workdaysPerWeek: number): Verdict | null {
  if (!Number.isFinite(hours) || hours < 0 || !(hoursPerDay > 0) || !(workdaysPerWeek > 0)) return null;

  const display = formatWorkTime(hours, hoursPerDay);

  if (display.unit === "minutes") {
    const minutes = Math.round(hours * 60);
    return {
      level: 1,
      headline: minutes < 1 ? "Nicht mal eine Minute. Gönn dir." : `${count(minutes, "Minute", "Minuten")}. Gönn dir.`,
      comment: "So schnell verdient, so schnell ausgegeben.",
      detail: "",
    };
  }

  if (display.unit === "hours") {
    const share = hours / hoursPerDay;
    return {
      level: 2,
      headline: `${count(Math.round(hours * 10) / 10, "Stunde", "Stunden")} Arbeit.`,
      comment: `${share >= 0.5 ? "Ein Großteil deines Arbeitstags" : "Ein ordentliches Stück deines Arbeitstags"}. Brauchst du das wirklich?`,
      detail: display.secondary,
    };
  }

  const days = hours / hoursPerDay;
  const roundedDays = Math.round(days * 10) / 10;
  if (roundedDays < workdaysPerWeek) {
    return {
      level: 3,
      headline: `${count(roundedDays, "Tag", "Tage")} Schufterei.`,
      comment: "Schlaf lieber noch eine Nacht drüber.",
      detail: display.secondary,
    };
  }

  const weeks = Math.round((days / workdaysPerWeek) * 10) / 10;
  return {
    level: 4,
    headline: `${count(roundedDays, "Tag", "Tage")} Arbeit. Ernsthaft?`,
    comment: `${count(weeks, "Woche", "Wochen")} deines Lebens. Das muss es dir wert sein.`,
    detail: display.secondary,
  };
}
