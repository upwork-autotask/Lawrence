import { expect, type Page, test } from '@playwright/test';

const admin = {
  username: 'admin',
  password: 'Admin',
};

async function login(page: Page) {
  await page.goto('/login');
  if (new URL(page.url()).pathname !== '/login') return;

  await page.getByLabel('Username').fill(admin.username);
  await page.getByLabel('Password').fill(admin.password);
  await Promise.all([
    page.waitForURL((url) => url.pathname !== '/login'),
    page.getByRole('button', { name: /sign in/i }).click(),
  ]);
}

async function expectNoBrowserErrors(page: Page, run: () => Promise<void>) {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console error: ${msg.text()}`);
  });
  page.on('response', (response) => {
    if (response.url().includes('/api/') && response.status() >= 500) {
      errors.push(`api ${response.status()} ${response.url()}`);
    }
  });

  await run();
  expect(errors).toEqual([]);
}

test.describe.serial('HR web E2E', () => {
  test('protects app routes and supports accessible login', async ({ page }) => {
    await expectNoBrowserErrors(page, async () => {
      await page.goto('/employees');
      await expect(page).toHaveURL(/\/login$/);

      await page.getByLabel('Username').fill(admin.username);
      await page.getByLabel('Password').fill(admin.password);
      await Promise.all([
        page.waitForURL(/\/employees$/),
        page.getByRole('button', { name: /sign in/i }).click(),
      ]);

      await expect(page.getByRole('heading', { name: 'Employees' })).toBeVisible();
    });
  });

  test('opens mobile navigation as a drawer and closes after route selection', async ({ page }) => {
    await expectNoBrowserErrors(page, async () => {
      await page.setViewportSize({ width: 390, height: 844 });
      await login(page);
      await page.goto('/employees');
      await expect(page.getByRole('heading', { name: 'Employees' })).toBeVisible();

      const before = await page.evaluate(() => {
        const visibleAsides = [...document.querySelectorAll('aside')]
          .filter((el) => getComputedStyle(el).display !== 'none');
        const main = document.querySelector('main')?.getBoundingClientRect();
        return { visibleAsideCount: visibleAsides.length, mainWidth: main?.width ?? 0 };
      });
      expect(before.visibleAsideCount).toBe(0);
      expect(before.mainWidth).toBeGreaterThanOrEqual(350);

      await page.getByRole('button', { name: 'Open navigation' }).click();
      await page.getByRole('link', { name: 'Reports' }).click();
      await expect(page).toHaveURL(/\/reports$/);
      await expect(page.getByRole('heading', { name: 'Reports' })).toBeVisible();

      const after = await page.evaluate(() => {
        const visibleAsides = [...document.querySelectorAll('aside')]
          .filter((el) => getComputedStyle(el).display !== 'none');
        const main = document.querySelector('main')?.getBoundingClientRect();
        return { visibleAsideCount: visibleAsides.length, mainWidth: main?.width ?? 0 };
      });
      expect(after.visibleAsideCount).toBe(0);
      expect(after.mainWidth).toBeGreaterThanOrEqual(350);
    });
  });

  test('creates and removes a lookup value', async ({ page }) => {
    await expectNoBrowserErrors(page, async () => {
      const stamp = Date.now();
      const lookupName = `E2E Dept ${stamp}`;
      const lookupCode = `E2E${String(stamp).slice(-5)}`;

      await login(page);
      await page.goto('/lookups');
      await page.getByRole('button', { name: 'Add value' }).click();

      await page.getByLabel('Name').fill(lookupName);
      await page.getByLabel('Code').fill(lookupCode);
      await page.getByLabel('Sort order').fill('999');
      await page.getByLabel('Description').fill('Temporary E2E lookup');
      await page.getByRole('button', { name: 'Add', exact: true }).click();
      await expect(page.getByText(lookupName)).toBeVisible();

      const row = page.locator('tr', { hasText: lookupName });
      page.once('dialog', (dialog) => dialog.accept());
      await row.getByRole('button', { name: 'Delete' }).click();
      await expect(page.getByText(lookupName)).toHaveCount(0);
    });
  });

  test('creates a user and keeps them visible after deactivation', async ({ page }) => {
    await expectNoBrowserErrors(page, async () => {
      const username = `e2e_${String(Date.now()).slice(-8)}`;

      await login(page);
      await page.goto('/users');
      await page.getByRole('button', { name: 'New user' }).click();

      await page.getByLabel('Full name').fill('E2E Test User');
      await page.getByLabel('Username').fill(username);
      await page.getByLabel('Password').fill('password123');
      await page.getByLabel('Role').selectOption({ label: 'Viewer' });
      await page.getByRole('button', { name: 'Create user' }).click();

      await page.locator('input[placeholder="Search username or name…"]').fill(username);
      await expect(page.getByText(username)).toBeVisible();

      const row = page.locator('tr', { hasText: username });
      page.once('dialog', (dialog) => dialog.accept());
      await row.getByRole('button', { name: 'Deactivate' }).click();
      await expect(row.getByText('Inactive')).toBeVisible();
    });
  });
});
