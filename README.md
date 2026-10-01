# Lohnt sich's?

*Der Rechner, den dein Warenkorb hasst.* (Früher „Is it worth it?“; Repository und URL heißen weiterhin `is-it-worth-it`.)

Eine kleine Web-App, die Einkäufe in Arbeitszeit umrechnet. Beispiel: Bei 600 € zeigt sie, wie viele Arbeitsstunden bzw. Arbeitstage das nach Abzug von Urlaub und Feiertagen ungefähr entspricht.

## Funktionen

- **Einstellungen:** Gehaltsdaten (eigene Ansicht neben dem Rechner, beim ersten Start geöffnet): Jahres- oder Monatsnetto (bei Monatsnetto 12 bis 16 Gehälter), Wochenstunden, frei wählbare Arbeitstage, Urlaubstage und Bundesland für die Feiertage
- **Rechner:** Betrag eingeben, das Ergebnis erscheint automatisch in zwei Einheiten (z. B. „3 Stunden und 48 Minuten“ oder „6 Tage und 1 Stunde“), mit einem frechen Kommentar, der mit dem Betrag schärfer wird
- **Dunkelmodus:** folgt dem System und lässt sich manuell umschalten
- **Als App installierbar und offline nutzbar (PWA):** im Browser „Zum Startbildschirm hinzufügen“ bzw. „Installieren“; nach dem ersten Besuch funktioniert die App auch ohne Netz
- **Datenschutz:** ein Button löscht alle gespeicherten Daten
- **Fußzeile:** Version und Commit-Hash, darunter bei jedem Aufruf ein anderer von 40 frechen Sprüchen

## Datenschutz

Es gibt kein Backend und keinen Login. Alle Eingaben werden ausschließlich im `localStorage` deines Browsers gespeichert (Schlüssel mit Präfix `iiwi:`) und nirgendwohin übertragen. Es gibt kein Tracking und keine Analyse-Tools.

Für den Offline-Betrieb speichert der Browser die Dateien der App (HTML, JavaScript, CSS, Symbole) in seinem Cache; deine Eingaben sind darin nicht enthalten.

Wie bei jeder Webseite sieht der Hoster (GitHub Pages) beim Aufruf technisch die IP-Adresse; die eingegebenen Daten erreichen ihn nicht.

## Berechnung

```
Jahresnetto     = Monatsnetto × Anzahl Monatsgehälter   (oder direkte Eingabe)
Arbeitstage     = gewählte Wochentage im Jahr − Feiertage auf diesen Tagen − Urlaubstage
Stunden pro Tag = Wochenstunden / Anzahl Arbeitstage pro Woche
Stundenlohn     = Jahresnetto / (Arbeitstage × Stunden pro Tag)
Arbeitszeit     = Betrag / Stundenlohn
```

Gerechnet wird mit dem aktuellen Kalenderjahr. Die Feiertage sind fest eingebaut, bewegliche Feiertage werden über die Osterformel von Meeus/Jones/Butcher berechnet. Berücksichtigt werden nur landesweite gesetzliche Feiertage; regionale Feiertage innerhalb eines Bundeslandes (z. B. Fronleichnam in Teilen Sachsens) und einmalige Feiertage fehlen.

## Entwicklung

Voraussetzung: Node.js und npm.

```bash
npm install
npm run dev        # Entwicklungsserver
npm test           # Unit-Tests (Vitest)
npm run typecheck  # TypeScript-Prüfung
npm run build      # statisches Build nach dist/
npm run test:e2e   # Oberflächen-Tests im Browser (Playwright, Desktop und Handy)
```

Für die Oberflächen-Tests einmalig `npx playwright install chromium` ausführen. Ist bereits ein Chromium installiert, kann es stattdessen mit `PW_CHROMIUM_PATH=/pfad/zu/chromium npm run test:e2e` genutzt werden. Die Tests frieren das Datum auf den 1. Oktober 2026 ein, damit Feiertage und Arbeitstage stabil bleiben.

Das Build nutzt `base: "./"` und läuft dadurch auf jedem statischen Hosting, auch unter einem Unterpfad.

### Versionierung

Die App zeigt unten ihre Version und den Commit-Hash des Builds an, z. B. „Version 0.3.0 (540fcca)“. Der Hash wird bei jedem Build automatisch eingesetzt und verlinkt auf genau diesen Commit; daneben führt das GitHub-Logo zum Repository. Die Versionsnummer kommt aus `package.json` und muss bei jeder Änderung an der App erhöht werden:

```bash
npm version patch --no-git-tag-version   # Fehlerbehebung: 0.2.0 → 0.2.1
npm version minor --no-git-tag-version   # neue Funktion:  0.2.0 → 0.3.0
```

Die CI lässt Pull Requests fehlschlagen, wenn sich die App ändert, die Version aber nicht (reine Doku-, CI- und Test-Änderungen sind ausgenommen, ebenso Abhängigkeits-Updates von Dependabot).

### Abhängigkeiten

Dependabot schlägt einmal im Monat gebündelte Updates für npm-Pakete und GitHub Actions als Pull Request vor (`.github/dependabot.yml`). Diese PRs laufen durch Tests, Typecheck und Build und müssen von Hand gemergt werden.

## Aufbau

- `src/lib/`: reine Berechnungslogik ohne React, mit Tests (Feiertage, Lohn, Formatierung, Validierung, Speicher)
- `src/i18n/de.ts`: Textkatalog mit allen sichtbaren Texten der App (Oberfläche, Fehlermeldungen, Sprüche, Feiertage)
- `src/components/`: React-Komponenten der Oberfläche
- `scripts/pwa-plugin.ts`: erzeugt beim Build Manifest und Service Worker (Offline-Betrieb); `scripts/render-icons.mjs` rendert die App-Symbole aus `scripts/icons/hourglass.svg.tpl`
- `src/App.tsx`: Zustand und Zusammenspiel der Komponenten

## Stand

- Die Feiertagstabelle je Bundesland ist noch nicht stichprobenartig gegen eine verlässliche Quelle geprüft.
