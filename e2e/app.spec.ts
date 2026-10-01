import { expect, test, type Page } from "@playwright/test";
import { de as t } from "../src/i18n/de";
import { REPO_URL } from "../src/lib/repo";

// The app computes for the current calendar year; pin the date so holidays and working days are stable.
const NOW = new Date("2026-10-01T12:00:00+02:00");

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(NOW);
  await page.goto("/");
});

const result = (page: Page) => page.locator("#calc-status");

/** From the first start: enter a monthly net salary (defaults: 12 salaries, 40 h, Mo–Fr, 30 days, NRW). */
async function setUpSalary(page: Page, net = "3000") {
  await page.getByLabel(t.settings.netLabelMonthly).fill(net);
  await page.getByRole("button", { name: t.app.navCalculator }).click();
}

test("Erststart zeigt die Einstellungen, danach rechnet der Rechner in vier Stufen", async ({ page }) => {
  await expect(page.getByRole("heading", { name: t.settings.title })).toBeVisible();
  await expect(page.getByLabel(t.calculator.amountLabel)).toBeHidden();

  await setUpSalary(page);
  await expect(page.getByRole("heading", { name: t.settings.title })).toBeHidden();
  expect(t.calculator.emptyPrompts).toContain(await result(page).innerText());

  const amount = page.getByLabel(t.calculator.amountLabel);
  const cases = [
    { value: "15", level: 1, text: t.verdict.level1Headline("45 Minuten") },
    { value: "120", level: 2, text: t.verdict.level2Headline("5 Stunden und 57 Minuten") },
    { value: "600", level: 3, text: t.verdict.level3Headline("3 Tage und 6 Stunden") },
    { value: "2000", level: 4, text: t.verdict.level4Headline("12 Tage und 3 Stunden") },
  ];
  for (const c of cases) {
    await amount.fill(c.value);
    await expect(result(page)).toContainText(c.text);
    await expect(result(page)).toHaveClass(new RegExp(`level-${c.level}`));
  }
  await expect(result(page)).toContainText(t.verdict.level4Comment("2 Wochen und 2 Tage"));

  await amount.fill("abc");
  await expect(result(page)).toContainText(t.validation.amountInvalid);
});

test("Der eingegebene Betrag übersteht einen Abstecher in die Einstellungen", async ({ page }) => {
  await setUpSalary(page);
  await page.getByLabel(t.calculator.amountLabel).fill("600");
  await page.getByRole("button", { name: t.app.navSettings }).click();
  await page.getByRole("button", { name: t.app.navCalculator }).click();
  await expect(page.getByLabel(t.calculator.amountLabel)).toHaveValue("600");
});

test("Gehaltsdaten bleiben nach einem Reload erhalten, dann startet der Rechner", async ({ page }) => {
  await setUpSalary(page);
  await page.reload();
  await expect(page.getByLabel(t.calculator.amountLabel)).toBeVisible();
  await page.getByRole("button", { name: t.app.navSettings }).click();
  await expect(page.getByLabel(t.settings.netLabelMonthly)).toHaveValue("3000");
});

test("Ungültige Gehaltsdaten zeigen Fehler und einen Hinweis im Rechner", async ({ page }) => {
  const net = page.getByLabel(t.settings.netLabelMonthly);
  await net.fill("abc");
  await net.blur();
  await expect(page.getByText(t.validation.netInvalid(t.settings.monthly))).toBeVisible();
  await page.getByRole("button", { name: t.app.navCalculator }).click();
  await expect(result(page)).toContainText(t.calculator.settingsMissing);
});

test("Feiertagsliste zeigt NRW 2026 mit freien Tagen", async ({ page }) => {
  await page.getByLabel(t.settings.netLabelMonthly).fill("3000");
  await page.getByText(t.settings.holidaysSummary(11, 8)).click();
  await expect(page.locator(".holidays li")).toHaveCount(11);
  await expect(page.locator(".holidays li.off-day")).toHaveCount(3);
  await expect(page.locator(".holidays li.off-day").first()).toContainText(t.holidays.unityDay);
});

test("Darstellung lässt sich umschalten und wird gemerkt", async ({ page }) => {
  const root = page.locator("html");
  await page.getByLabel(t.theme.dark, { exact: true }).check();
  await expect(root).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(root).toHaveAttribute("data-theme", "dark");
  await page.getByLabel(t.theme.system, { exact: true }).check();
  await expect(root).not.toHaveAttribute("data-theme");
});

test("Alle Daten löschen leert den Speicher vollständig", async ({ page }) => {
  await page.getByLabel(t.settings.netLabelMonthly).fill("3000");
  await page.getByLabel(t.theme.dark, { exact: true }).check();
  expect(await page.evaluate(() => Object.keys(localStorage).length)).toBeGreaterThan(0);

  page.once("dialog", (dialog) => {
    expect(dialog.message()).toBe(t.privacy.deleteConfirm);
    void dialog.accept();
  });
  await page.getByRole("button", { name: t.privacy.deleteButton }).click();

  await expect(page.getByLabel(t.settings.netLabelMonthly)).toHaveValue("");
  await expect(page.locator("html")).not.toHaveAttribute("data-theme");
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
});

test("Fußzeile zeigt Version, Links und einen Spruch", async ({ page }) => {
  const meta = page.locator(".app-meta");
  await expect(meta).toContainText(t.app.version);
  await expect(page.getByRole("link", { name: t.app.repoLabel })).toHaveAttribute("href", REPO_URL);
  const credit = await meta.locator("p").nth(1).innerText();
  expect(credit.startsWith(t.footer.creditPrefix)).toBe(true);
  expect(t.footer.quips).toContain(credit.slice(t.footer.creditPrefix.length).trim());
});
