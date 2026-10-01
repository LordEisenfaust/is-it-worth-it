# Is it worth it?

Eine kleine Web-App, die Einkäufe in Arbeitszeit umrechnet. Beispiel: Bei 600 € zeigt sie, wie viele Arbeitsstunden bzw. Arbeitstage das nach Abzug von Urlaub und Feiertagen ungefähr entspricht.

## Funktionen

- **Einstellungen:** Gehaltsdaten (eigene Ansicht neben dem Rechner, beim ersten Start geöffnet): Jahres- oder Monatsnetto (bei Monatsnetto 12 bis 16 Gehälter), Wochenstunden, frei wählbare Arbeitstage, Urlaubstage und Bundesland für die Feiertage
- **Rechner:** Betrag eingeben, das Ergebnis erscheint automatisch in zwei Einheiten (z. B. „3 Stunden und 48 Minuten“ oder „6 Tage und 1 Stunde“), mit einem frechen Kommentar, der mit dem Betrag schärfer wird
- **Dunkelmodus:** folgt dem System und lässt sich manuell umschalten
- **Datenschutz:** ein Button löscht alle gespeicherten Daten
- **Fußzeile:** bei jedem Aufruf ein anderer von 40 frechen Sprüchen, darunter Version und Commit-Hash

## Datenschutz

Es gibt kein Backend und keinen Login. Alle Eingaben werden ausschließlich im `localStorage` deines Browsers gespeichert (Schlüssel mit Präfix `iiwi:`) und nirgendwohin übertragen.

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
```

Das Build nutzt `base: "./"` und läuft dadurch auf jedem statischen Hosting, auch unter einem Unterpfad.

### Versionierung

Die App zeigt unten ihre Version und den Commit-Hash des Builds an, z. B. „Version 0.3.0 (540fcca)“. Der Hash wird bei jedem Build automatisch eingesetzt. Die Versionsnummer kommt aus `package.json` und muss bei jeder Änderung an der App erhöht werden:

```bash
npm version patch --no-git-tag-version   # Fehlerbehebung: 0.2.0 → 0.2.1
npm version minor --no-git-tag-version   # neue Funktion:  0.2.0 → 0.3.0
```

Die CI lässt Pull Requests fehlschlagen, wenn sich die App ändert, die Version aber nicht (reine Doku- und CI-Änderungen sind ausgenommen).

## Aufbau

- `src/lib/`: reine Berechnungslogik ohne React, mit Tests (Feiertage, Lohn, Formatierung, Validierung, Speicher)
- `src/components/`: React-Komponenten der Oberfläche
- `src/App.tsx`: Zustand und Zusammenspiel der Komponenten

## Stand

- Die Feiertagstabelle je Bundesland ist noch nicht stichprobenartig gegen eine verlässliche Quelle geprüft.
