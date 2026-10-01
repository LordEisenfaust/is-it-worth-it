interface Props {
  onDeleteAll: () => void;
}

export function PrivacyPanel({ onDeleteAll }: Props) {
  function confirmAndDelete() {
    if (window.confirm("Wirklich alle gespeicherten Daten (Gehaltsdaten, Verlauf, Darstellung) löschen?")) {
      onDeleteAll();
    }
  }

  return (
    <section aria-labelledby="privacy-title" className="card">
      <h2 id="privacy-title">Datenschutz</h2>
      <p>
        Alle Angaben bleiben ausschließlich lokal in deinem Browser (localStorage). Es gibt kein Backend, keinen Login
        und keine Übertragung an Dritte.
      </p>
      <button type="button" className="danger" onClick={confirmAndDelete}>
        Alle gespeicherten Daten löschen
      </button>
    </section>
  );
}
