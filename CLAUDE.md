# Lohnt sich's? (Repository: is-it-worth-it)

Name der App: „Lohnt sich's?“, Untertitel: „Der Rechner, den dein Warenkorb hasst.“ (früher „Is it worth it?“).

Web-Applikation, mit der man Einkäufe in Arbeitszeit verrechnen kann.
Beispiel: Nutzer gibt 600 € ein, die App zeigt "Das entspricht ca. 4 Arbeitstagen" bzw. "32 Arbeitsstunden".

Sprache der Oberfläche: Deutsch. Code und Kommentare: Englisch oder Deutsch, aber einheitlich (Vorschlag: Code Englisch, UI-Texte Deutsch).

## Tech-Stack

- React + Vite + TypeScript
- Kein Backend, kein Login
- Speicherung ausschließlich in localStorage (Schlüssel-Präfix `iiwi:`)
- Tests mit Vitest für die Berechnungslogik
- Statisches Build (`base: "./"`), soll sich überall hosten lassen

## Funktionen der ersten Version

1. **Einrichtung (Gehaltsdaten)** – in einer eigenen Ansicht „Einstellungen“, getrennt vom Rechner; beim ersten Start (ungültige Daten) geöffnet
   - Umschalter: Jahresnetto oder Monatsnetto
   - Bei Monatsnetto: Anzahl der Monatsgehälter pro Jahr per Slider (12 bis 16, ganze Schritte, Standard 12)
   - Wochenstunden
   - Frei wählbare Arbeitstage (Mo bis So), Standard Mo bis Fr
   - Urlaubstage pro Jahr
   - Bundesland (alle 16) für die Feiertage
2. **Rechner**
   - Eingabe eines Eurobetrags
   - Ausgabe als Arbeitszeit, Einheit je nach Größe automatisch, immer in höchstens zwei ganzen Einheiten: Minuten; Stunden und Minuten; Tage und Stunden (z. B. „6 Tage und 1 Stunde“)
   - Ton der Ausgabe: „frech“, steigert sich mit dem Betrag (Vorschlag C). Alle drei Varianten (A, B, C) stehen in `docs/ausgabe-varianten.md`, damit später umentschieden werden kann.
   - Fußzeile: oben die Version mit verlinktem Commit-Hash und GitHub-Logo als Link zum Repository (ohne Text, mit `aria-label`; Inline-SVG, nichts wird von GitHub geladen), darunter „Vibecoded with ♥️ by Claude Opus 5.5 – <Spruch>“, Spruch zufällig aus 40 (im Textkatalog `src/i18n/de.ts`, Liste auch in `docs/footer-sprueche.md`)
3. **Dunkelmodus**
   - Folgt dem System, zusätzlich manuell umschaltbar, Auswahl wird gespeichert
4. **Datenschutz**
   - Button, der alle gespeicherten Daten löscht
   - Hinweis in der UI, dass alles nur lokal im Browser liegt

## Berechnung

- Jahresnetto = Monatsnetto × Anzahl Monatsgehälter (oder direkte Eingabe)
- Jahresarbeitstage = Anzahl der gewählten Wochentage im Jahr − Feiertage, die auf einen gewählten Arbeitstag fallen − Urlaubstage
- Stunden pro Arbeitstag = Wochenstunden / Anzahl gewählter Arbeitstage
- Netto-Stundenlohn = Jahresnetto / (Jahresarbeitstage × Stunden pro Arbeitstag)
- Arbeitszeit für einen Betrag = Betrag / Netto-Stundenlohn

Für das Jahr der Berechnung wird das aktuelle Kalenderjahr verwendet.

## Feiertage

- Eigene, fest eingebaute Tabelle (keine externe API, keine Bibliothek)
- Bewegliche Feiertage über die Osterformel (Gauß/Meeus) berechnen
- Pro Bundesland die gesetzlichen Feiertage abbilden; Sonderfälle nur auf Landesebene (z. B. Mariä Himmelfahrt in Bayern, Fronleichnam, Buß- und Bettag in Sachsen)
- Unit-Tests: Ostersonntag für mehrere Jahre, Feiertagsanzahl je Bundesland für ein Beispieljahr, Feiertag am Wochenende zählt nicht

## Qualität

- Berechnungslogik als reine Funktionen in `src/lib/`, ohne React-Abhängigkeit, mit Tests
- Eingaben validieren (keine negativen oder leeren Werte, Division durch null abfangen)
- Barrierefrei: Labels an Formularfeldern, ausreichender Kontrast in beiden Themes
- Vor jedem Abschluss: `npm test`, `npm run typecheck`, `npm run build`
- Texte: Alle sichtbaren Texte stehen ausschließlich im Textkatalog `src/i18n/de.ts` (Zugriff über `t` aus `src/i18n`), nie direkt in Komponenten oder `src/lib/`. Ausnahme: `<title>` in `index.html` (vor dem JavaScript nötig), bei Namensänderung mitpflegen. Eine weitere Sprache bräuchte nur eine Datei mit derselben Form (`Texts`-Typ); Hinweis: die Betragseingabe liest „1.599“ als 1599 (deutsches Format) und müsste dann sprachabhängig werden.
- Versionierung: Jede Änderung an der App (alles außer `*.md`, `docs/`, `.github/`) erhöht die Version in `package.json` (`npm version patch --no-git-tag-version` für Fehlerbehebungen, `minor` für neue Funktionen). Die CI prüft das per `scripts/check-version-bump.mjs` (ausgenommen PRs von Dependabot, das monatlich gebündelte Updates für npm und GitHub Actions vorschlägt). Version und Commit-Hash werden beim Build eingesetzt und unten in der App angezeigt.

## Offene Punkte

- Keine.

## Erledigt

- Feiertagstabelle geprüft (Oktober 2026): Abgleich aller 16 Bundesländer für 2020–2030 gegen die Bibliotheken `feiertagejs` (keine Abweichung) und `date-holidays` (nur bewusste Abweichungen):
  - Berliner Einmalfeiertage (8. Mai 2020/2025, 17. Juni 2028) werden bewusst nicht berücksichtigt („normaler Zustand“).
  - Mariä Himmelfahrt zählt in Bayern bewusst landesweit, obwohl er nur in überwiegend katholischen Gemeinden gilt (trifft auf den Großteil Bayerns zu).
