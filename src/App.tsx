import { useEffect, useMemo, useState } from "react";
import { Calculator } from "./components/Calculator";
import { GitHubIcon } from "./components/GitHubIcon";
import { PrivacyPanel } from "./components/PrivacyPanel";
import { SettingsForm } from "./components/SettingsForm";
import { ThemeToggle } from "./components/ThemeToggle";
import { t } from "./i18n";
import { CREDIT_PREFIX, pickQuip } from "./lib/quips";
import { commitUrl, REPO_URL } from "./lib/repo";
import { defaultDraft, evaluateSettings, isDefaultDraft, sanitizeDraft, type SettingsDraft } from "./lib/settings";
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

  const year = new Date().getFullYear();
  const outcome = useMemo(() => evaluateSettings(draft, year), [draft, year]);
  // Start on the settings view while the salary data is not usable yet.
  const [view, setView] = useState<"calculator" | "settings">(() => (outcome.ok ? "calculator" : "settings"));
  // A returning user with their own stored data sees its errors at once, not only after leaving a field.
  const [revealErrors, setRevealErrors] = useState(() => !isDefaultDraft(draft));
  // Bumped by "delete everything" so the settings form starts over like on a first visit.
  const [resetCount, setResetCount] = useState(0);

  function deleteEverything() {
    clearAll();
    setDraft({ ...defaultDraft, workdays: [...defaultDraft.workdays] });
    setTheme("system");
    setRevealErrors(false);
    setResetCount((count) => count + 1);
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
            <SettingsForm
              key={resetCount}
              draft={draft}
              outcome={outcome}
              revealErrors={revealErrors}
              onChange={setDraft}
            />
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
