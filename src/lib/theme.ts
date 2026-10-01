export type ThemeChoice = "system" | "light" | "dark";

export const THEME_CHOICES: readonly ThemeChoice[] = ["system", "light", "dark"];

export function sanitizeTheme(raw: unknown): ThemeChoice {
  return raw === "light" || raw === "dark" ? raw : "system";
}
