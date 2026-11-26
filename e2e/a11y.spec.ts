import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { de as t } from "../src/i18n/de";

// Same fixed date as app.spec.ts, so the settings summary and the holiday list look the same every run.
const NOW = new Date("2026-10-01T12:00:00+02:00");

/** Accessibility rules (WCAG 2.1 AA, colour contrast included) for what is visible right now. */
async function expectNoViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  // Only id, affected elements and the reason, so a failure says what to fix without a wall of JSON.
  const summary = violations.map((v) => ({
    rule: v.id,
    nodes: v.nodes.map((n) => `${n.target.join(" ")}: ${n.failureSummary ?? ""}`),
  }));
  expect(summary).toEqual([]);
}

// "System" in light and dark checks the media query, "Dunkel" checks the manual switch (data-theme).
const themes = [
  { name: "hell (System)", colorScheme: "light", pick: null },
  { name: "dunkel (System)", colorScheme: "dark", pick: null },
  { name: "dunkel (manuell)", colorScheme: "light", pick: t.theme.dark },
  { name: "hell (manuell)", colorScheme: "dark", pick: t.theme.light },
] as const;

for (const theme of themes) {
  test.describe(`Barrierefreiheit, ${theme.name}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme.colorScheme });
      await page.clock.setFixedTime(NOW);
      await page.goto("/");
      if (theme.pick) await page.getByLabel(theme.pick, { exact: true }).check();
    });

    test("Einstellungen mit Fehler, Übersicht und Feiertagsliste", async ({ page }) => {
      const weekly = page.getByLabel(t.settings.weeklyHoursLabel);
      await weekly.fill("abc");
      await weekly.blur();
      await expect(weekly).toHaveAttribute("aria-invalid", "true");
      await expectNoViolations(page);

      await weekly.fill("40");
      await page.getByLabel(t.settings.netLabelMonthly).fill("3000");
      await page.getByText(t.settings.holidaysSummary(11, 8)).click();
      await expect(page.locator(".holidays li").first()).toBeVisible();
      await expectNoViolations(page);
    });

    test("Rechner: Leerzustand, Fehler und alle vier Stufen", async ({ page }) => {
      await page.getByLabel(t.settings.netLabelMonthly).fill("3000");
      await page.getByRole("button", { name: t.app.navCalculator }).click();
      const amount = page.getByLabel(t.calculator.amountLabel);
      const status = page.locator("#calc-status");
      await expect(amount).toBeVisible();
      await expectNoViolations(page);

      await amount.fill("abc");
      await expect(status).toContainText(t.validation.amountInvalid);
      await expectNoViolations(page);

      for (const [value, level] of [["15", 1], ["120", 2], ["600", 3], ["2000", 4]] as const) {
        await amount.fill(value);
        await expect(status).toHaveClass(new RegExp(`level-${level}`));
        await expectNoViolations(page);
      }
    });
  });
}
