import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { de as t } from "../src/i18n/de";
import { REPO_URL } from "../src/lib/repo";

const pkg = JSON.parse(readFileSync("package.json", "utf8")) as { version: string };

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
  await expect(page.getByText(t.settings.intro)).toBeVisible();
  await expect(page.getByLabel(t.calculator.amountLabel)).toBeHidden();

  await setUpSalary(page);
  await expect(page.getByRole("heading", { name: t.settings.title })).toBeHidden();
  expect(t.calculator.emptyPrompts).toContain(await result(page).innerText());
  await expect(page.locator(".input-affix .affix")).toHaveText(t.calculator.amountUnit);

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
    // The grey line (amount and exact hours) only appears from a working day on; small amounts need no extra line.
    const grey = result(page).locator("p.muted");
    if (c.level >= 3) {
      await expect(grey).toHaveCount(1);
      await expect(grey).toContainText(t.verdict.greyLine("", ""));
    } else {
      await expect(grey).toHaveCount(0);
    }
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

test("Das Nettofeld trägt in beiden Eingabearten ein Euro-Zeichen", async ({ page }) => {
  // The calculator stays mounted (hidden) and has its own sign, so look only inside the settings panel.
  const affix = page.locator("#settings-panel .input-affix .affix");
  await expect(page.getByLabel(t.settings.netLabelMonthly)).toBeVisible();
  await expect(affix).toHaveText(t.settings.netUnit);

  // "Jahresnetto" also appears in the summary, so click the segmented control's label.
  await page.locator(".segmented label", { hasText: t.settings.yearly }).click();
  await expect(page.getByLabel(t.settings.netLabelYearly)).toBeVisible();
  await expect(affix).toHaveText(t.settings.netUnit);
});

test("Ungültige Gehaltsdaten zeigen Fehler und einen Hinweis im Rechner", async ({ page }) => {
  const net = page.getByLabel(t.settings.netLabelMonthly);
  await net.fill("abc");
  await net.blur();
  await expect(page.getByText(t.validation.netInvalid(t.settings.monthly))).toBeVisible();
  await page.getByRole("button", { name: t.app.navCalculator }).click();
  await expect(result(page)).toContainText(t.calculator.settingsMissing);
});

// NRW 2026, Mo–Fr: 261 Wochentage − 8 Feiertage = 253 Tage, also bleibt mit 253 Urlaubstagen keiner übrig.
const weekday = (value: number) => t.weekdays.find((d) => d.value === value)!.label;

test("Zu viele Urlaubstage zeigen den Fehler in den Einstellungen und einen Hinweis im Rechner", async ({ page }) => {
  await page.getByLabel(t.settings.netLabelMonthly).fill("3000");
  await expect(page.getByRole("heading", { name: t.settings.summaryTitle(2026) })).toBeVisible();

  const vacation = page.getByLabel(t.settings.vacationLabel);
  await vacation.fill("253");
  await vacation.blur();
  await expect(page.getByText(t.validation.noWorkingDaysLeft)).toBeVisible();
  await expect(vacation).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByRole("heading", { name: t.settings.summaryTitle(2026) })).toBeHidden();

  await page.getByRole("button", { name: t.app.navCalculator }).click();
  await expect(result(page)).toContainText(t.calculator.settingsMissing);
});

test("Wer Arbeitstage abwählt, bis keiner übrig bleibt, sieht den Fehler an den Urlaubstagen", async ({ page }) => {
  await page.getByLabel(t.settings.netLabelMonthly).fill("3000");
  await page.getByLabel(t.settings.weeklyHoursLabel).fill("8");
  await page.getByLabel(t.settings.vacationLabel).fill("200");
  await expect(page.getByText(t.validation.noWorkingDaysLeft)).toBeHidden();

  // Nur noch montags: 52 Montage − Oster- und Pfingstmontag = 50 Arbeitstage, weniger als 200 Urlaubstage.
  for (const day of [2, 3, 4, 5]) await page.getByLabel(weekday(day), { exact: true }).uncheck();
  await expect(page.getByText(t.validation.noWorkingDaysLeft)).toBeVisible();
});

