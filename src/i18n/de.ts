// Every user-visible text of the app lives here, grouped by area.
// Texts with variable parts are small functions. A future second language only needs a file with the same shape
// (see the `Texts` type in ./index.ts), TypeScript then reports every missing text.

export const de = {
  /** Locale for number, currency and date formatting. */
  locale: "de-DE",

  app: {
    /** Also in the <title> of index.html, keep both in sync. */
    title: "Lohnt sich's?",
    tagline: "Der Rechner, den dein Warenkorb hasst.",
    /** Search engines and link previews (WhatsApp, Signal, …). */
    description: "Rechnet Einkäufe in deine Arbeitszeit um. Frech, ehrlich und nur lokal in deinem Browser.",
    /** Small line in the link preview image. */
    previewSubline: "Wie lange schuftest du dafür eigentlich?",
    previewAlt: "Sanduhr-Symbol mit dem Schriftzug „Lohnt sich's? Der Rechner, den dein Warenkorb hasst.“",
    navLabel: "Bereiche",
    navCalculator: "Rechner",
    navSettings: "Einstellungen",
    privacyFooter: "Alle Angaben bleiben lokal in deinem Browser. Details unter „Einstellungen“.",
    version: "Version",
    commitTitle: "Diesen Stand auf GitHub ansehen",
    repoLabel: "Quellcode auf GitHub",
  },

  theme: {
    legend: "Darstellung",
    system: "System",
    light: "Hell",
    dark: "Dunkel",
  },

  calculator: {
    title: "Rechner",
    amountLabel: "Betrag in Euro",
    amountPlaceholder: "z. B. 1599 für ein neues Handy",
    settingsMissing: "Bitte zuerst die Gehaltsdaten in den Einstellungen vollständig und gültig ausfüllen.",
    /** Shown while no amount is entered; one at random per page load. */
    emptyPrompts: [
      "Na, was willst du dir gönnen? Tipp den Preis ein.",
      "Raus damit: Was kostet der Spaß?",
      "Betrag eingeben. Wir verraten dir, wie lange du dafür schuftest.",
      "Was liegt im Warenkorb? Wir sagen's keinem.",
      "Leg los. Dein Konto hält schon mal die Luft an.",
      "Trau dich. Wie teuer ist es?",
    ],
  },

  /** The cheeky verdict whose tone escalates with the amount (docs/ausgabe-varianten.md, "Vorschlag C"). */
  verdict: {
    level1Headline: (time: string) => `${time}. Gönn dir.`,
    level1HeadlineUnderMinute: "Nicht mal eine Minute. Gönn dir.",
    level1Comment: "So schnell verdient, so schnell ausgegeben.",
    level2Headline: (time: string) => `${time} Arbeit.`,
    level2CommentLarge: "Ein Großteil deines Arbeitstags. Brauchst du das wirklich?",
    level2CommentSmall: "Ein ordentliches Stück deines Arbeitstags. Brauchst du das wirklich?",
    level3Headline: (time: string) => `${time} Schufterei.`,
    level3Comment: "Schlaf lieber noch eine Nacht drüber.",
    level4Headline: (time: string) => `${time} Arbeit. Ernsthaft?`,
    level4Comment: (weeks: string) => `${weeks} deines Lebens. Das muss es dir wert sein.`,
    detail: (time: string) => `≈ ${time}`,
  },

  /** Unit words as [singular, plural] and the joiner of two units ("6 Tage und 1 Stunde"). */
  units: {
    minute: ["Minute", "Minuten"] as [string, string],
    hour: ["Stunde", "Stunden"] as [string, string],
    day: ["Tag", "Tage"] as [string, string],
    week: ["Woche", "Wochen"] as [string, string],
    and: "und",
  },

  settings: {
    title: "Gehaltsdaten",
    modeLegend: "Eingabeart",
    monthly: "Monatsnetto",
    yearly: "Jahresnetto",
    netLabelMonthly: "Monatsnetto in Euro",
    netLabelYearly: "Jahresnetto in Euro",
    monthsLabel: "Monatsgehälter pro Jahr:",
    weeklyHoursLabel: "Wochenstunden",
    workdaysLegend: "Arbeitstage",
    vacationLabel: "Urlaubstage pro Jahr",
    stateLabel: "Bundesland (für Feiertage)",
    summaryTitle: (year: number) => `So wird gerechnet (${year})`,
    annualNet: "Jahresnetto",
    workingDaysPerYear: "Arbeitstage pro Jahr",
    hoursPerDay: "Stunden pro Arbeitstag",
    hourlyWage: "Netto-Stundenlohn",
    holidaysSummary: (total: number, deducted: number) => `Feiertage (${total}, davon ${deducted} abgezogen)`,
    holidayOffDay: " (laut Auswahl kein Arbeitstag, nicht abgezogen)",
  },

  /** Display order Monday to Sunday; `value` follows JavaScript (0 = Sunday). */
  weekdays: [
    { value: 1, label: "Montag", short: "Mo" },
    { value: 2, label: "Dienstag", short: "Di" },
    { value: 3, label: "Mittwoch", short: "Mi" },
    { value: 4, label: "Donnerstag", short: "Do" },
    { value: 5, label: "Freitag", short: "Fr" },
    { value: 6, label: "Samstag", short: "Sa" },
    { value: 0, label: "Sonntag", short: "So" },
  ],

  validation: {
    netMissing: (netLabel: string) => `Bitte ${netLabel} eingeben.`,
    netInvalid: (netLabel: string) => `${netLabel} muss eine Zahl größer als 0 sein.`,
    netTooLarge: (netLabel: string) => `${netLabel} ist zu groß.`,
    monthsOutOfRange: (min: number, max: number) => `Die Anzahl der Monatsgehälter muss zwischen ${min} und ${max} liegen.`,
    weeklyHoursMissing: "Bitte Wochenstunden eingeben.",
    weeklyHoursInvalid: "Wochenstunden müssen eine Zahl größer als 0 sein.",
    weeklyHoursTooMany: "Eine Woche hat nur 168 Stunden.",
    workdaysMissing: "Bitte mindestens einen Arbeitstag wählen.",
    hoursPerDayTooMany: "Das ergäbe mehr als 24 Stunden pro Arbeitstag – bitte Wochenstunden oder Arbeitstage prüfen.",
    vacationMissing: "Bitte Urlaubstage eingeben (0 ist erlaubt).",
    vacationInvalid: "Urlaubstage müssen eine ganze Zahl von mindestens 0 sein.",
    vacationTooMany: "Ein Jahr hat nicht mehr als 366 Tage.",
    amountMissing: "Bitte einen Betrag eingeben.",
    amountInvalid: "Bitte eine gültige, nicht negative Zahl eingeben.",
    amountZero: "Der Betrag muss größer als 0 sein.",
    amountTooLarge: "Der Betrag ist zu groß.",
    noWorkday: "Es ist kein Arbeitstag gewählt.",
    noWorkingDaysLeft: "Mit diesen Urlaubstagen bleibt kein Arbeitstag im Jahr übrig.",
    wageNotComputable: "Der Stundenlohn lässt sich mit diesen Angaben nicht berechnen.",
  },

  privacy: {
    title: "Datenschutz",
    text:
      "Deine Eingaben verlassen nie deinen Browser: Sie werden ausschließlich lokal gespeichert (localStorage). " +
      "Es gibt kein Backend, keinen Login und kein Tracking.",
    deleteButton: "Alle gespeicherten Daten löschen",
    deleteConfirm: "Wirklich alle gespeicherten Daten (Gehaltsdaten, Darstellung) löschen?",
  },

  footer: {
    /** Fixed start of the credit line; every quip continues it with Claude as the subject. */
    creditPrefix: "Vibecoded with ♥️ by Claude Opus 5.5 –",
    /** One is shown at random on every page load (list also in docs/footer-sprueche.md). */
    quips: [
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
    ],
  },

  states: {
    BW: "Baden-Württemberg",
    BY: "Bayern",
    BE: "Berlin",
    BB: "Brandenburg",
    HB: "Bremen",
    HH: "Hamburg",
    HE: "Hessen",
    MV: "Mecklenburg-Vorpommern",
    NI: "Niedersachsen",
    NW: "Nordrhein-Westfalen",
    RP: "Rheinland-Pfalz",
    SL: "Saarland",
    SN: "Sachsen",
    ST: "Sachsen-Anhalt",
    SH: "Schleswig-Holstein",
    TH: "Thüringen",
  },

  holidays: {
    newYear: "Neujahr",
    epiphany: "Heilige Drei Könige",
    womensDay: "Internationaler Frauentag",
    goodFriday: "Karfreitag",
    easterSunday: "Ostersonntag",
    easterMonday: "Ostermontag",
    labourDay: "Tag der Arbeit",
    ascension: "Christi Himmelfahrt",
    whitSunday: "Pfingstsonntag",
    whitMonday: "Pfingstmontag",
    corpusChristi: "Fronleichnam",
    assumption: "Mariä Himmelfahrt",
    childrensDay: "Weltkindertag",
    unityDay: "Tag der Deutschen Einheit",
    reformationDay: "Reformationstag",
    allSaints: "Allerheiligen",
    repentanceDay: "Buß- und Bettag",
    christmasDay: "1. Weihnachtstag",
    boxingDay: "2. Weihnachtstag",
  },
};
