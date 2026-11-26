# 0001 – Keine gemeinsame Feld-Komponente im Einstellungsformular

Status: angenommen (26.11.2026)

## Kontext

Im Einstellungsformular (`src/components/SettingsForm.tsx`) wiederholt sich die Verdrahtung aus Label, Eingabe, Fehlertext und `aria-invalid` / `aria-describedby` für Netto, Wochenstunden und Urlaubstage; die Arbeitstage haben als `fieldset` nur `aria-describedby`. Die Architektur-Review vom 25.11.2026 (Kandidat #5) hat erwogen, das in eine gemeinsame Feld-Komponente zu ziehen.

## Entscheidung

Es gibt keine gemeinsame Feld-Komponente. Die Felder bleiben einzeln im Formular ausgeschrieben.

## Begründung

- Die Felder unterscheiden sich im Detail: Netto mit Euro-Zeichen, Monatsgehälter als Slider ohne Fehlertext, Arbeitstage als Gruppe von Checkboxen in einem `fieldset`, Wochenstunden und Urlaubstage als Textfelder.
- Eine gemeinsame Komponente bräuchte für diese Unterschiede fast so viele Optionen, wie sie Markup spart. Sie wäre shallow: Das Interface wäre ungefähr so groß wie die Implementation.
- Die Regel, wann ein Fehler sichtbar wird (`touched`, `revealErrors`), liegt schon an einer Stelle im Formular. Eine Feld-Komponente würde daran nichts verbessern.

## Folgen

- Ein neues Feld wird im Formular ausgeschrieben, nach dem Muster der vorhandenen.
- Künftige Reviews schlagen eine gemeinsame Feld-Komponente nur dann erneut vor, wenn deutlich mehr gleichartige Felder dazukommen.
