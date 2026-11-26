# Glossar

Begriffe der App „Lohnt es?“ und wie sie im Code heißen. Code ist Englisch, die Oberfläche Deutsch.

## Gehaltsdaten

Alles, was in der Ansicht „Einstellungen“ eingegeben wird: Netto (Monats- oder Jahresnetto, bei Monatsnetto mit Anzahl der Monatsgehälter), Wochenstunden, Arbeitstage, Urlaubstage und Bundesland.

- **Entwurf** (`SettingsDraft`): die Gehaltsdaten, wie das Formular sie hält. Textfelder bleiben Strings, damit halb getippte Eingaben nicht verloren gehen. Wird so in localStorage gespeichert.
- **Gehaltsdaten** (`Settings`): der validierte Entwurf mit Zahlen. Nur intern im Einstellungs-Modul.
- **Auswertung** (`evaluateSettings(draft, year)` → `SettingsOutcome`): die einzige Stelle, die entscheidet, ob die Gehaltsdaten nutzbar sind. Ergebnis ist entweder `{ ok: true, info }` mit dem Netto-Stundenlohn und der Zusammenfassung (`WageInfo`) oder `{ ok: false, errors }` mit Feldfehlern. Feldfehler sind der einzige Fehlerkanal; „kein Arbeitstag übrig“ ist ein Feldfehler an den Urlaubstagen.
- _Vermeiden_: „Settings“ für den Entwurf; „Lohnberechnung“ als eigener Schritt neben der Validierung.

## Arbeitstage

Zwei Bedeutungen, im Code getrennt benannt:

- **Arbeitstage** (`workdays`): die gewählten Wochentage, 0 = Sonntag … 6 = Samstag. Anzahl pro Woche: `workdaysPerWeek`.
- **Arbeitstage pro Jahr** (`workingDaysPerYear`): gewählte Wochentage im Jahr − Feiertage auf gewählten Arbeitstagen − Urlaubstage.

## Netto-Stundenlohn

`hourlyWage`: Jahresnetto / (Arbeitstage pro Jahr × Stunden pro Arbeitstag). Stunden pro Arbeitstag (`hoursPerDay`) = Wochenstunden / Arbeitstage pro Woche.
