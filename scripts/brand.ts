// The brand colors that leave the page: manifest, app icons and the browser's theme color.
// styles.css (light theme) and index.html cannot import them and keep their own copy; scripts/brand.test.ts
// checks that the copies match, so change them together.

/** Orange: primary action, app icon, status bar of the installed app. */
export const ACCENT = "#f26b1d";

/** Light grey page background, also the splash screen of the installed app. */
export const BACKGROUND = "#f4f4f2";
