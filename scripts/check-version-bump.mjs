// Fails when a change touches the app but package.json's version was not raised.
// Usage: node scripts/check-version-bump.mjs <base-ref>   (e.g. origin/main)
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const base = process.argv[2];
if (!base) {
  console.error("Aufruf: node scripts/check-version-bump.mjs <base-ref>");
  process.exit(2);
}

const git = (...args) => execFileSync("git", args, { encoding: "utf8" });

// Documentation and CI configuration do not change the app, so they need no new version.
const exempt = (file) => file.endsWith(".md") || /^(docs|\.github|\.claude)\//.test(file);

const changed = git("diff", "--name-only", `${base}...HEAD`).split("\n").filter(Boolean);
const relevant = changed.filter((file) => !exempt(file));
if (relevant.length === 0) {
  console.log("Nur Doku/CI geändert, keine neue Version nötig.");
  process.exit(0);
}

const parse = (v) => v.split(".").map(Number);
const newer = (a, b) => {
  const [x, y] = [parse(a), parse(b)];
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] > y[i];
  return false;
};

const baseVersion = JSON.parse(git("show", `${base}:package.json`)).version;
const headVersion = JSON.parse(readFileSync("package.json", "utf8")).version;

if (!newer(headVersion, baseVersion)) {
  console.error(`Die Version muss erhöht werden: package.json hat ${headVersion}, ${base} hat ${baseVersion}.`);
  console.error(`Geänderte App-Dateien: ${relevant.join(", ")}`);
  console.error("Bitte z. B. mit `npm version patch --no-git-tag-version` (Fehlerbehebung) oder `minor` (neue Funktion) erhöhen.");
  process.exit(1);
}
console.log(`Version erhöht: ${baseVersion} → ${headVersion}`);
