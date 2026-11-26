import { describe, expect, it } from "vitest";
import { fakeStore } from "./fakeStore";
import { loadPreferences, resetPreferences, savePreferences } from "./preferences";
import { defaultDraft, type SettingsDraft } from "./settings";

const own: SettingsDraft = { ...defaultDraft, net: "3000", vacationDays: "28", state: "BY" };

describe("loadPreferences", () => {
  it("liefert aus leerem Speicher die Standardwerte", () => {
    expect(loadPreferences(fakeStore())).toEqual({ draft: defaultDraft, theme: "system" });
  });

  it("räumt den Verlauf aus früheren Versionen weg", () => {
    const store = fakeStore({ "iiwi:history": "[]", "iiwi:theme": '"dark"' });
    loadPreferences(store);
    expect([...store.data.keys()]).toEqual(["iiwi:theme"]);
  });

  it("säubert kaputte oder fremde Werte", () => {
    const store = fakeStore({ "iiwi:settings": "kein json", "iiwi:theme": '"lila"' });
    expect(loadPreferences(store)).toEqual({ draft: defaultDraft, theme: "system" });
  });

  it("ersetzt nur unbrauchbare Felder durch Standardwerte und behält die übrigen", () => {
    const stored = { ...own, workdays: [9], state: "XX" };
    const store = fakeStore({ "iiwi:settings": JSON.stringify(stored) });
    expect(loadPreferences(store).draft).toEqual({ ...own, workdays: defaultDraft.workdays, state: defaultDraft.state });
  });

  it("liefert ohne verfügbaren Speicher die Standardwerte", () => {
    expect(loadPreferences(null)).toEqual({ draft: defaultDraft, theme: "system" });
  });

  it("übersteht einen Speicher, der bei jedem Zugriff Fehler wirft (blockierter Speicher)", () => {
    const fail = () => {
      throw new Error("SecurityError");
    };
    const blocked = { ...fakeStore(), getItem: fail, setItem: fail, removeItem: fail, key: fail };
    expect(loadPreferences(blocked)).toEqual({ draft: defaultDraft, theme: "system" });
    expect(() => savePreferences({ draft: own, theme: "dark" }, blocked)).not.toThrow();
    expect(() => resetPreferences(blocked)).not.toThrow();
  });
});

describe("savePreferences", () => {
  it("speichert keine Standardwerte, auch nicht bei anderer Reihenfolge der Arbeitstage", () => {
    const store = fakeStore();
    savePreferences({ draft: { ...defaultDraft, workdays: [1, 2, 4, 5, 3] }, theme: "system" }, store);
    expect(store.data.size).toBe(0);
  });

  it("speichert eigene Gehaltsdaten und Darstellung, die beim Laden gleich zurückkommen", () => {
    const store = fakeStore();
    savePreferences({ draft: own, theme: "dark" }, store);
    expect(loadPreferences(store)).toEqual({ draft: own, theme: "dark" });
  });

  it("entfernt gespeicherte Werte, sobald wieder die Standardwerte gelten", () => {
    const store = fakeStore();
    savePreferences({ draft: own, theme: "light" }, store);
    savePreferences({ draft: defaultDraft, theme: "system" }, store);
    expect(store.data.size).toBe(0);
  });

  it("wirft nicht, wenn kein Speicher verfügbar ist", () => {
    expect(() => savePreferences({ draft: own, theme: "dark" }, null)).not.toThrow();
  });
});

describe("resetPreferences", () => {
  it("löscht alle Daten der App, lässt fremde stehen und liefert die Standardwerte", () => {
    const store = fakeStore({ "iiwi:settings": "{}", "iiwi:theme": '"dark"', "other:key": "x" });
    expect(resetPreferences(store)).toEqual({ draft: defaultDraft, theme: "system" });
    expect([...store.data.keys()]).toEqual(["other:key"]);
  });

  it("nach dem Zurücksetzen werden die Standardwerte nicht zurückgeschrieben", () => {
    const store = fakeStore();
    savePreferences({ draft: own, theme: "dark" }, store);
    savePreferences(resetPreferences(store), store);
    expect(store.data.size).toBe(0);
  });
});
