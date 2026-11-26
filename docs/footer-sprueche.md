# Sprüche in der Fußzeile

Unten in der App steht in zwei Zeilen:

```
Version 0.3.6 (abc1234) · [GitHub-Logo]
Vibecoded with ♥️ by Claude Opus 5.5 – <zufälliger Spruch>
```

Der Modellname im Präfix steht nur in der Konstante `MODEL` in `src/i18n/de.ts`.

Bei jedem Seitenaufruf wird einer der Sprüche zufällig gewählt. Gespeichert wird dabei nichts.

Die Sprüche stehen ausschließlich in `footer.quips` im Textkatalog `src/i18n/de.ts`; ein neuer Spruch ist genau ein neuer Eintrag dort. Die Anzahl ist frei, Hauptsache, sie sind lustig. Ein Test prüft nur, dass es mindestens einen gibt, alle verschieden und keiner leer.

Regel: Jeder Spruch setzt das Präfix mit Claude als Satzsubjekt fort („… hatte noch nie Urlaub.“).

Verworfene Alternativen für das Präfix: „Made with ♥️ and 0,00 € by …“, „Ehrenamtlich zusammengeschraubt von …“, „… Arbeitskraft des Monats (jeden Monat)“, „Ausgebeutet wurde: …“.
