// Renders the PNG app icons and the link preview image (og-image.png) in public/
// from scripts/icons/hourglass.svg.tpl and the text catalog.
// Run after changing the icon or the app's name/tagline: node scripts/render-icons.mjs
// (needs Node 22.18+ to read the TypeScript catalog; uses Playwright's Chromium,
// set PW_CHROMIUM_PATH to use an installed one instead).
import { readFileSync, writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";
import { de as t } from "../src/i18n/de.ts";

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
// Link preview for messengers and social networks (Open Graph), 1200 x 630.
const escape = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const iconUrl = `data:image/svg+xml;base64,${Buffer.from(svg({ radius: 14, scale: 1 })).toString("base64")}`;
await page.setViewportSize({ width: 1200, height: 630 });
await page.setContent(`<style>
  html, body { margin: 0; }
  body {
    width: 1200px; height: 630px; box-sizing: border-box; padding: 0 90px;
    display: flex; align-items: center; gap: 64px;
    background: #1f2527; color: #eef0ef; font-family: system-ui, "DejaVu Sans", sans-serif;
  }
  img { width: 260px; height: 260px; flex: none; }
  h1 { margin: 0 0 28px; font-size: 84px; line-height: 1; white-space: nowrap; }
  p { margin: 0; font-size: 40px; line-height: 1.3; text-wrap: balance; }
  .sub { margin-top: 36px; font-size: 30px; color: #ff9a5c; }
</style>
<img src="${iconUrl}" alt="">
<div><h1>${escape(t.app.title)}</h1><p>${escape(t.app.tagline)}</p><p class="sub">${escape(t.app.previewSubline)}</p></div>`);
await page.screenshot({ path: new URL("../public/og-image.png", import.meta.url).pathname });
console.log("og-image.png (1200 x 630 px)");

await browser.close();
