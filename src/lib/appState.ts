import type { Preferences } from "./preferences";
import { ALL_INPUTS, evaluateSettings, isDefaultDraft, type SettingsDraft, type SettingsInput } from "./settings";
import type { ThemeChoice } from "./theme";

/** The two views of the app; the calculator stays mounted while the settings are shown. */
export type View = "calculator" | "settings";

/** What the app holds while it is open (the App-Zustand); the evaluation is derived from it, not kept in it. */
export interface AppState {
  draft: SettingsDraft;
  theme: ThemeChoice;
  view: View;
  touched: ReadonlySet<SettingsInput>;
}

/**
 * The start from the loaded data: the settings while the Gehaltsdaten are not usable in `year`, otherwise the
 * calculator. With the user's own data everything counts as touched, so their errors show at once.
 */
export function initAppState({ draft, theme }: Preferences, year: number): AppState {
  return {
    draft,
    theme,
    view: evaluateSettings(draft, year).ok ? "calculator" : "settings",
    touched: new Set(isDefaultDraft(draft) ? [] : ALL_INPUTS),
  };
}

export type AppAction =
  | { type: "editDraft"; draft: SettingsDraft }
  | { type: "touch"; input: SettingsInput }
  | { type: "chooseTheme"; theme: ThemeChoice }
  | { type: "showView"; view: View }
  /** "Alle Daten löschen": `preferences` are the fresh defaults from `resetPreferences`, which clears the storage. */
  | { type: "reset"; preferences: Preferences };

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "editDraft":
      return { ...state, draft: action.draft };
    case "touch":
      return state.touched.has(action.input) ? state : { ...state, touched: new Set([...state.touched, action.input]) };
    case "chooseTheme":
      return { ...state, theme: action.theme };
    case "showView":
      return { ...state, view: action.view };
    case "reset":
      // Like a first visit, but the user stays where the delete button is.
      return { ...state, draft: action.preferences.draft, theme: action.preferences.theme, touched: new Set() };
  }
}
