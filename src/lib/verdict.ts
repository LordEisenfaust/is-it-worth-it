import { t } from "../i18n";
import { formatEuro, formatHoursMinutes, formatWeeksDays, splitWorkTime, type WorkTimeParts } from "./format";
import { parseAmount } from "./parse";
import type { SettingsOutcome } from "./settings";

/** 1 = under an hour, 2 = under a working day, 3 = under a working week, 4 = a week or more. */
export type VerdictLevel = 1 | 2 | 3 | 4;

/** What the result box shows for the entered Betrag. */
export type AmountResult =
  | { kind: "empty" }
  /** `cause` says where the problem lies: the Gehaltsdaten or the entered Betrag. */
  | { kind: "hint"; text: string; cause: "settings" | "amount" }
  /** `greyLine` holds the Betrag and the exact working time from Stufe 3 on; below that the headline says it all. */
  | { kind: "verdict"; level: VerdictLevel; headline: string; comment: string; greyLine: string | null };

/**
 * Turns the entered Betrag into what the result box shows. The verdict's tone escalates with the amount
 * ("Vorschlag C" in docs/ausgabe-varianten.md); times are always broken down into at most two units.
 */
export function evaluateAmount(amountText: string, outcome: SettingsOutcome): AmountResult {
  if (!outcome.ok) return { kind: "hint", text: t.calculator.settingsMissing, cause: "settings" };
  if (amountText.trim() === "") return { kind: "empty" };
  const amount = parseAmount(amountText);
  if (!amount.ok) return { kind: "hint", text: amount.error, cause: "amount" };

  const { hourlyWage, hoursPerDay, workdaysPerWeek } = outcome.info;
  // Usable Gehaltsdaten guarantee hourlyWage > 0 and hoursPerDay > 0, so this always splits.
  const hours = amount.amount / hourlyWage;
  const parts = splitWorkTime(hours, hoursPerDay);
  if (!parts) return { kind: "empty" };

  const verdict = workTimeVerdict(parts, hours, hoursPerDay, workdaysPerWeek);
  const greyLine =
    verdict.level >= 3 ? t.verdict.greyLine(formatEuro(amount.amount), formatHoursMinutes(hours)) : null;
  return { kind: "verdict", ...verdict, greyLine };
}

function workTimeVerdict(
  parts: WorkTimeParts,
  hours: number,
  hoursPerDay: number,
  workdaysPerWeek: number,
): { level: VerdictLevel; headline: string; comment: string } {
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
    const share = hours / hoursPerDay;
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
