import { formatHoursMinutes, formatWeeksDays, splitWorkTime } from "./format";

/** 1 = under an hour, 2 = under a working day, 3 = under a working week, 4 = a week or more. */
export type VerdictLevel = 1 | 2 | 3 | 4;

export interface Verdict {
  level: VerdictLevel;
  headline: string;
  comment: string;
  /** Exact working hours, e.g. "≈ 29 Stunden und 42 Minuten"; empty if the headline already says it. */
  detail: string;
}

/**
 * Turns working time into a cheeky verdict whose tone escalates with the amount
 * ("Vorschlag C" in docs/ausgabe-varianten.md). Times are always broken down into at most two units.
 */
export function workTimeVerdict(hours: number, hoursPerDay: number, workdaysPerWeek: number): Verdict | null {
  if (!(workdaysPerWeek > 0)) return null;
  const parts = splitWorkTime(hours, hoursPerDay);
  if (!parts) return null;

  if (parts.unit === "minutes") {
    return {
      level: 1,
      headline: parts.text === "0 Minuten" ? "Nicht mal eine Minute. Gönn dir." : `${parts.text}. Gönn dir.`,
      comment: "So schnell verdient, so schnell ausgegeben.",
      detail: "",
    };
  }

  if (parts.unit === "hours") {
    const share = hours / hoursPerDay;
    return {
      level: 2,
      headline: `${parts.text} Arbeit.`,
      comment: `${share >= 0.5 ? "Ein Großteil deines Arbeitstags" : "Ein ordentliches Stück deines Arbeitstags"}. Brauchst du das wirklich?`,
      detail: "",
    };
  }

  const detail = `≈ ${formatHoursMinutes(hours)}`;
  if (parts.days < workdaysPerWeek) {
    return {
      level: 3,
      headline: `${parts.text} Schufterei.`,
      comment: "Schlaf lieber noch eine Nacht drüber.",
      detail,
    };
  }

  return {
    level: 4,
    headline: `${parts.text} Arbeit. Ernsthaft?`,
    comment: `${formatWeeksDays(hours / hoursPerDay, workdaysPerWeek)} deines Lebens. Das muss es dir wert sein.`,
    detail,
  };
}
