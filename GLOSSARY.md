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

## Ergebnis

Was der Ergebniskasten im Rechner zu einem eingegebenen **Betrag** zeigt.

- **Auswertung** (`evaluateAmount(amountText, outcome)` → `AmountResult`): die einzige Stelle, die entscheidet, was im Kasten steht. Ergebnis ist eins von drei:
  - `empty`: noch kein Betrag; der Rechner zeigt einen zufälligen Leertext.
  - `hint`: ein Hinweis mit `cause` – `"settings"`, wenn die Gehaltsdaten nicht nutzbar sind (hat Vorrang), sonst `"amount"`, wenn der Betrag ungültig ist.
  - `verdict`: das Verdict.
- **Verdict** mit **Stufe** (`VerdictLevel`) 1–4: 1 = unter einer Stunde, 2 = unter einem Arbeitstag, 3 = unter einer Arbeitswoche, 4 = eine Woche oder mehr. Der Ton steigert sich mit der Stufe („Vorschlag C“ in `docs/ausgabe-varianten.md`). Jedes Verdict hat Überschrift (`headline`) und Kommentar (`comment`).
- **Graue Zeile** (`greyLine`): ab Stufe 3 der Betrag in Euro und die genaue Arbeitszeit, z. B. „1.599,00 € · ≈ 29 Stunden und 42 Minuten“; bei Stufe 1–2 gibt es keine.
