import { useEffect, useMemo, useState } from "react";
import { Calculator } from "./components/Calculator";
import { PrivacyPanel } from "./components/PrivacyPanel";
import { SettingsForm } from "./components/SettingsForm";
import { ThemeToggle } from "./components/ThemeToggle";
import { computeWage } from "./lib/calc";
import { defaultDraft, sanitizeDraft, validateDraft, type SettingsDraft } from "./lib/settings";
import { clearAll, KEYS, loadJson, PREFIX, saveJson } from "./lib/storage";
import { sanitizeTheme, type ThemeChoice } from "./lib/theme";

export function App() {
  const [draft, setDraft] = useState<SettingsDraft>(() => sanitizeDraft(loadJson(KEYS.settings)));
  const [theme, setTheme] = useState<ThemeChoice>(() => sanitizeTheme(loadJson(KEYS.theme)));

  // The history feature was removed; drop data left over from earlier versions.
  useEffect(() => {
    try {
      window.localStorage.removeItem(`${PREFIX}history`);
    } catch {
      // Storage unavailable.
    }
  }, []);
  useEffect(() => void saveJson(KEYS.settings, draft), [draft]);
  useEffect(() => {
    saveJson(KEYS.theme, theme);
    const root = document.documentElement;
    if (theme === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", theme);
  }, [theme]);

  const validation = useMemo(() => validateDraft(draft), [draft]);
  // Open on first use (no valid salary data yet), collapsed afterwards.
  const [settingsOpen, setSettingsOpen] = useState(() => validateDraft(draft).settings === null);
  const year = new Date().getFullYear();
  const wage = useMemo(
    () => (validation.settings ? computeWage(validation.settings, year) : null),
    [validation.settings, year],
  );

  function deleteEverything() {
    clearAll();
    setDraft({ ...defaultDraft, workdays: [...defaultDraft.workdays] });
    setTheme("system");
  }

  return (
    <>
      <header className="app-header">
        <div>
          <h1>Is it worth it?</h1>
          <p className="muted">Ist es das wirklich wert? Finden wir es heraus?</p>
        </div>
        <div className="header-actions">
          <ThemeToggle value={theme} onChange={setTheme} />
          <button
            type="button"
            className="secondary"
            aria-expanded={settingsOpen}
            aria-controls="settings-panel"
            onClick={() => setSettingsOpen((open) => !open)}
          >
            Einstellungen
          </button>
        </div>
      </header>

      <main>
        <Calculator
          wage={wage}
          settingsInvalid={validation.settings === null}
        />
        {settingsOpen && (
          <div id="settings-panel">
            <SettingsForm draft={draft} errors={validation.errors} wage={wage} onChange={setDraft} />
            <PrivacyPanel onDeleteAll={deleteEverything} />
          </div>
        )}
      </main>
      <footer className="muted">Alle Angaben bleiben lokal in deinem Browser. Details unter „Einstellungen“.</footer>
    </>
  );
}
