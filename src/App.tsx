import { useEffect, useMemo, useState } from "react";
import { Calculator } from "./components/Calculator";
import { HistoryList } from "./components/HistoryList";
import { PrivacyPanel } from "./components/PrivacyPanel";
import { SettingsForm } from "./components/SettingsForm";
import { ThemeToggle } from "./components/ThemeToggle";
import { computeWage } from "./lib/calc";
import { addEntry, sanitizeHistory, type HistoryEntry } from "./lib/history";
import { defaultDraft, sanitizeDraft, validateDraft, type SettingsDraft } from "./lib/settings";
import { clearAll, KEYS, loadJson, saveJson } from "./lib/storage";
import { sanitizeTheme, type ThemeChoice } from "./lib/theme";

export function App() {
  const [draft, setDraft] = useState<SettingsDraft>(() => sanitizeDraft(loadJson(KEYS.settings)));
  const [history, setHistory] = useState<HistoryEntry[]>(() => sanitizeHistory(loadJson(KEYS.history)));
  const [theme, setTheme] = useState<ThemeChoice>(() => sanitizeTheme(loadJson(KEYS.theme)));

  useEffect(() => void saveJson(KEYS.settings, draft), [draft]);
  useEffect(() => void saveJson(KEYS.history, history), [history]);
  useEffect(() => {
    saveJson(KEYS.theme, theme);
    const root = document.documentElement;
    if (theme === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", theme);
  }, [theme]);

  const validation = useMemo(() => validateDraft(draft), [draft]);
  const year = new Date().getFullYear();
  const wage = useMemo(
    () => (validation.settings ? computeWage(validation.settings, year) : null),
    [validation.settings, year],
  );

  function deleteEverything() {
    clearAll();
    setDraft({ ...defaultDraft, workdays: [...defaultDraft.workdays] });
    setHistory([]);
    setTheme("system");
  }

  return (
    <>
      <header className="app-header">
        <div>
          <h1>Is it worth it?</h1>
          <p className="muted">Was kostet ein Kauf in Arbeitszeit?</p>
        </div>
        <ThemeToggle value={theme} onChange={setTheme} />
      </header>

      <main>
        <Calculator
          wage={wage}
          settingsInvalid={validation.settings === null}
          onSave={(entry) => setHistory((h) => addEntry(h, entry))}
        />
        <SettingsForm draft={draft} errors={validation.errors} wage={wage} onChange={setDraft} />
        <HistoryList history={history} onClear={() => setHistory([])} />
        <PrivacyPanel onDeleteAll={deleteEverything} />
      </main>
    </>
  );
}
