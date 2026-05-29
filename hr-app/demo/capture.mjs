import { _electron as electron } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const outDir = path.join(__dirname, 'visuals');
fs.mkdirSync(outDir, { recursive: true });

const SHOT_W = 1920;
const SHOT_H = 1080;

async function shoot(window, id, opts = {}) {
  const settle = opts.settle ?? 500;
  await window.waitForTimeout(settle);
  const filename = path.join(outDir, `${id}.png`);
  await window.screenshot({ path: filename, fullPage: false });
  console.log(`  shot ${id}.png`);
}

async function main() {
  // Force fresh DB so seeded sample data is consistent every run
  const userData = path.join(process.env.APPDATA, 'HR Desktop');
  for (const f of ['hrapp.db', 'hrapp.db-wal', 'hrapp.db-shm', 'hrapp.db-journal']) {
    const p = path.join(userData, f);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }

  console.log('launching electron...');
  const app = await electron.launch({
    args: [projectRoot],  // electron reads package.json + main field
    cwd: projectRoot,
    env: { ...process.env, NODE_ENV: 'production' },
  });
  app.process().stderr.on('data', (d) => process.stderr.write(`[electron stderr] ${d}`));
  app.process().stdout.on('data', (d) => process.stdout.write(`[electron stdout] ${d}`));

  const window = await app.firstWindow();
  await window.setViewportSize({ width: SHOT_W, height: SHOT_H });
  await window.waitForLoadState('domcontentloaded');
  await window.waitForTimeout(1500);

  // ---------- Scene 2 — login ----------
  console.log('Scene 2: login');
  await shoot(window, 'scene-02a-login-empty', { settle: 1000 });
  await window.fill('input#username', 'demo');
  await shoot(window, 'scene-02b-login-username');
  await window.fill('input#password', 'demo1234');
  await shoot(window, 'scene-02c-login-typed');
  await window.click('button[type="submit"]');
  // Wait for the sidebar to render — most reliable signal we're past login.
  await window.waitForSelector('text=Employees', { timeout: 15000 }).catch(async (e) => {
    console.error('login may have failed — dumping state');
    await shoot(window, 'scene-02-LOGIN-FAILED', { settle: 500 });
    const url = window.url();
    const storage = await window.evaluate(() => JSON.stringify({
      token: localStorage.getItem('hrapp.session.token'),
      bodyText: document.body.innerText.slice(0, 500),
    }));
    console.error('url=', url, 'state=', storage);
    throw e;
  });
  await window.waitForTimeout(2000);
  await shoot(window, 'scene-02d-after-login', { settle: 1000 });

  // ---------- Scene 3 — employees ----------
  console.log('Scene 3: employees');
  await shoot(window, 'scene-03a-employees-list', { settle: 1000 });
  // Open first employee
  const firstRow = window.locator('tbody tr').first();
  await firstRow.click();
  await window.waitForTimeout(1500);
  await shoot(window, 'scene-03b-employee-detail');
  // Back to list
  await window.goto('#/employees').catch(() => {});
  await window.waitForTimeout(500);

  // ---------- Scene 4 — leave ----------
  console.log('Scene 4: leave');
  await window.click('a[href="#/leave"]').catch(async () => {
    // Fallback: nav link by visible text
    await window.getByRole('link', { name: 'Leave' }).click();
  });
  await window.waitForTimeout(1500);
  await shoot(window, 'scene-04a-leave-list', { settle: 1000 });
  // Open first leave application
  const firstLeave = window.locator('tbody tr').first();
  if (await firstLeave.count() > 0) {
    await firstLeave.click();
    await window.waitForTimeout(1500);
    await shoot(window, 'scene-04b-leave-detail');
  }

  // ---------- Scene 5 — disciplinary ----------
  console.log('Scene 5: disciplinary');
  await window.getByRole('link', { name: 'Disciplinary' }).click();
  await window.waitForTimeout(1500);
  await shoot(window, 'scene-05a-disciplinary-list', { settle: 1000 });
  const firstCase = window.locator('tbody tr').first();
  if (await firstCase.count() > 0) {
    await firstCase.click();
    await window.waitForTimeout(1500);
    await shoot(window, 'scene-05b-disciplinary-detail');
  }

  // ---------- Scene 6 — job descriptions ----------
  console.log('Scene 6: job descriptions');
  await window.getByRole('link', { name: 'Job Descriptions' }).click();
  await window.waitForTimeout(1500);
  await shoot(window, 'scene-06a-jd-list', { settle: 1000 });
  const firstJd = window.locator('tbody tr').first();
  if (await firstJd.count() > 0) {
    await firstJd.click();
    await window.waitForTimeout(1500);
    await shoot(window, 'scene-06b-jd-detail');
  }

  // ---------- Scene 7 — training ----------
  console.log('Scene 7: training');
  await window.getByRole('link', { name: 'Training' }).click();
  await window.waitForTimeout(1500);
  await shoot(window, 'scene-07a-training-catalogue', { settle: 1000 });

  // ---------- Scene 8 — performance ----------
  console.log('Scene 8: performance');
  await window.getByRole('link', { name: 'Performance' }).click();
  await window.waitForTimeout(1500);
  await shoot(window, 'scene-08a-performance-list', { settle: 1000 });
  const firstPerf = window.locator('tbody tr').first();
  if (await firstPerf.count() > 0) {
    await firstPerf.click();
    await window.waitForTimeout(1500);
    await shoot(window, 'scene-08b-performance-detail');
  }

  // ---------- Scene 9 — development ----------
  console.log('Scene 9: development');
  await window.getByRole('link', { name: 'Development' }).click();
  await window.waitForTimeout(1500);
  await shoot(window, 'scene-09a-development-list', { settle: 1000 });
  const firstDev = window.locator('tbody tr').first();
  if (await firstDev.count() > 0) {
    await firstDev.click();
    await window.waitForTimeout(1500);
    await shoot(window, 'scene-09b-development-detail');
  }

  // ---------- Scene 10 — settings ----------
  console.log('Scene 10: settings');
  await window.getByRole('link', { name: 'Settings' }).click();
  await window.waitForTimeout(1500);
  await shoot(window, 'scene-10a-settings', { settle: 1000 });

  console.log('done — closing app');
  await app.close();
}

main().catch((e) => {
  console.error('CAPTURE FAILED:', e);
  process.exit(1);
});
