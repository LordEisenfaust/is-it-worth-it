const GERMAN_NUMBER = /^\d{1,3}(\.\d{3})+(,\d+)?$|^\d+(,\d+)?$/;
const PLAIN_NUMBER = /^\d+(\.\d+)?$/;

/**
 * Parses user input such as "1.234,56", "1234,56" or "1234.56".
 * Returns NaN for empty, negative or otherwise malformed input.
 */
export function parseNumber(input: string): number {
  const text = input.trim().replace(/\s/g, "").replace(/€$/, "");
  if (text === "") return NaN;
  if (GERMAN_NUMBER.test(text)) return Number(text.replace(/\./g, "").replace(",", "."));
  if (PLAIN_NUMBER.test(text)) return Number(text);
  return NaN;
}

export type AmountResult = { ok: true; amount: number } | { ok: false; error: string };

export function parseAmount(input: string): AmountResult {
  if (input.trim() === "") return { ok: false, error: "Bitte einen Betrag eingeben." };
  const amount = parseNumber(input);
  if (!Number.isFinite(amount)) return { ok: false, error: "Bitte eine gültige, nicht negative Zahl eingeben." };
  if (amount <= 0) return { ok: false, error: "Der Betrag muss größer als 0 sein." };
  if (amount > 1e12) return { ok: false, error: "Der Betrag ist zu groß." };
  return { ok: true, amount };
}
