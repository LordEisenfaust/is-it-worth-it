import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { de as t } from "../src/i18n/de";
import { REPO_URL } from "../src/lib/repo";

const pkg = JSON.parse(readFileSync("package.json", "utf8")) as { version: string };

// The app computes for the current calendar year; pin the date so holidays and working days are stable.
const NOW = new Date("2026-10-01T12:00:00+02:00");

// Tags pick the project in playwright.config.ts: @handy runs only on the phone, @einmal (independent of the
// screen size: build files, metadata) only on the desktop.

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(NOW);
  await page.goto("/");
});

const result = (page: Page) => page.locator("#calc-status");
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** Exactly one of the given texts (retrying, unlike reading the text once and comparing). */
const oneOf = (texts: readonly string[], prefix = "") =>
  new RegExp(`^${escape(prefix)}(${texts.map(escape).join("|")})$`);

/** From the first start: enter a monthly net salary (defaults: 12 salaries, 40 h, Mo–Fr, 30 days, NRW). */
async function setUpSalary(page: Page, net = "3000") {
  await page.getByLabel(t.settings.netLabelMonthly).fill(net);
  await page.getByRole("button", { name: t.app.navCalculator }).click();
}

const storageKeys = (page: Page) => page.evaluate(() => Object.keys(localStorage));
const summary = (page: Page) => page.locator(".summary");

test("Erststart zeigt die Einstellungen, danach rechnet der Rechner in vier Stufen", async ({ page }) => {
  await expect(page.getByRole("heading", { name: t.settings.title })).toBeVisible();
  await expect(page.getByText(t.settings.intro)).toBeVisible();
  await expect(page.getByLabel(t.calculator.amountLabel)).toBeHidden();

  await setUpSalary(page);
  await expect(page.getByRole("heading", { name: t.settings.title })).toBeHidden();
  await expect(result(page)).toHaveText(oneOf(t.calculator.emptyPrompts));
  const calculator = page.getByRole("region", { name: t.calculator.title });
  await expect(calculator.getByText(t.calculator.amountUnit, { exact: true })).toBeVisible();

  // 3000 € × 12 / (253 − 30 days × 8 h) = 20,18 €/h.
  const amount = page.getByLabel(t.calculator.amountLabel);
  const cases = [
    { value: "15", level: 1, text: t.verdict.level1Headline("45 Minuten"), grey: null },
    { value: "120", level: 2, text: t.verdict.level2Headline("5 Stunden und 57 Minuten"), grey: null },
    {
      value: "600",
      level: 3,
      text: t.verdict.level3Headline("3 Tage und 6 Stunden"),
      grey: t.verdict.greyLine("600,00 €", "29 Stunden und 44 Minuten"),
    },
    {
      value: "2000",
      level: 4,
      text: t.verdict.level4Headline("12 Tage und 3 Stunden"),
      grey: t.verdict.greyLine("2.000,00 €", "99 Stunden und 7 Minuten"),
    },
  ];
  for (const c of cases) {
    await amount.fill(c.value);
    await expect(result(page)).toContainText(c.text);
    await expect(result(page)).toHaveClass(new RegExp(`level-${c.level}`));
    // The grey line (amount and exact hours) only appears from a working day on; small amounts need no extra line.
    const grey = result(page).locator("p.muted");
    if (c.grey) await expect(grey).toHaveText(c.grey);
    else await expect(grey).toHaveCount(0);
  }
  await expect(result(page)).toContainText(t.verdict.level4Comment("2 Wochen und 2 Tage"));

  await amount.fill("abc");
  await expect(result(page)).toContainText(t.validation.amountInvalid);
});

test("Mehr Monatsgehälter machen die Stunde wertvoller", async ({ page }) => {
  await page.getByLabel(t.settings.netLabelMonthly).fill("3000");
  const months = page.getByLabel(t.settings.monthsLabel);
  await expect(months).toHaveValue("12");
  await months.focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(months).toHaveValue("14");
  await expect(summary(page)).toContainText("42.000,00 €");

  // 42.000 € / 1784 h = 23,54 €/h, so 600 € take fewer hours than with 12 salaries (3 Tage und 6 Stunden).
  await page.getByRole("button", { name: t.app.navCalculator }).click();
  await page.getByLabel(t.calculator.amountLabel).fill("600");
  await expect(result(page)).toContainText(t.verdict.level3Headline("3 Tage und 1 Stunde"));
});

test("Jahresnetto rechnet wie das entsprechende Monatsnetto", async ({ page }) => {
  await page.getByRole("radio", { name: t.settings.yearly, exact: true }).check();
  // The slider only belongs to the monthly salary.
  await expect(page.getByLabel(t.settings.monthsLabel)).toBeHidden();
  await page.getByLabel(t.settings.netLabelYearly).fill("36000");
  await page.getByRole("button", { name: t.app.navCalculator }).click();
  await page.getByLabel(t.calculator.amountLabel).fill("600");
  await expect(result(page)).toContainText(t.verdict.level3Headline("3 Tage und 6 Stunden"));
});

