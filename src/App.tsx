import { useEffect, useMemo, useReducer } from "react";
import { AppFooter } from "./components/AppFooter";
import { Calculator } from "./components/Calculator";
import { PrivacyPanel } from "./components/PrivacyPanel";
import { SettingsForm } from "./components/SettingsForm";
import { ThemeToggle } from "./components/ThemeToggle";
import { t } from "./i18n";
import { appReducer, initAppState } from "./lib/appState";
import { loadPreferences, resetPreferences, savePreferences } from "./lib/preferences";
import { evaluateSettings, visibleErrors } from "./lib/settings";
import { applyTheme } from "./lib/theme";

const currentYear = () => new Date().getFullYear();

export function App() {
  const [state, dispatch] = useReducer(appReducer, undefined, () => initAppState(loadPreferences(), currentYear()));
  const { draft, theme, view, touched } = state;

  useEffect(() => savePreferences({ draft, theme }), [draft, theme]);
  useEffect(() => applyTheme(theme, document.documentElement), [theme]);

  const year = currentYear();
  const outcome = useMemo(() => evaluateSettings(draft, year), [draft, year]);
  const errors = useMemo(() => visibleErrors(outcome, touched), [outcome, touched]);

  // resetPreferences clears the storage and hands back the fresh defaults for the App-Zustand.
  const deleteEverything = () => dispatch({ type: "reset", preferences: resetPreferences() });

  return (
    <>
      <header className="app-header">
        <div>
          <h1>{t.app.title}</h1>
          <p className="muted">{t.app.tagline}</p>
        </div>
        <ThemeToggle value={theme} onChange={(choice) => dispatch({ type: "chooseTheme", theme: choice })} />
      </header>

      <nav className="view-nav" aria-label={t.app.navLabel}>
        <button
          type="button"
          className={view === "calculator" ? undefined : "secondary"}
          aria-current={view === "calculator" ? "page" : undefined}
          onClick={() => dispatch({ type: "showView", view: "calculator" })}
        >
          {t.app.navCalculator}
        </button>
        <button
          type="button"
          className={view === "settings" ? undefined : "secondary"}
          aria-current={view === "settings" ? "page" : undefined}
          onClick={() => dispatch({ type: "showView", view: "settings" })}
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
            <SettingsForm
              draft={draft}
              outcome={outcome}
              errors={errors}
              onChange={(edited) => dispatch({ type: "editDraft", draft: edited })}
              onTouch={(input) => dispatch({ type: "touch", input })}
            />
            <PrivacyPanel onDeleteAll={deleteEverything} />
          </div>
        )}
      </main>
      <AppFooter showPrivacyNote={view === "calculator"} />
    </>
  );
}
