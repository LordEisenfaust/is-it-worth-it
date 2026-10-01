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
