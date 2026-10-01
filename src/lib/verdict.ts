import { t } from "../i18n";
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
  const v = t.verdict;

  if (parts.unit === "minutes") {
    const totalMinutesZero = Math.round(hours * 60) === 0;
    return {
      level: 1,
      headline: totalMinutesZero ? v.level1HeadlineUnderMinute : v.level1Headline(parts.text),
      comment: v.level1Comment,
      detail: "",
    };
  }

  if (parts.unit === "hours") {
    const share = hours / hoursPerDay;
    return {
      level: 2,
      headline: v.level2Headline(parts.text),
      comment: share >= 0.5 ? v.level2CommentLarge : v.level2CommentSmall,
      detail: "",
    };
  }

  const detail = v.detail(formatHoursMinutes(hours));
  if (parts.days < workdaysPerWeek) {
    return {
      level: 3,
      headline: v.level3Headline(parts.text),
      comment: v.level3Comment,
      detail,
    };
  }

  return {
    level: 4,
    headline: v.level4Headline(parts.text),
    comment: v.level4Comment(formatWeeksDays(hours / hoursPerDay, workdaysPerWeek)),
    detail,
  };
}