test("Erststart: Nach einem Abstecher in den Rechner bleiben nie berührte Felder ohne Fehler", async ({ page }) => {
  await page.getByLabel(t.settings.vacationLabel).fill("28");
  await page.getByRole("button", { name: t.app.navCalculator }).click();
  await page.getByRole("button", { name: t.app.navSettings }).click();
  await expect(page.getByText(t.validation.netMissing(t.settings.monthly))).toBeHidden();
});

test("Gespeicherte Daten ohne Arbeitstag: Start in den Einstellungen, Fehler sofort sichtbar", async ({ page }) => {
  await page.getByLabel(t.settings.netLabelMonthly).fill("3000");
  await page.getByLabel(t.settings.vacationLabel).fill("253");
  await page.reload();

  await expect(page.getByRole("heading", { name: t.settings.title })).toBeVisible();
  await expect(page.getByText(t.validation.noWorkingDaysLeft)).toBeVisible();
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

test("Der Datenschutz-Hinweis unten steht nur in der Rechner-Ansicht", async ({ page }) => {
  const note = page.getByText(t.footer.privacyNote);
  await expect(note).toBeHidden();
  await setUpSalary(page);
  await expect(note).toBeVisible();
  await page.getByRole("button", { name: t.app.navSettings }).click();
  await expect(note).toBeHidden();
});

test("Fußzeile zeigt Version, Links und einen Spruch", async ({ page }) => {
  const meta = page.locator(".app-meta");
  await expect(meta).toContainText(t.footer.versionLine(pkg.version).before);
  await expect(page.getByRole("link", { name: t.footer.repoLabel })).toHaveAttribute("href", REPO_URL);
  const credit = await meta.locator("p").nth(1).innerText();
  expect(credit.startsWith(t.footer.creditPrefix)).toBe(true);
  expect(t.footer.quips).toContain(credit.slice(t.footer.creditPrefix.length).trim());
});

test("Ist als App installierbar: Manifest und Symbole sind erreichbar", async ({ page, request }) => {
  const href = await page.locator('link[rel="manifest"]').getAttribute("href");
  expect(href).toBeTruthy();
  const manifest = await (await request.get(href!)).json();
  expect(manifest.name).toBe(t.app.title);
  expect(manifest.display).toBe("standalone");
  expect(manifest.icons.map((i: { purpose: string }) => i.purpose)).toEqual(["any", "any", "maskable"]);
  for (const icon of manifest.icons) {
    const response = await request.get(icon.src);
    expect(response.ok()).toBe(true);
    expect(response.headers()["content-type"]).toBe("image/png");
  }
});

test("Funktioniert nach dem ersten Besuch auch offline", async ({ page, context }) => {
  // First visit installs the service worker; it takes control right away (clients.claim).
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);
  await setUpSalary(page);

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("heading", { name: t.app.title })).toBeVisible();
  await page.getByLabel(t.calculator.amountLabel).fill("600");
  await expect(result(page)).toContainText(t.verdict.level3Headline("3 Tage und 6 Stunden"));
  await context.setOffline(false);
});

test("Service Worker umgeht den HTTP-Cache, damit ein Deploy sofort ankommt", async ({ request }) => {
  // GitHub Pages sends max-age=600; without these options the page could stay ten minutes behind a deploy.
  const source = await (await request.get("sw.js")).text();
  expect(source).toContain('fetch(request, { cache: "no-cache" })');
  expect(source).toContain('new Request(file, { cache: "reload" })');
});

test("Hat eine Link-Vorschau für Messenger (Open Graph)", async ({ page, request }) => {
  const meta = (selector: string) => page.locator(`meta[${selector}]`).getAttribute("content");
  expect(await meta('name="description"')).toBe(t.app.description);
  expect(await meta('property="og:title"')).toBe(t.app.title);
  expect(await meta('property="og:description"')).toBe(t.app.tagline);
  const image = await meta('property="og:image"');
  expect(image).toMatch(/^https:\/\/.+\/og-image\.png$/);
  // The tag points to the live site; the same file must exist in this build.
  const response = await request.get("og-image.png");
  expect(response.ok()).toBe(true);
  expect(response.headers()["content-type"]).toBe("image/png");
});
