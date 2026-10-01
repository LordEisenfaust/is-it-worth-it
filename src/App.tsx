import { useEffect, useMemo, useState } from "react";
import { Calculator } from "./components/Calculator";
import { GitHubIcon } from "./components/GitHubIcon";
import { PrivacyPanel } from "./components/PrivacyPanel";
import { SettingsForm } from "./components/SettingsForm";
import { ThemeToggle } from "./components/ThemeToggle";
import { t } from "./i18n";
import { computeWage } from "./lib/calc";
import { CREDIT_PREFIX, pickQuip } from "./lib/quips";
import { commitUrl, REPO_URL } from "./lib/repo";
import { defaultDraft, sanitizeDraft, validateDraft, type SettingsDraft } from "./lib/settings";
import { clearAll, KEYS, loadJson, PREFIX, saveUnlessDefault } from "./lib/storage";
import { sanitizeTheme, type ThemeChoice } from "./lib/theme";

export function App() {
  const [draft, setDraft] = useState<SettingsDraft>(() => sanitizeDraft(loadJson(KEYS.settings)));
  const [theme, setTheme] = useState<ThemeChoice>(() => sanitizeTheme(loadJson(KEYS.theme)));
  // A new quip on every page load; nothing is stored.
  const [quip] = useState(pickQuip);
  const commitLink = commitUrl(__APP_COMMIT__);

  // The history feature was removed; drop data left over from earlier versions.
  useEffect(() => {
    try {
      window.localStorage.removeItem(`${PREFIX}history`);
    } catch {
      // Storage unavailable.
    }
  }, []);
  useEffect(() => void saveUnlessDefault(KEYS.settings, draft, defaultDraft), [draft]);
  useEffect(() => {
    saveUnlessDefault(KEYS.theme, theme, "system");
    const root = document.documentElement;
    if (theme === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", theme);
  }, [theme]);

  const validation = useMemo(() => validateDraft(draft), [draft]);
  // Start on the settings view while there is no valid salary data yet.
  const [view, setView] = useState<"calculator" | "settings">(() =>
    validateDraft(draft).settings === null ? "settings" : "calculator",
  );
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
          <Calculator
            wage={wage}
            settingsInvalid={validation.settings === null}
            workdaysPerWeek={validation.settings?.workdays.length ?? 0}
          />
        </div>
        {view === "settings" && (
          <div id="settings-panel">
            <SettingsForm draft={draft} errors={validation.errors} wage={wage} onChange={setDraft} />
            <PrivacyPanel onDeleteAll={deleteEverything} />
          </div>
        )}
      </main>
      {view === "calculator" && (
        <footer className="muted">{t.app.privacyFooter}</footer>
      )}
      <div className="app-meta">
        <p>
          {t.app.version} {__APP_VERSION__} (
          {commitLink ? (
            <a href={commitLink} target="_blank" rel="noopener noreferrer" title={t.app.commitTitle}>
              {__APP_COMMIT__}
            </a>
          ) : (
            __APP_COMMIT__
          )}
          ) ·{" "}
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer" aria-label={t.app.repoLabel} title={t.app.repoLabel}>
            <GitHubIcon />
          </a>
        </p>
        <p>
          {CREDIT_PREFIX} {quip}
        </p>
      </div>
    </>
  );
}
