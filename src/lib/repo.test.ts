import { describe, expect, it } from "vitest";
import { commitUrl, REPO_URL } from "./repo";

describe("commitUrl", () => {
  it("verlinkt echte Commit-Hashes", () => {
    expect(commitUrl("3158285")).toBe(`${REPO_URL}/commit/3158285`);
  });

  it("liefert null für Platzhalter und ungültige Werte", () => {
    expect(commitUrl("dev")).toBeNull();
    expect(commitUrl("")).toBeNull();
    expect(commitUrl("abc")).toBeNull();
    expect(commitUrl("315828Z")).toBeNull();
  });
});
