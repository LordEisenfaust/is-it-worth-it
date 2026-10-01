import { useState } from "react";
import { hoursForAmount, type WageResult } from "../lib/calc";
import { formatEuro } from "../lib/format";
import { parseAmount } from "../lib/parse";
import { workTimeVerdict } from "../lib/verdict";

interface Props {
  /** null while the settings are invalid. */
  wage: WageResult | null;
  settingsInvalid: boolean;
  /** Number of chosen workdays per week (for the "weeks" wording). */
  workdaysPerWeek: number;
}

export function Calculator({ wage, settingsInvalid, workdaysPerWeek }: Props) {
  const [amountText, setAmountText] = useState("");

  const amount = parseAmount(amountText);
  const info = wage?.ok ? wage.info : null;
  const hours = amount.ok && info ? hoursForAmount(amount.amount, info.hourlyWage) : NaN;
  const verdict = info && Number.isFinite(hours) ? workTimeVerdict(hours, info.hoursPerDay, workdaysPerWeek) : null;

  let hint: string | null = null;
  if (settingsInvalid) hint = "Bitte zuerst die Gehaltsdaten in den Einstellungen vollständig und gültig ausfüllen.";
  else if (wage && !wage.ok) hint = wage.error;
  else if (amountText.trim() !== "" && !amount.ok) hint = amount.error;

  return (
    <section aria-labelledby="calc-title" className="card">
      <h2 id="calc-title">Rechner</h2>
      <form onSubmit={(e) => e.preventDefault()}>
        <div className="field">
          <label htmlFor="amount">Betrag in Euro</label>
          <input
            id="amount"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="z. B. 600"
            value={amountText}
            onChange={(e) => setAmountText(e.target.value)}
            aria-describedby="calc-status"
            aria-invalid={amountText.trim() !== "" && !amount.ok}
          />
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
              <p className="muted">
                {formatEuro(amount.amount)}
                {verdict.detail && ` · ${verdict.detail}`}
              </p>
            </>
          ) : hint ? (
            <p className="error">{hint}</p>
          ) : (
            <p className="muted">Gib einen Betrag ein, um die Arbeitszeit zu sehen.</p>
          )}
        </div>
      </form>
    </section>
  );
}
