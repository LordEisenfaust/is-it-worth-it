# Varianten für die Ergebnis-Ausgabe

Ziel der Ausgabe: Der Nutzer soll hinterfragen, ob ein Kauf die nötige Arbeitszeit wert ist.
Drei Vorschläge wurden ausgearbeitet. **Umgesetzt ist Vorschlag C** (`src/lib/verdict.ts`).
Falls C zu frech wirkt, kann auf A oder B umgestellt werden.

Beispielwerte: 3000 € netto im Monat, 12 Gehälter, 8 Stunden pro Tag, Mo–Fr (ca. 20 € pro Stunde).
Die Oberfläche duzt.

Vorherige, neutrale Ausgabe: „600,00 € entsprechen ca. 3,7 Arbeitstage“, darunter „≈ 29,7 Arbeitsstunden“.

## Vorschlag A: „Der Spiegel“

Direkte Ansprache, rechnet in Lebenszeit, endet immer mit derselben Frage. Provokant, aber nicht albern.
Aufwand: gering, nur Texte.

| Betrag | Überschrift | Zeile darunter |
|---|---|---|
| 15 € | Dafür arbeitest du 45 Minuten. | 45 Minuten deines Lebens. Ist es das wert? |
| 120 € | Dafür arbeitest du 5,9 Stunden. | Ein fast voller Arbeitstag deines Lebens. Ist es das wert? |
| 600 € | Dafür arbeitest du 3,7 Tage. | 29,7 Stunden deines Lebens. Ist es das wert? |

## Vorschlag B: „Der Alltags-Vergleich“

Bildet die Zeit auf die eigene Arbeitswoche ab (berücksichtigt die gewählten Arbeitstage). Anschaulich, Aha-Effekt.
Aufwand: mittel, Abbildung auf Wochentage und Wochen muss programmiert werden.

| Betrag | Überschrift | Zeile darunter |
|---|---|---|
| 15 € | 45 Minuten Arbeit. | Deine erste Dreiviertelstunde am Montagmorgen geht nur dafür drauf. |
| 120 € | 5,9 Stunden Arbeit. | Du arbeitest den ganzen Montag bis kurz vor Feierabend nur dafür. |
| 600 € | 3,7 Tage Arbeit. | Montag bis Donnerstagnachmittag, alles nur für diesen Kauf. |
| 2000 € | 12,4 Tage Arbeit. | Zweieinhalb Wochen ohne einen Cent für dich. |

## Vorschlag C: „Die Eskalation“ (umgesetzt)

Der Ton steigert sich mit der Höhe des Betrags, von gelassen bis frech. Der Ergebniskasten bekommt
je Stufe einen farbigen Rand (neutral, gelb, orange, rot). Darunter steht klein der Betrag.

| Stufe | Grenze | Beispiel | Überschrift | Zeile darunter |
|---|---|---|---|---|
| 1 | unter 1 Stunde | 15 € | 45 Minuten. Gönn dir. | So schnell verdient, so schnell ausgegeben. |
| 2 | unter 1 Arbeitstag | 120 € | 5 Stunden und 54 Minuten Arbeit. | Ein Großteil deines Arbeitstags. Brauchst du das wirklich? (unter einem halben Tag: „Ein ordentliches Stück deines Arbeitstags.“) |
| 3 | unter 1 Arbeitswoche | 600 € | 3 Tage und 6 Stunden Schufterei. | Schlaf lieber noch eine Nacht drüber. |
| 4 | ab 1 Arbeitswoche | 2000 € | 12 Tage und 3 Stunden Arbeit. Ernsthaft? | 2 Wochen und 2 Tage deines Lebens. Das muss es dir wert sein. |

Eine Arbeitswoche entspricht der Anzahl der gewählten Arbeitstage.

Zeitangaben werden immer in höchstens zwei ganze Einheiten zerlegt: Minuten; Stunden und Minuten;
Tage und Stunden; Wochen und Tage (z. B. 6,1 Tage → „6 Tage und 1 Stunde“, 3,8 Stunden →
„3 Stunden und 48 Minuten“). Ab Stufe 3 steht klein darunter die genaue Arbeitszeit
(„≈ 29 Stunden und 42 Minuten“).

Mögliche Erweiterungen: zufällig wechselnde Textvarianten je Stufe; die „Lebenszeit“-Zeile aus A
oder die Wochentags-Abbildung aus B übernehmen.

## Leerer Ergebniskasten

Solange kein Betrag eingegeben ist, steht im Ergebniskasten einer von sechs Texten, zufällig pro
Seitenaufruf (`calculator.emptyPrompts` im Textkatalog `src/i18n/de.ts`). Früher: „Gib einen Betrag ein, um die Arbeitszeit zu sehen.“

1. Na, was willst du dir gönnen? Tipp den Preis ein.
2. Raus damit: Was kostet der Spaß?
3. Betrag eingeben. Wir verraten dir, wie lange du dafür schuftest.
4. Was liegt im Warenkorb? Wir sagen's keinem.
5. Leg los. Dein Konto hält schon mal die Luft an.
6. Trau dich. Wie teuer ist es?
