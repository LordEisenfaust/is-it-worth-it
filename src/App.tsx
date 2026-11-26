import { useEffect, useMemo, useState } from "react";
import { AppFooter } from "./components/AppFooter";
import { Calculator } from "./components/Calculator";
import { PrivacyPanel } from "./components/PrivacyPanel";
import { SettingsForm } from "./components/SettingsForm";
import { ThemeToggle } from "./components/ThemeToggle";
import { t } from "./i18n";
import { loadPreferences, resetPreferences, savePreferences } from "./lib/preferences";
import {
  ALL_INPUTS,
  evaluateSettings,
  isDefaultDraft,
  visibleErrors,
  type SettingsDraft,
  type SettingsInput,
} from "./lib/settings";
import { applyTheme, type ThemeChoice } from "./lib/theme";

export function App() {
  const [initial] = useState(loadPreferences);
  const [draft, setDraft] = useState<SettingsDraft>(initial.draft);
  const [theme, setTheme] = useState<ThemeChoice>(initial.theme);

  useEffect(() => savePreferences({ draft, theme }), [draft, theme]);
  useEffect(() => applyTheme(theme, document.documentElement), [theme]);

  const year = new Date().getFullYear();
  const outcome = useMemo(() => evaluateSettings(draft, year), [draft, year]);
  // Start on the settings view while the salary data is not usable yet.
  const [view, setView] = useState<"calculator" | "settings">(() => (outcome.ok ? "calculator" : "settings"));
  // A returning user with their own stored data sees its errors at once: everything counts as touched.
  const [touched, setTouched] = useState<ReadonlySet<SettingsInput>>(
    () => new Set(isDefaultDraft(draft) ? [] : ALL_INPUTS),
  );
  const errors = useMemo(() => visibleErrors(outcome, touched), [outcome, touched]);

  function touch(input: SettingsInput) {
    setTouched((current) => (current.has(input) ? current : new Set([...current, input])));
  }

  function deleteEverything() {
    const fresh = resetPreferences();
    setDraft(fresh.draft);
    setTheme(fresh.theme);
    // Like a first visit: no error shows before the user touches an input.
    setTouched(new Set());
  }

  return (
    <>
      <header className="app-header">
        <div>
          <h1>{t.app.title}</h1>
          <p className="muted">{t.app.tagline}</p>
        </div>
        <ThemeToggle value={theme} onChange={setTheme} />
      </header>

      <nav className="view-nav" aria-label={t.app.navLabel}>
        <button
          type="button"
          className={view === "calculator" ? undefined : "secondary"}
          aria-current={view === "calculator" ? "page" : undefined}
          onClick={() => setView("calculator")}
        >
          {t.app.navCalculator}
        </button>
        <button
          type="button"
          className={view === "settings" ? undefined : "secondary"}
          aria-current={view === "settings" ? "page" : undefined}
          onClick={() => setView("settings")}
        >
          {t.app.navSettings}
        </button>
      </nav>

      <main>
        {/* Kept mounted (just hidden) so the entered amount survives a visit to the settings. */}
        <div hidden={view !== "calculator"}>
          <Calculator outcome={outcome} />
        </div>
        {view === "settings" && (
          <div id="settings-panel">
            <SettingsForm draft={draft} outcome={outcome} errors={errors} onChange={setDraft} onTouch={touch} />
            <PrivacyPanel onDeleteAll={deleteEverything} />
          </div>
        )}
      </main>
      <AppFooter showPrivacyNote={view === "calculator"} />
    </>
  );
}
