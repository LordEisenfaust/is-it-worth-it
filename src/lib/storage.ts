export const PREFIX = "iiwi:";

export const KEYS = {
  settings: `${PREFIX}settings`,
  theme: `${PREFIX}theme`,
} as const;

/** The subset of the Web Storage API used here, so tests can pass an in-memory fake. */
export type KeyValueStore = Pick<Storage, "getItem" | "setItem" | "removeItem" | "key" | "length">;

function browserStore(): KeyValueStore | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    // Access can throw when storage is blocked (e.g. strict privacy settings).
    return null;
  }
}

/** Returns undefined when the key is missing, unreadable or not valid JSON. */
export function loadJson(key: string, store: KeyValueStore | null = browserStore()): unknown {
  try {
    const text = store?.getItem(key);
    return text == null ? undefined : JSON.parse(text);
  } catch {
    return undefined;
  }
}

export function saveJson(key: string, value: unknown, store: KeyValueStore | null = browserStore()): boolean {
  try {
    if (!store) return false;
    store.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/** JSON with object keys sorted, so equal values compare equal regardless of key order. */
function stableJson(value: unknown): string {
  return JSON.stringify(value, (_key, v: unknown) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b)))
      : v,
  );
}

/**
 * Saves the value, or removes the key when the value equals the default.
 * A missing key loads as the default anyway, so nothing is lost — and after
 * "delete all data" the reset defaults are not written straight back.
 */
export function saveUnlessDefault(
  key: string,
  value: unknown,
  defaultValue: unknown,
  store: KeyValueStore | null = browserStore(),
): boolean {
  if (stableJson(value) !== stableJson(defaultValue)) return saveJson(key, value, store);
  try {
    if (!store) return false;
    store.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

/** Removes every key with the app prefix and leaves foreign keys alone. */
export function clearAll(store: KeyValueStore | null = browserStore()): void {
  if (!store) return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < store.length; i++) {
      const key = store.key(i);
      if (key !== null && key.startsWith(PREFIX)) keys.push(key);
    }
    keys.forEach((key) => store.removeItem(key));
  } catch {
    // Nothing more we can do if storage is unavailable.
  }
}
