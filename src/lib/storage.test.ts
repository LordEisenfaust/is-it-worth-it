import { describe, expect, it } from "vitest";
import { fakeStore } from "./fakeStore";
import { clearAll, loadJson, removeKey, saveJson } from "./storage";

const KEYS = { settings: "iiwi:settings", theme: "iiwi:theme" };

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

  it("entfernt einzelne Schlüssel", () => {
    const store = fakeStore({ [KEYS.theme]: '"dark"', other: "x" });
    expect(removeKey(KEYS.theme, store)).toBe(true);
    expect([...store.data.keys()]).toEqual(["other"]);
    expect(removeKey(KEYS.theme, null)).toBe(false);
  });
});
