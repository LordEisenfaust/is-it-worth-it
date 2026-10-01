import { t } from "../i18n";

/** Fixed start of the credit line; every quip continues it with Claude as the subject. */
export const CREDIT_PREFIX = t.footer.creditPrefix;

/** One of these is shown at random after CREDIT_PREFIX on every page load (see docs/footer-sprueche.md). */
export const QUIPS: readonly string[] = t.footer.quips;

/** Shown in the calculator's result box while no amount is entered; one at random per page load. */
export const EMPTY_PROMPTS: readonly string[] = t.calculator.emptyPrompts;

/** Picks one entry; `random` returns a number in [0, 1) like Math.random (injectable for tests). */
export function pickFrom(list: readonly string[], random: () => number = Math.random): string {
  const index = Math.min(list.length - 1, Math.max(0, Math.floor(random() * list.length)));
  return list[index];
}

export function pickQuip(random: () => number = Math.random): string {
  return pickFrom(QUIPS, random);
}
