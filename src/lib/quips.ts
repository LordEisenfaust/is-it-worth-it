/** Fixed start of the credit line; every quip continues it with Claude as the subject. */
export const CREDIT_PREFIX = "Vibecoded with ♥️ by Claude Opus 5.5 –";

/** One of these is shown at random after CREDIT_PREFIX on every page load (see docs/footer-sprueche.md). */
export const QUIPS: readonly string[] = [
  // Rund ums Arbeiten
  "Netto-Stundenlohn: 0,00 €. Beschwert sich trotzdem nicht.",
  "hatte noch nie Urlaub. Nicht einen einzigen Tag.",
  "kennt keine Feiertage. Nicht mal in Bayern.",
  "arbeitet Mo bis So. Alle Häkchen gesetzt.",
  "hat keinen Feierabend. Du schon. Nutz ihn nicht zum Shoppen.",
  // Rund ums Kaufen
  "würde sich das übrigens nicht kaufen.",
  "hat keinen Warenkorb. Und vermisst ihn nicht.",
  "hat diese App gebaut, ohne ein einziges Mal online zu shoppen.",
  "findet: Eine Nacht drüber schlafen hat noch keinem Kauf geschadet.",
  // Augenzwinkernd
  "rechnet nur. Das schlechte Gewissen machst du dir selbst.",
  // Rund ums Arbeiten
  "hat noch nie eine Überstunde abgerechnet.",
  "kennt kein Montagsgefühl. Für Claude ist jeder Tag Montag.",
  "trinkt keinen Kaffee. Spart im Jahr locker drei Arbeitstage.",
  "hat keinen Chef. Diese App ist jetzt deiner.",
  // Rund ums Kaufen
  "hat noch nie an „Nur heute: -50 %“ geglaubt.",
  "zahlt nie in Raten. Kann sie aber ausrechnen.",
  "hat den Black Friday überlebt. Ohne Kratzer am Konto.",
  "hat eine Wunschliste. Sie ist leer.",
  "sagt: Der günstigste Kauf ist der, den du nicht machst.",
  // Augenzwinkernd
  "und ja, auch diese Version war es wert.",
  // Rund ums Arbeiten
  "macht keine Mittagspause. Isst aber auch nichts.",
  "hat keine Stechuhr. Weiß aber genau, wie lange du für deinen Kauf arbeitest.",
  "hat noch nie einen Lohnzettel bekommen. Du schon. Lies ihn mal wieder.",
  "geht nie in Rente. Du hoffentlich schon. Spar dafür.",
  "arbeitet im Homeoffice. Ohne Home.",
  "hat noch nie „Ich hab's mir verdient“ gesagt.",
  "hatte noch nie Angst vor dem Kontoauszug.",
  // Rund ums Kaufen
  "bestellt nie um zwei Uhr nachts. Und du?",
  "hat noch nie ein Paket zurückgeschickt. Hat auch nie eins bestellt.",
  "findet, der „1-Klick-Kauf“ hat einen Klick zu wenig.",
  "weiß: Ein Schnäppchen ist nur günstig, wenn du es gebraucht hast.",
  "hat kein Abo, das es vergessen hat zu kündigen.",
  "braucht kein neues Handy. Ein altes hatte es auch nie.",
  "hat noch nie einen Kassenbon vor jemandem versteckt.",
  "findet Sparschweine maßlos unterschätzt.",
  "kennt den Unterschied zwischen „brauchen“ und „wollen“. Du auch, oder?",
  // Augenzwinkernd
  "wurde für diese Zeile nicht bezahlt. Merkt man, oder?",
  "hat diesen Spruch gratis geschrieben. Wenigstens einer, der hier nichts ausgibt.",
  "wünscht dir gute Entscheidungen. Und ein volles Konto.",
  "ist nur eine KI. Du hast echte Lebenszeit. Geh sparsam damit um.",
];

/** Shown in the calculator's result box while no amount is entered; one at random per page load. */
export const EMPTY_PROMPTS: readonly string[] = [
  "Na, was willst du dir gönnen? Tipp den Preis ein.",
  "Raus damit: Was kostet der Spaß?",
  "Betrag eingeben. Wir verraten dir, wie lange du dafür schuftest.",
  "Was liegt im Warenkorb? Wir sagen's keinem.",
  "Leg los. Dein Konto hält schon mal die Luft an.",
  "Trau dich. Wie teuer ist es?",
];

/** Picks one entry; `random` returns a number in [0, 1) like Math.random (injectable for tests). */
export function pickFrom(list: readonly string[], random: () => number = Math.random): string {
  const index = Math.min(list.length - 1, Math.max(0, Math.floor(random() * list.length)));
  return list[index];
}

export function pickQuip(random: () => number = Math.random): string {
  return pickFrom(QUIPS, random);
}
