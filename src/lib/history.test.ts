import { describe, expect, it } from "vitest";
import { addEntry, MAX_HISTORY, sanitizeHistory, type HistoryEntry } from "./history";

const entry = (n: number): HistoryEntry => ({
  id: String(n),
  createdAt: "2026-10-01T12:00:00.000Z",
  amount: n,
  hours: n / 20,
  hoursPerDay: 8,
});

describe("addEntry", () => {
  it("stellt den neuesten Eintrag nach vorn", () => {
    expect(addEntry([entry(1)], entry(2)).map((e) => e.id)).toEqual(["2", "1"]);
  });

  it("behält höchstens 20 Einträge", () => {
    let history: HistoryEntry[] = [];
    for (let i = 1; i <= 25; i++) history = addEntry(history, entry(i));
    expect(history).toHaveLength(MAX_HISTORY);
    expect(history[0]!.id).toBe("25");
    expect(history.at(-1)!.id).toBe("6");
  });
});

describe("sanitizeHistory", () => {
  it("verwirft ungültige Einträge", () => {
    const raw = [entry(1), { id: 1 }, null, { ...entry(2), hoursPerDay: 0 }, { ...entry(3), label: "Schuhe" }];
    expect(sanitizeHistory(raw).map((e) => e.id)).toEqual(["1", "3"]);
  });

  it("liefert bei Nicht-Arrays eine leere Liste", () => {
    expect(sanitizeHistory({})).toEqual([]);
    expect(sanitizeHistory(undefined)).toEqual([]);
  });
});
