import { describe, expect, it } from "vitest";
import { appReducer, initAppState, type AppState } from "./appState";
import { defaultDraft, type SettingsDraft } from "./settings";

/** Every touchable input, sorted; written out so a shrinking ALL_INPUTS would show. */
const everyInput = ["monthsPerYear", "net", "state", "vacationDays", "weeklyHours", "workdays"];

/** Own, usable Gehaltsdaten: the defaults plus a net salary. */
const own: SettingsDraft = { ...defaultDraft, net: "3000" };

describe("initAppState", () => {
  it("startet ohne eigene Daten in den Einstellungen, nichts berührt", () => {
    const state = initAppState({ draft: defaultDraft, theme: "system" }, 2026);
    expect(state.view).toBe("settings");
    expect([...state.touched]).toEqual([]);
    expect(state.draft).toEqual(defaultDraft);
    expect(state.theme).toBe("system");
  });

  it("startet mit eigenen, nutzbaren Daten im Rechner, alles berührt", () => {
    const state = initAppState({ draft: own, theme: "dark" }, 2026);
    expect(state.view).toBe("calculator");
    expect([...state.touched].sort()).toEqual(everyInput);
    expect(state.theme).toBe("dark");
  });

  it("startet mit eigenen, nicht nutzbaren Daten in den Einstellungen, alles berührt", () => {
    const state = initAppState({ draft: { ...own, workdays: [] }, theme: "system" }, 2026);
    expect(state.view).toBe("settings");
    expect([...state.touched].sort()).toEqual(everyInput);
  });
});

describe("appReducer", () => {
  /** While the app is open: own data, calculator shown, net and weekly hours touched. */
  const running: AppState = {
    draft: own,
    theme: "dark",
    view: "calculator",
    touched: new Set(["net", "weeklyHours"]),
  };

  it("„Alle Daten löschen“ übernimmt die frischen Werte, nichts berührt, Ansicht bleibt", () => {
    const state = appReducer(running, { type: "reset", preferences: { draft: defaultDraft, theme: "system" } });
    expect(state.draft).toEqual(defaultDraft);
    expect(state.theme).toBe("system");
    expect([...state.touched]).toEqual([]);
    expect(state.view).toBe("calculator");
  });

  it("Entwurf ändern lässt die berührten Eingaben stehen", () => {
    const edited = { ...own, net: "3500" };
    const state = appReducer(running, { type: "editDraft", draft: edited });
    expect(state.draft).toEqual(edited);
    expect([...state.touched]).toEqual(["net", "weeklyHours"]);
  });

  it("Berühren fügt genau eine Eingabe hinzu", () => {
    const state = appReducer(running, { type: "touch", input: "state" });
    expect([...state.touched]).toEqual(["net", "weeklyHours", "state"]);
    expect([...appReducer(state, { type: "touch", input: "state" }).touched]).toEqual(["net", "weeklyHours", "state"]);
    expect([...running.touched]).toEqual(["net", "weeklyHours"]);
  });
});
