// Renders the PNG app icons in public/ from scripts/icons/hourglass.svg.tpl.
// Run after changing the icon: node scripts/render-icons.mjs
// (uses Playwright's Chromium; set PW_CHROMIUM_PATH to use an installed one instead).
import { readFileSync, writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";

const template = readFileSync(new URL("./icons/hourglass.svg.tpl", import.meta.url), "utf8");
const svg = ({ radius, scale }) => template.replace("{{RADIUS}}", radius).replace("{{SCALE}}", scale);

// "any": rounded like the favicon. "maskable" and Apple: full-bleed, the system applies its own shape;
// the hourglass is shrunk to stay inside the maskable safe zone (inner 80 % circle).
const icons = [
  { file: "favicon.svg", svg: svg({ radius: 14, scale: 1 }) },
  { file: "icon-192.png", size: 192, svg: svg({ radius: 14, scale: 1 }) },
  { file: "icon-512.png", size: 512, svg: svg({ radius: 14, scale: 1 }) },
  { file: "icon-maskable-512.png", size: 512, svg: svg({ radius: 0, scale: 0.75 }) },
  { file: "apple-touch-icon.png", size: 180, svg: svg({ radius: 0, scale: 0.85 }) },
];

const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM_PATH || undefined });
const page = await browser.newPage();
for (const icon of icons) {
  const target = new URL(`../public/${icon.file}`, import.meta.url);
  if (!icon.size) {
    writeFileSync(target, icon.svg);
    continue;
  }
  await page.setViewportSize({ width: icon.size, height: icon.size });
  const dataUrl = `data:image/svg+xml;base64,${Buffer.from(icon.svg).toString("base64")}`;
  await page.setContent(
    `<style>html,body{margin:0;background:transparent}</style><img src="${dataUrl}" width="${icon.size}" height="${icon.size}">`,
  );
  await page.locator("img").screenshot({ path: target.pathname, omitBackground: true });
  console.log(`${icon.file} (${icon.size} px)`);
}
await browser.close();
