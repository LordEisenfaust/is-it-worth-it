import { useState } from "react";
import { t } from "../i18n";
import { pickFrom } from "../lib/quips";
import type { SettingsOutcome } from "../lib/settings";
import { evaluateAmount } from "../lib/verdict";

interface Props {
  /** The evaluated Gehaltsdaten; their details are shown in the settings, not here. */
  outcome: SettingsOutcome;
}

export function Calculator({ outcome }: Props) {
  const [amountText, setAmountText] = useState("");
  // A different nudge on every page load; stays the same while the page is open.
  const [emptyPrompt] = useState(() => pickFrom(t.calculator.emptyPrompts));

  const result = evaluateAmount(amountText, outcome);

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
              aria-invalid={result.kind === "hint" && result.cause === "amount"}
            />
            {/* Decorative: the label already says "in Euro". */}
            <span className="affix" aria-hidden="true">
              {t.calculator.amountUnit}
            </span>
          </div>
        </div>

        <div
          id="calc-status"
          className={result.kind === "verdict" ? `result level-${result.level}` : "result"}
          aria-live="polite"
        >
          {result.kind === "verdict" ? (
            <>
              <p className="result-primary">{result.headline}</p>
              <p>{result.comment}</p>
              {result.greyLine && <p className="muted">{result.greyLine}</p>}
            </>
          ) : result.kind === "hint" ? (
            <p className="error">{result.text}</p>
          ) : (
            <p className="muted">{emptyPrompt}</p>
          )}
        </div>
      </form>
    </section>
  );
}