test("Das Bundesland bestimmt die Feiertage", async ({ page }) => {
  await page.getByLabel(t.settings.netLabelMonthly).fill("3000");
  await expect(page.getByText(t.settings.holidaysSummary(11, 8))).toBeVisible();

  // Bayern 2026: 13 Feiertage, davon 4 am Wochenende (Mariä Himmelfahrt, 3. Oktober, Allerheiligen, 2. Weihnachtstag).
  await page.getByLabel(t.settings.stateLabel).selectOption({ label: "Bayern" });
  await expect(page.getByText(t.settings.holidaysSummary(13, 9))).toBeVisible();
  await expect(summary(page)).toContainText(`${t.settings.workingDaysPerYear}222`);

  // After a reload with valid data the app opens the calculator; the choice must still be there.
  await page.reload();
  await page.getByRole("button", { name: t.app.navSettings }).click();
  await expect(page.getByLabel(t.settings.stateLabel)).toHaveValue("BY");
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
  // The calculator stays mounted (hidden) and has its own sign, so look only inside the settings.
  const sign = page.getByRole("region", { name: t.settings.title }).getByText(t.settings.netUnit, { exact: true });
  await expect(page.getByLabel(t.settings.netLabelMonthly)).toBeVisible();
  await expect(sign).toBeVisible();

  await page.getByRole("radio", { name: t.settings.yearly, exact: true }).check();
  await expect(page.getByLabel(t.settings.netLabelYearly)).toBeVisible();
  await expect(sign).toBeVisible();
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

test("Wer Arbeitstage abwählt, bis ein Tag über 24 Stunden hätte, sieht den Fehler an den Wochenstunden", async ({
  page,
}) => {
  await page.getByLabel(t.settings.netLabelMonthly).fill("3000");
  // The weekly hours stay at the default 40 and are never touched; only the workdays change.
  for (const day of [2, 3, 4, 5]) await page.getByLabel(weekday(day), { exact: true }).uncheck();

  await expect(page.getByText(t.validation.hoursPerDayTooMany)).toBeVisible();
  await expect(page.getByLabel(t.settings.weeklyHoursLabel)).toHaveAttribute("aria-invalid", "true");
  await page.getByRole("button", { name: t.app.navCalculator }).click();
  await expect(result(page)).toContainText(t.calculator.settingsMissing);
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
  const holidays = summary(page).getByRole("listitem");
  const offDays = holidays.filter({ hasText: t.settings.holidayOffDay });
  await expect(holidays).toHaveCount(11);
  await expect(offDays).toHaveCount(3);
  await expect(offDays.first()).toContainText(t.holidays.unityDay);
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

test.describe("Startskript", () => {
  // The service worker would serve the bundles from its cache, past page.route.
  test.use({ serviceWorkers: "block" });

  test("setzt eine gespeicherte Darstellung schon ohne das JavaScript der App", async ({ page }) => {
    await page.getByLabel(t.theme.dark, { exact: true }).check();
    // Applied means the effects ran, so the choice is saved before the reload.
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.route("**/assets/*.js", (route) => route.abort());
    await page.reload();

    await expect(page.getByLabel(t.theme.dark, { exact: true })).toHaveCount(0);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });
});

test("Alle Daten löschen leert den Speicher vollständig", async ({ page }) => {
  await page.getByLabel(t.settings.netLabelMonthly).fill("3000");
  await page.getByLabel(t.theme.dark, { exact: true }).check();
  await expect.poll(async () => (await storageKeys(page)).length).toBeGreaterThan(1);

  const messages: string[] = [];
  page.once("dialog", (dialog) => {
    messages.push(dialog.message());
    void dialog.accept();
  });
  await page.getByRole("button", { name: t.privacy.deleteButton }).click();
  expect(messages).toEqual([t.privacy.deleteConfirm]);

  await expect(page.getByLabel(t.settings.netLabelMonthly)).toHaveValue("");
  await expect(page.locator("html")).not.toHaveAttribute("data-theme");
  await expect.poll(() => storageKeys(page)).toEqual([]);
});

test("Wer das Löschen abbricht, behält seine Daten", async ({ page }) => {
  await page.getByLabel(t.settings.netLabelMonthly).fill("3000");
  await expect.poll(async () => (await storageKeys(page)).length).toBeGreaterThan(0);
  const before = await storageKeys(page);

  page.once("dialog", (dialog) => void dialog.dismiss());
  await page.getByRole("button", { name: t.privacy.deleteButton }).click();

  await expect(page.getByLabel(t.settings.netLabelMonthly)).toHaveValue("3000");
  expect(await storageKeys(page)).toEqual(before);
  await page.reload();
  await expect(page.getByLabel(t.calculator.amountLabel)).toBeVisible();
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
  await expect(page.getByText(t.footer.versionLine(pkg.version).before)).toBeVisible();
  await expect(page.getByRole("link", { name: t.footer.repoLabel })).toHaveAttribute("href", REPO_URL);
  // The build runs inside the git checkout, so the version links to a real commit.
  await expect(page.getByTitle(t.footer.commitTitle)).toHaveAttribute(
    "href",
    new RegExp(`^${escape(REPO_URL)}/commit/[0-9a-f]{7}$`),
  );
  await expect(page.getByText(t.footer.creditPrefix)).toHaveText(oneOf(t.footer.quips, `${t.footer.creditPrefix} `));
});

test("Auf dem Handy passt alles in die Breite", { tag: "@handy" }, async ({ page }) => {
  const scrollsSideways = () =>
    page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  await page.getByLabel(t.settings.netLabelMonthly).fill("3000");
  await page.getByText(t.settings.holidaysSummary(11, 8)).click();
  expect(await scrollsSideways()).toBe(false);

  await page.getByRole("button", { name: t.app.navCalculator }).click();
  await page.getByLabel(t.calculator.amountLabel).fill("1000000");
  await expect(result(page)).toHaveClass(/level-4/);
  expect(await scrollsSideways()).toBe(false);
});

test("Ist als App installierbar: Manifest und Symbole sind erreichbar", { tag: "@einmal" }, async ({ page, request }) => {
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
});

test("Hat eine Link-Vorschau für Messenger (Open Graph)", { tag: "@einmal" }, async ({ page, request }) => {
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
