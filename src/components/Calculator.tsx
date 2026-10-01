import { useState, type FormEvent } from "react";
import { hoursForAmount, type WageResult } from "../lib/calc";
import { formatEuro, formatWorkTime } from "../lib/format";
import type { HistoryEntry } from "../lib/history";
import { parseAmount } from "../lib/parse";

interface Props {
  /** null while the settings are invalid. */
  wage: WageResult | null;
  settingsInvalid: boolean;
  onSave: (entry: HistoryEntry) => void;
}

export function Calculator({ wage, settingsInvalid, onSave }: Props) {
  const [amountText, setAmountText] = useState("");
  const [label, setLabel] = useState("");

  const amount = parseAmount(amountText);
  const info = wage?.ok ? wage.info : null;
  const hours = amount.ok && info ? hoursForAmount(amount.amount, info.hourlyWage) : NaN;
  const display = info && Number.isFinite(hours) ? formatWorkTime(hours, info.hoursPerDay) : null;

  let hint: string | null = null;
  if (settingsInvalid) hint = "Bitte zuerst die Gehaltsdaten unten vollständig und gültig ausfüllen.";
  else if (wage && !wage.ok) hint = wage.error;
  else if (amountText.trim() !== "" && !amount.ok) hint = amount.error;

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!amount.ok || !info || !Number.isFinite(hours)) return;
    const trimmed = label.trim();
    onSave({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
      amount: amount.amount,
      hours,
      hoursPerDay: info.hoursPerDay,
      ...(trimmed ? { label: trimmed } : {}),
    });
    setAmountText("");
    setLabel("");
  }

  const canSave = amount.ok && display !== null;

  return (
    <section aria-labelledby="calc-title" className="card">
      <h2 id="calc-title">Rechner</h2>
      <form onSubmit={submit}>
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
        <div className="field">
          <label htmlFor="label">Bezeichnung (optional)</label>
          <input
            id="label"
            type="text"
            maxLength={60}
            autoComplete="off"
            placeholder="z. B. Neue Kopfhörer"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        </div>

        <div id="calc-status" className="result" aria-live="polite">
          {display && amount.ok ? (
            <>
              <p className="result-primary">
                {formatEuro(amount.amount)} entsprechen {display.primary}
              </p>
              {display.secondary && <p className="muted">{display.secondary}</p>}
            </>
          ) : hint ? (
            <p className="error">{hint}</p>
          ) : (
            <p className="muted">Gib einen Betrag ein, um die Arbeitszeit zu sehen.</p>
          )}
        </div>

        <button type="submit" disabled={!canSave}>
          Im Verlauf speichern
        </button>
      </form>
    </section>
  );
}
