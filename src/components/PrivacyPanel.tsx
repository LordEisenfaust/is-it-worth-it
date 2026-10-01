import { t } from "../i18n";

interface Props {
  onDeleteAll: () => void;
}

export function PrivacyPanel({ onDeleteAll }: Props) {
  function confirmAndDelete() {
    if (window.confirm(t.privacy.deleteConfirm)) {
      onDeleteAll();
    }
  }

  return (
    <section aria-labelledby="privacy-title" className="card">
      <h2 id="privacy-title">{t.privacy.title}</h2>
      <p>{t.privacy.text}</p>
      <button type="button" className="danger" onClick={confirmAndDelete}>
        {t.privacy.deleteButton}
      </button>
    </section>
  );
}
