import { describe, expect, it } from "vitest";
import { pickFrom } from "./random";

describe("pickFrom", () => {
  const list = ["a", "b", "c", "d"];

  it("wählt über den ganzen Bereich aus", () => {
    expect(pickFrom(list, () => 0)).toBe("a");
    expect(pickFrom(list, () => 0.5)).toBe("c");
    expect(pickFrom(list, () => 0.999999)).toBe("d");
  });

  it("bleibt bei Zufallswerten außerhalb von [0, 1) in den Grenzen", () => {
    expect(pickFrom(list, () => 1)).toBe("d");
    expect(pickFrom(list, () => -0.1)).toBe("a");
  });
});
