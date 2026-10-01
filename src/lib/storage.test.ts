import { describe, expect, it } from "vitest";
import { clearAll, KEYS, loadJson, saveJson, type KeyValueStore } from "./storage";

function fakeStore(initial: Record<string, string> = {}): KeyValueStore & { data: Map<string, string> } {
  const data = new Map(Object.entries(initial));
  return {
    data,
    get length() {
      return data.size;
    },
    key: (i) => [...data.keys()][i] ?? null,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  };
}

describe("storage", () => {
  it("speichert und lädt JSON", () => {
    const store = fakeStore();
    expect(saveJson(KEYS.theme, [1, 2], store)).toBe(true);
    expect(loadJson(KEYS.theme, store)).toEqual([1, 2]);
  });

  it("liefert undefined bei fehlendem oder kaputtem Wert", () => {
    expect(loadJson(KEYS.theme, fakeStore())).toBeUndefined();
    expect(loadJson(KEYS.theme, fakeStore({ [KEYS.theme]: "{kaputt" }))).toBeUndefined();
  });

  it("meldet Fehler, wenn kein Speicher verfügbar ist", () => {
    expect(saveJson(KEYS.theme, "dark", null)).toBe(false);
    expect(loadJson(KEYS.theme, null)).toBeUndefined();
  });

  it("clearAll löscht nur Schlüssel mit dem Präfix iiwi:", () => {
    const store = fakeStore({ [KEYS.settings]: "1", [KEYS.theme]: "3", other: "x" });
    clearAll(store);
    expect([...store.data.keys()]).toEqual(["other"]);
  });
});
