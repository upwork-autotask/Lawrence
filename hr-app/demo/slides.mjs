import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = `${__dirname}\\visuals`;
fs.mkdirSync(outDir, { recursive: true });

// Slide HTML templates — dark theme to match the app, simple typography.
const cssBase = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 1920px; height: 1080px; background: #0b0b0c; color: #fafafa;
    font-family: -apple-system, "Segoe UI", Roboto, sans-serif; overflow: hidden; }
  .slide { width: 100%; height: 100%; display: flex; flex-direction: column;
    justify-content: center; align-items: center; padding: 120px; }
  h1 { font-size: 130px; font-weight: 600; letter-spacing: -3px; }
  h1 .accent { color: #60a5fa; }
  h2 { font-size: 56px; font-weight: 500; color: #cbd5e1; margin-top: 32px; letter-spacing: -0.5px; }
  .meta { margin-top: 60px; font-size: 28px; color: #64748b; letter-spacing: 1px; text-transform: uppercase; }
  ul.roadmap { list-style: none; display: grid; grid-template-columns: 1fr 1fr;
    gap: 40px 80px; margin-top: 80px; max-width: 1400px; }
  ul.roadmap li { font-size: 44px; color: #e2e8f0; display: flex; align-items: center; gap: 24px; }
  ul.roadmap li::before { content: ""; width: 14px; height: 14px; border-radius: 50%;
    background: #60a5fa; flex-shrink: 0; }
  .roadmap-title { font-size: 80px; font-weight: 600; color: #f8fafc; }
  .roadmap-sub { font-size: 32px; color: #94a3b8; margin-top: 20px; }
  .close-msg { font-size: 56px; color: #e2e8f0; max-width: 1500px; line-height: 1.3;
    text-align: center; font-weight: 400; }
  .close-tag { margin-top: 80px; font-size: 28px; color: #64748b; letter-spacing: 2px;
    text-transform: uppercase; }
`;

const slides = {
  'scene-01-title': `<div class="slide">
    <h1>HR <span class="accent">Desktop</span></h1>
    <h2>Recruitment &amp; HR Operations</h2>
    <div class="meta">Preview Build</div>
  </div>`,
  'scene-11-roadmap': `<div class="slide" style="justify-content:flex-start; padding-top:140px;">
    <div class="roadmap-title">What&rsquo;s coming next</div>
    <div class="roadmap-sub">Four modules and optional cloud sync</div>
    <ul class="roadmap">
      <li>Recruitment with multi-lead interview panels</li>
      <li>Succession planning</li>
      <li>Expenses &amp; car scheme</li>
      <li>Exit interviews</li>
      <li>Reports &amp; ad-hoc exports</li>
      <li>Optional cloud sync</li>
    </ul>
  </div>`,
  'scene-12-close': `<div class="slide">
    <p class="close-msg">Thank you for previewing HR Desktop.<br/>We&rsquo;d love your feedback.</p>
    <div class="close-tag">Preview Build &middot; v0.1.0</div>
  </div>`,
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });

for (const [id, body] of Object.entries(slides)) {
  const page = await ctx.newPage();
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>${cssBase}</style></head><body>${body}</body></html>`;
  await page.setContent(html, { waitUntil: 'load' });
  await page.waitForTimeout(200);
  const file = `${outDir}\\${id}.png`;
  await page.screenshot({ path: file, fullPage: false });
  console.log(`  rendered ${id}.png`);
  await page.close();
}

await browser.close();
console.log('done');
