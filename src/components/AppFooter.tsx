import { useState } from "react";
import { t } from "../i18n";
import { pickFrom } from "../lib/random";
import { commitUrl, REPO_URL } from "../lib/repo";
import { GitHubIcon } from "./GitHubIcon";

interface Props {
  /** The short privacy note belongs to the calculator view only. */
  showPrivacyNote: boolean;
}

/** Everything below the main area: privacy note, version with commit link and GitHub logo, credit with a quip. */
export function AppFooter({ showPrivacyNote }: Props) {
  // A new quip on every page load; stays the same while the page is open, nothing is stored.
  const [quip] = useState(() => pickFrom(t.footer.quips));
  const commitLink = commitUrl(__APP_COMMIT__);
  const { before, after } = t.footer.versionLine(__APP_VERSION__);

  return (
    <>
      {showPrivacyNote && <footer className="muted">{t.footer.privacyNote}</footer>}
      <div className="app-meta">
        <p>
          {before}
          {commitLink ? (
            <a href={commitLink} target="_blank" rel="noopener noreferrer" title={t.footer.commitTitle}>
              {__APP_COMMIT__}
            </a>
          ) : (
            __APP_COMMIT__
          )}
          {after}{" "}
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t.footer.repoLabel}
            title={t.footer.repoLabel}
          >
            <GitHubIcon />
          </a>
        </p>
        <p>
          {t.footer.creditPrefix} {quip}
        </p>
      </div>
    </>
  );
}
