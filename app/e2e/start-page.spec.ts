import { expect, test } from '@playwright/test';

test('one row for each canton', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Popular Vote Explorer' })).toBeVisible();
  const rows = page.locator('tbody tr');
  await expect(rows).toHaveCount(26);
  await expect(rows.first().locator('td').first()).toHaveText('ZH');
  await expect(rows.last().locator('td').first()).toHaveText('JU');
});

test('the six cantons with half a vote', async ({ page }) => {
  await page.goto('/');
  const rowsShowing = (cantonalVotes: string) =>
    page
      .locator('tbody tr')
      .filter({ has: page.locator(`td:nth-child(2):text-is("${cantonalVotes}")`) });
  await expect(rowsShowing('0.5').locator('td:first-child')).toHaveText([
    'OW',
    'NW',
    'BS',
    'BL',
    'AR',
    'AI',
  ]);
  await expect(rowsShowing('1')).toHaveCount(20);
});

test('the total', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('tfoot th')).toHaveText('Total');
  await expect(page.locator('tfoot td')).toHaveText('23');
});

test('all requests go to the site itself', async ({ page }) => {
  const origins = new Set<string>();
  page.on('request', (request) => origins.add(new URL(request.url()).origin));
  await page.goto('/', { waitUntil: 'networkidle' });
  expect([...origins]).toEqual([new URL(page.url()).origin]);
});
