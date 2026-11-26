import { t } from "../i18n";
import { formatEuro, formatHoursMinutes, formatWeeksDays, splitWorkTime, type WorkTimeParts } from "./format";
import { parseAmount } from "./parse";
import type { SettingsOutcome, WageInfo } from "./settings";

/** 1 = under an hour, 2 = under a working day, 3 = under a working week, 4 = a week or more. */
export type VerdictLevel = 1 | 2 | 3 | 4;

interface Verdict {
  level: VerdictLevel;
  headline: string;
  comment: string;
}

/** What the result box shows for the entered Betrag. */
export type AmountResult =
  | { kind: "empty" }
  /** `cause` says where the problem lies: the Gehaltsdaten or the entered Betrag. */
  | { kind: "hint"; text: string; cause: "settings" | "amount" }
  /** `greyLine` holds the Betrag and the exact working time from Stufe 3 on; below that the headline says it all. */
  | (Verdict & { kind: "verdict"; greyLine: string | null });

/**
 * Turns the entered Betrag into what the result box shows. The verdict's tone escalates with the amount
 * ("Vorschlag C" in docs/ausgabe-varianten.md); times are always broken down into at most two units.
 */
export function evaluateAmount(amountText: string, outcome: SettingsOutcome): AmountResult {
  if (!outcome.ok) return { kind: "hint", text: t.calculator.settingsMissing, cause: "settings" };
  if (amountText.trim() === "") return { kind: "empty" };
  const amount = parseAmount(amountText);
  if (!amount.ok) return { kind: "hint", text: amount.error, cause: "amount" };

  const { info } = outcome;
  const hours = amount.amount / info.hourlyWage;
  // Unreachable: usable Gehaltsdaten have hourlyWage > 0 and hoursPerDay > 0, and a parsed Betrag is > 0, so the
  // hours are finite and split. Should that ever break, show the empty box rather than crash the page.
  const parts = splitWorkTime(hours, info.hoursPerDay);
  if (!parts) return { kind: "empty" };

  const verdict = workTimeVerdict(parts, hours, info);
  const greyLine =
    verdict.level >= 3 ? t.verdict.greyLine(formatEuro(amount.amount), formatHoursMinutes(hours)) : null;
  return { kind: "verdict", ...verdict, greyLine };
}

function workTimeVerdict(parts: WorkTimeParts, hours: number, info: WageInfo): Verdict {
  const { hoursPerDay, workdaysPerWeek } = info;
  const v = t.verdict;

  if (parts.unit === "minutes") {
    const totalMinutesZero = Math.round(hours * 60) === 0;
    return {
      level: 1,
      headline: totalMinutesZero ? v.level1HeadlineUnderMinute : v.level1Headline(parts.text),
      comment: v.level1Comment,
    };
  }

  if (parts.unit === "hours") {
    // Measured on the rounded minutes the headline shows, so "4 Stunden" of an 8-hour day counts as half.
    const share = Math.round(hours * 60) / (hoursPerDay * 60);
    return {
      level: 2,
      headline: v.level2Headline(parts.text),
      comment: share >= 0.5 ? v.level2CommentLarge : v.level2CommentSmall,
    };
  }

  if (parts.days < workdaysPerWeek) {
    return { level: 3, headline: v.level3Headline(parts.text), comment: v.level3Comment };
  }

  return {
    level: 4,
    headline: v.level4Headline(parts.text),
    // Same whole days as the headline, so both lines never contradict each other.
    comment: v.level4Comment(formatWeeksDays(parts.days, workdaysPerWeek)),
  };
}
