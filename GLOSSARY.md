# Glossar

Begriffe der App „Lohnt es?“ und wie sie im Code heißen. Code ist Englisch, die Oberfläche Deutsch.

## Gehaltsdaten

Alles, was in der Ansicht „Einstellungen“ eingegeben wird: Netto (Monats- oder Jahresnetto, bei Monatsnetto mit Anzahl der Monatsgehälter), Wochenstunden, Arbeitstage, Urlaubstage und Bundesland.

- **Entwurf** (`SettingsDraft`): die Gehaltsdaten, wie das Formular sie hält. Textfelder bleiben Strings, damit halb getippte Eingaben nicht verloren gehen. Wird so in localStorage gespeichert.
- **Gehaltsdaten** (`Settings`): der validierte Entwurf mit Zahlen. Nur intern im Einstellungs-Modul.
- **Auswertung der Gehaltsdaten** (`evaluateSettings(draft, year)` → `SettingsOutcome`): die einzige Stelle, die entscheidet, ob die Gehaltsdaten nutzbar sind. Ergebnis ist entweder `{ ok: true, info }` mit dem Netto-Stundenlohn und der Zusammenfassung (`WageInfo`) oder `{ ok: false, errors }` mit Feldfehlern (`FieldError`, mit Quellen). Feldfehler sind der einzige Fehlerkanal; „kein Arbeitstag übrig“ ist ein Feldfehler an den Urlaubstagen.
- **Feldfehler** (`FieldError`): Text plus **Quellen** (`sources`), die Eingaben, aus denen der Fehler entsteht. Meist nur das eigene Feld; „zu viele/zu wenige Stunden pro Tag“ (an den Wochenstunden) hat die Quellen Wochenstunden und Arbeitstage, „kein Arbeitstag übrig“ (an den Urlaubstagen) Arbeitstage, Urlaubstage und Bundesland.
- **Sichtbare Feldfehler** (`visibleErrors(outcome, touched)` → `VisibleErrors`): Ein Feldfehler ist sichtbar, sobald eine seiner Quellen **berührt** ist. Berührbare Eingaben (`SettingsInput`) sind die Fehlerfelder und das Bundesland; Textfelder gelten beim Verlassen als berührt, Arbeitstage und Bundesland bei der Änderung. Start mit eigenen Daten = alles berührt, „Alle Daten löschen“ = nichts berührt. Den Zustand hält `App.tsx`; das Formular zeigt nur an. Gewollt: Ist eine Quelle schon berührt, erscheint der Fehler auch beim Tippen in einem anderen Textfeld sofort, nicht erst beim Verlassen.
- _Vermeiden_: „Settings“ für den Entwurf; „Lohnberechnung“ als eigener Schritt neben der Validierung; „touched“ als eigener Zustand im Formular; Querregeln („diese Änderung betrifft auch jenes Feld“) außerhalb von `evaluateSettings`.

## Arbeitstage

Zwei Bedeutungen, im Code getrennt benannt:

- **Arbeitstage** (`workdays`): die gewählten Wochentage, 0 = Sonntag … 6 = Samstag. Anzahl pro Woche: `workdaysPerWeek`.
- **Arbeitstage pro Jahr** (`workingDaysPerYear`): gewählte Wochentage im Jahr − Feiertage auf gewählten Arbeitstagen − Urlaubstage.

## Netto-Stundenlohn

`hourlyWage`: Jahresnetto / (Arbeitstage pro Jahr × Stunden pro Arbeitstag). Stunden pro Arbeitstag (`hoursPerDay`) = Wochenstunden / Arbeitstage pro Woche. Sie liegen zwischen 1 und 24; außerhalb davon sind die Gehaltsdaten nicht nutzbar.

Fallen zwei Feiertage auf denselben Tag, zählt dieser Tag nur einmal.

## Ergebnis

Was der Ergebniskasten im Rechner zu einem eingegebenen **Betrag** zeigt.

- **Auswertung des Betrags** (`evaluateAmount(amountText, outcome)` → `AmountResult`): die einzige Stelle, die entscheidet, was im Kasten steht. Ergebnis ist eins von drei:
  - `empty`: noch kein Betrag; der Rechner zeigt einen zufälligen Leertext.
  - `hint`: ein Hinweis mit `cause` – `"settings"`, wenn die Gehaltsdaten nicht nutzbar sind (hat Vorrang), sonst `"amount"`, wenn der Betrag ungültig ist.
  - `verdict`: das Verdict.
- **Verdict** mit **Stufe** (`VerdictLevel`) 1–4: 1 = unter einer Stunde, 2 = unter einem Arbeitstag, 3 = unter einer Arbeitswoche, 4 = eine Woche oder mehr. Der Ton steigert sich mit der Stufe („Vorschlag C“ in `docs/ausgabe-varianten.md`). Jedes Verdict hat Überschrift (`headline`) und Kommentar (`comment`).
- **Graue Zeile** (`greyLine`): ab Stufe 3 der Betrag in Euro und die genaue Arbeitszeit, z. B. „1.599,00 € · ≈ 29 Stunden und 42 Minuten“; bei Stufe 1–2 gibt es keine.

## Gespeicherte Daten

Was die App im Browser behält (`Preferences` in `src/lib/preferences.ts`): den **Entwurf** der Gehaltsdaten und die **Darstellung** (`ThemeChoice`: System, hell, dunkel). Nur in localStorage, Schlüssel mit dem Präfix `iiwi:`.

- **Laden** (`loadPreferences`): gesäubert; unbrauchbare Felder fallen auf Standardwerte zurück, Reste des früheren Verlaufs werden entfernt.
- **Speichern** (`savePreferences`): Standardwerte werden nicht gespeichert, ihr Schlüssel wird entfernt. „Standard“ ist fachlich gemeint: Der Entwurf zählt auch mit anders sortierten Arbeitstagen als Standard (`isDefaultDraft`).
- **Alle Daten löschen** (`resetPreferences`): entfernt alle Schlüssel mit `iiwi:`, lässt fremde stehen und liefert frische Standardwerte, die dann nicht zurückgeschrieben werden.
