import { useState } from "react";
import { hoursForAmount } from "../lib/calc";
import { t } from "../i18n";
import { formatEuro } from "../lib/format";
import { parseAmount } from "../lib/parse";
import { EMPTY_PROMPTS, pickFrom } from "../lib/quips";
import type { SettingsOutcome } from "../lib/settings";
import { workTimeVerdict } from "../lib/verdict";

interface Props {
  /** The evaluated Gehaltsdaten; their details are shown in the settings, not here. */
  outcome: SettingsOutcome;
}

export function Calculator({ outcome }: Props) {
  const [amountText, setAmountText] = useState("");
  // A different nudge on every page load; stays the same while the page is open.
  const [emptyPrompt] = useState(() => pickFrom(EMPTY_PROMPTS));

  const amount = parseAmount(amountText);
  const info = outcome.ok ? outcome.info : null;
  const hours = amount.ok && info ? hoursForAmount(amount.amount, info.hourlyWage) : NaN;
  const verdict =
    info && Number.isFinite(hours) ? workTimeVerdict(hours, info.hoursPerDay, info.workdaysPerWeek) : null;

  let hint: string | null = null;
  if (!outcome.ok) hint = t.calculator.settingsMissing;
  else if (amountText.trim() !== "" && !amount.ok) hint = amount.error;

  return (
    <section aria-labelledby="calc-title" className="card">
      <h2 id="calc-title">{t.calculator.title}</h2>
      <form onSubmit={(e) => e.preventDefault()}>
        <div className="field">
          <label htmlFor="amount">{t.calculator.amountLabel}</label>
          <div className="input-affix">
            <input
              id="amount"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder={t.calculator.amountPlaceholder}
              value={amountText}
              onChange={(e) => setAmountText(e.target.value)}
              aria-describedby="calc-status"
              aria-invalid={amountText.trim() !== "" && !amount.ok}
            />
            {/* Decorative: the label already says "in Euro". */}
            <span className="affix" aria-hidden="true">
              {t.calculator.amountUnit}
            </span>
          </div>
        </div>

        <div
          id="calc-status"
          className={verdict && amount.ok ? `result level-${verdict.level}` : "result"}
          aria-live="polite"
        >
          {verdict && amount.ok ? (
            <>
              <p className="result-primary">{verdict.headline}</p>
              <p>{verdict.comment}</p>
              {/* Experiment: only from level 3 (a working day or more); small amounts need no extra line. */}
              {verdict.level >= 3 && (
                <p className="muted">
                  {formatEuro(amount.amount)}
                  {verdict.detail && ` · ${verdict.detail}`}
                </p>
              )}
            </>
          ) : hint ? (
            <p className="error">{hint}</p>
          ) : (
            <p className="muted">{emptyPrompt}</p>
          )}
        </div>
      </form>
    </section>
  );
}
