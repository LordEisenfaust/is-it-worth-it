export type ThemeChoice = "system" | "light" | "dark";

export const THEME_CHOICES: readonly ThemeChoice[] = ["system", "light", "dark"];

/** Follow the operating system; also what an unknown stored value falls back to. */
export const DEFAULT_THEME: ThemeChoice = "system";

export function sanitizeTheme(raw: unknown): ThemeChoice {
  return raw === "light" || raw === "dark" ? raw : DEFAULT_THEME;
}

/** The part of <html> the Darstellung needs; in the browser `document.documentElement`. */
export type ThemeRoot = Pick<Element, "setAttribute" | "removeAttribute">;

/** Puts the Darstellung on the page: a manual choice as `data-theme`, "system" leaves it to the OS. */
export function applyTheme(choice: ThemeChoice, root: ThemeRoot): void {
  if (choice === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", choice);
}
