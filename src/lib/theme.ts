export type ThemeChoice = "system" | "light" | "dark";

export const THEME_CHOICES: readonly ThemeChoice[] = ["system", "light", "dark"];

/** Follow the operating system; also what an unknown stored value falls back to. */
export const DEFAULT_THEME: ThemeChoice = "system";

export function sanitizeTheme(raw: unknown): ThemeChoice {
  return raw === "light" || raw === "dark" ? raw : DEFAULT_THEME;
}
