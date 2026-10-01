import { describe, expect, it } from "vitest";
import { clearAll, KEYS, loadJson, saveJson, saveUnlessDefault, type KeyValueStore } from "./storage";

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

  it("saveUnlessDefault speichert abweichende Werte", () => {
    const store = fakeStore();
    expect(saveUnlessDefault(KEYS.theme, "dark", "system", store)).toBe(true);
    expect(loadJson(KEYS.theme, store)).toBe("dark");
  });

  it("saveUnlessDefault entfernt den Schlüssel bei Standardwerten statt sie zu schreiben", () => {
    const store = fakeStore({ [KEYS.theme]: '"dark"' });
    expect(saveUnlessDefault(KEYS.theme, "system", "system", store)).toBe(true);
    expect(store.data.has(KEYS.theme)).toBe(false);
  });

  it("saveUnlessDefault vergleicht Objekte unabhängig von der Schlüsselreihenfolge", () => {
    const store = fakeStore();
    saveUnlessDefault(KEYS.settings, { b: 2, a: [1, 2] }, { a: [1, 2], b: 2 }, store);
    expect(store.data.size).toBe(0);
    saveUnlessDefault(KEYS.settings, { a: [1, 3], b: 2 }, { a: [1, 2], b: 2 }, store);
    expect(loadJson(KEYS.settings, store)).toEqual({ a: [1, 3], b: 2 });
  });

  it("nach clearAll und Zurücksetzen auf Standardwerte bleibt der Speicher leer", () => {
    const store = fakeStore({ [KEYS.settings]: '{"net":"3000"}', [KEYS.theme]: '"dark"' });
    clearAll(store);
    saveUnlessDefault(KEYS.settings, { net: "" }, { net: "" }, store);
    saveUnlessDefault(KEYS.theme, "system", "system", store);
    expect(store.data.size).toBe(0);
  });

  it("saveUnlessDefault meldet Fehler, wenn kein Speicher verfügbar ist", () => {
    expect(saveUnlessDefault(KEYS.theme, "system", "system", null)).toBe(false);
  });
});
