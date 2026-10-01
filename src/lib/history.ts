export const MAX_HISTORY = 20;

export interface HistoryEntry {
  id: string;
  /** ISO timestamp. */
  createdAt: string;
  amount: number;
  label?: string;
  hours: number;
  hoursPerDay: number;
}

/** Newest first, capped at `max` entries. */
export function addEntry(history: readonly HistoryEntry[], entry: HistoryEntry, max = MAX_HISTORY): HistoryEntry[] {
  return [entry, ...history].slice(0, max);
}

function isEntry(value: unknown): value is HistoryEntry {
  if (typeof value !== "object" || value === null) return false;
  const e = value as Record<string, unknown>;
  return (
    typeof e.id === "string" &&
    typeof e.createdAt === "string" &&
    typeof e.amount === "number" &&
    Number.isFinite(e.amount) &&
    typeof e.hours === "number" &&
    Number.isFinite(e.hours) &&
    typeof e.hoursPerDay === "number" &&
    e.hoursPerDay > 0 &&
    (e.label === undefined || typeof e.label === "string")
  );
}

/** Drops malformed entries from stored data. */
export function sanitizeHistory(raw: unknown, max = MAX_HISTORY): HistoryEntry[] {
  return Array.isArray(raw) ? raw.filter(isEntry).slice(0, max) : [];
}
