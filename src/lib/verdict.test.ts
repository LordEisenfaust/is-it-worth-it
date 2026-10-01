import { describe, expect, it } from "vitest";
import { workTimeVerdict } from "./verdict";

// 8 h per day, Monday to Friday.
const v = (hours: number) => workTimeVerdict(hours, 8, 5);

describe("workTimeVerdict", () => {
  it("Stufe 1: unter einer Stunde gelassen", () => {
    expect(v(0.75)).toEqual({
      level: 1,
      headline: "45 Minuten. Gönn dir.",
      comment: "So schnell verdient, so schnell ausgegeben.",
      detail: "",
    });
    expect(v(1 / 60)?.headline).toBe("1 Minute. Gönn dir.");
    expect(v(0)?.headline).toBe("Nicht mal eine Minute. Gönn dir.");
  });

  it("Stufe 2: unter einem Arbeitstag nachdenklich, in Stunden und Minuten", () => {
    expect(v(5.9)).toEqual({
      level: 2,
      headline: "5 Stunden und 54 Minuten Arbeit.",
      comment: "Ein Großteil deines Arbeitstags. Brauchst du das wirklich?",
      detail: "",
    });
    expect(v(2)?.comment).toBe("Ein ordentliches Stück deines Arbeitstags. Brauchst du das wirklich?");
    expect(v(1)?.headline).toBe("1 Stunde Arbeit.");
  });

  it("Stufe 3: ab einem Arbeitstag frech, in Tagen und Stunden", () => {
    expect(v(29.7)).toEqual({
      level: 3,
      headline: "3 Tage und 6 Stunden Schufterei.",
      comment: "Schlaf lieber noch eine Nacht drüber.",
      detail: "≈ 29 Stunden und 42 Minuten",
    });
    expect(v(8)?.headline).toBe("1 Tag Schufterei.");
  });

  it("Stufe 4: ab einer Arbeitswoche mit Wochen und Tagen", () => {
    const r = v(99.2);
    expect(r?.level).toBe(4);
    expect(r?.headline).toBe("12 Tage und 3 Stunden Arbeit. Ernsthaft?");
    expect(r?.comment).toBe("2 Wochen und 2 Tage deines Lebens. Das muss es dir wert sein.");
    expect(r?.detail).toBe("≈ 99 Stunden und 12 Minuten");
    expect(v(40)?.comment).toBe("1 Woche deines Lebens. Das muss es dir wert sein.");
  });

  it("richtet die Wochengrenze nach den gewählten Arbeitstagen", () => {
    expect(workTimeVerdict(32, 8, 5)?.level).toBe(3);
    expect(workTimeVerdict(32, 8, 4)?.level).toBe(4);
  });

  it("liefert null bei ungültigen Werten", () => {
    expect(v(NaN)).toBeNull();
    expect(v(-1)).toBeNull();
    expect(workTimeVerdict(5, 0, 5)).toBeNull();
    expect(workTimeVerdict(5, 8, 0)).toBeNull();
  });
});
