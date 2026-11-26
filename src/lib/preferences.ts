import { isDefaultDraft, sanitizeDraft, type SettingsDraft } from "./settings";
import { clearAll, KEYS, loadJson, PREFIX, removeKey, saveJson, type KeyValueStore } from "./storage";
import { sanitizeTheme, type ThemeChoice } from "./theme";

/** Everything the app keeps in the browser: the Gehaltsdaten draft and the Darstellung. */
export interface Preferences {
  draft: SettingsDraft;
  theme: ThemeChoice;
}

/** Left behind by the history feature of earlier versions. */
const LEGACY_HISTORY = `${PREFIX}history`;

/** `store` defaults to the browser's localStorage; `null` means storage is unavailable. */
export function loadPreferences(store?: KeyValueStore | null): Preferences {
  removeKey(LEGACY_HISTORY, store);
  return {
    draft: sanitizeDraft(loadJson(KEYS.settings, store)),
    theme: sanitizeTheme(loadJson(KEYS.theme, store)),
  };
}

/**
 * Saves what differs from the defaults and removes the rest: a missing key loads as the default anyway,
 * and after "delete all data" the reset defaults are not written straight back.
 */
export function savePreferences({ draft, theme }: Preferences, store?: KeyValueStore | null): void {
  if (isDefaultDraft(draft)) removeKey(KEYS.settings, store);
  else saveJson(KEYS.settings, draft, store);
  if (theme === "system") removeKey(KEYS.theme, store);
  else saveJson(KEYS.theme, theme, store);
}

/** "Delete all data": removes every key with the app prefix and returns fresh defaults. */
export function resetPreferences(store?: KeyValueStore | null): Preferences {
  clearAll(store);
  return { draft: sanitizeDraft(undefined), theme: "system" };
}
