import { formatEuro, formatWorkTime } from "../lib/format";
import type { HistoryEntry } from "../lib/history";

const timeFormat = new Intl.DateTimeFormat("de-DE", { dateStyle: "short", timeStyle: "short" });

interface Props {
  history: HistoryEntry[];
  onClear: () => void;
}

export function HistoryList({ history, onClear }: Props) {
  return (
    <section aria-labelledby="history-title" className="card">
      <h2 id="history-title">Verlauf</h2>
      {history.length === 0 ? (
        <p className="muted">Noch keine gespeicherten Berechnungen.</p>
      ) : (
        <>
          <ul className="history">
            {history.map((entry) => (
              <li key={entry.id}>
                <div className="history-main">
                  <strong>{formatEuro(entry.amount)}</strong>
                  {entry.label && <span> – {entry.label}</span>}
                </div>
                <div>{formatWorkTime(entry.hours, entry.hoursPerDay).primary}</div>
                <time className="muted" dateTime={entry.createdAt}>
                  {timeFormat.format(new Date(entry.createdAt))}
                </time>
              </li>
            ))}
          </ul>
          <button type="button" className="secondary" onClick={onClear}>
            Verlauf leeren
          </button>
        </>
      )}
    </section>
  );
}
