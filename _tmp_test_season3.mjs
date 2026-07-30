import { chromium } from '/Users/andrew/LabRadar/node_modules/playwright/index.mjs';

const browser = await chromium.launch();
const context = await browser.newContext({ storageState: '_tmp_storage_state.json' });
const page = await context.newPage();
page.on('response', res => {
  if (res.url().includes('/api/portal/seasons')) console.log('[response]', res.status(), res.url());
});

await page.goto('http://localhost:3000/portal/super-admin?tab=seasons', { waitUntil: 'networkidle' });
await page.getByRole('button', { name: 'Add New Season' }).click();
await page.waitForTimeout(500);

await page.locator('input[type="number"]').fill('2027');
await page.locator('select').first().selectOption('winter');
await page.getByRole('button', { name: 'Create' }).click();
await page.waitForTimeout(1500);
await page.screenshot({ path: '/tmp/after_add_season.png', fullPage: true });

await browser.close();
