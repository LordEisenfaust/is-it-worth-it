import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { fakeStore } from "./fakeStore";
import { KEYS, loadPreferences } from "./preferences";
import type { KeyValueStore } from "./storage";
import { applyTheme } from "./theme";

/** Stand-in for <html>: just the attributes the Darstellung touches. */
function fakeRoot(initial: Record<string, string> = {}) {
  const attributes = new Map(Object.entries(initial));
  return {
    attributes,
    setAttribute: (name: string, value: string) => void attributes.set(name, value),
    removeAttribute: (name: string) => void attributes.delete(name),
  };
}

describe("applyTheme", () => {
  it("setzt eine manuelle Darstellung als data-theme", () => {
    const root = fakeRoot();
    applyTheme("dark", root);
    expect(root.attributes.get("data-theme")).toBe("dark");
    applyTheme("light", root);
    expect(root.attributes.get("data-theme")).toBe("light");
  });

  it("entfernt data-theme bei „System“, damit das Betriebssystem entscheidet", () => {
    const root = fakeRoot({ "data-theme": "dark" });
    applyTheme("system", root);
    expect(root.attributes.has("data-theme")).toBe(false);
  });
});

/** The inline Startskript from index.html's <head>; it must be the only script there without `src`. */
function startScript(): string {
  const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
  const headEnd = html.indexOf("</head>");
  if (headEnd === -1) throw new Error("index.html has no </head>");
  const inline = [...html.slice(0, headEnd).matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)]
    .filter((m) => !/\bsrc\s*=/.test(m[1]))
    .map((m) => m[2]);
  if (inline.length !== 1) throw new Error(`expected one inline script in the <head> of index.html, found ${inline.length}`);
  return inline[0];
}

/** Runs the Startskript against a store and returns the data-theme it leaves on <html> (undefined = none). */
function runStartScript(store: Pick<KeyValueStore, "getItem">): string | undefined {
  const root = fakeRoot();
  new Function("localStorage", "document", startScript())(store, { documentElement: root });
  return root.attributes.get("data-theme");
}

/** What the app itself does on start: load the Darstellung, then apply it. */
function viaCode(store: KeyValueStore | null): string | undefined {
  const root = fakeRoot();
  applyTheme(loadPreferences(store).theme, root);
  return root.attributes.get("data-theme");
}

describe("Startskript in index.html", () => {
  const cases: [string, string | null, string | undefined][] = [
    ["nichts gespeichert", null, undefined],
    ["dunkel", '"dark"', "dark"],
    ["hell", '"light"', "light"],
    ["System", '"system"', undefined],
    ["unbekannter Wert", '"lila"', undefined],
    ["kaputtes JSON", "kein json", undefined],
    ["falsche Schreibweise", '"DARK"', undefined],
  ];

  it.each(cases)("wirkt wie der Code: %s", (_, stored, expected) => {
    const initial: Record<string, string> = stored === null ? {} : { [KEYS.theme]: stored };
    expect(runStartScript(fakeStore(initial))).toBe(expected);
    expect(viaCode(fakeStore(initial))).toBe(expected);
  });

  it("wirkt wie der Code, wenn der Speicher gesperrt ist", () => {
    const blocked = {
      ...fakeStore(),
      getItem: () => {
        throw new Error("SecurityError");
      },
    };
    expect(runStartScript(blocked)).toBeUndefined();
    expect(viaCode(blocked)).toBeUndefined();
  });
});
