// A vote's page (spec verdicts), against the built site. The figures are those of
// investigations/data-sources.md.
import { expect, test } from '@playwright/test';

// The contrast of a colour "rgb(r, g, b)" on the white page (WCAG 2.1, relative luminance).
function contrastOnWhite(colour: string): number {
  const channels = (colour.match(/\d+/g) ?? []).slice(0, 3).map((value) => {
    const c = Number(value) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  expect(channels).toHaveLength(3);
  const [r = 0, g = 0, b = 0] = channels;
  return 1.05 / (0.2126 * r + 0.7152 * g + 0.0722 * b + 0.05);
}

test('the page of a vote: head, figures, verdicts, cantons and note', async ({ page }) => {
  await page.goto('/votes/5960');
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Volksinitiative «Für Ehe und Familie - gegen die Heiratsstrafe»',
  );
  await expect(page.getByText('28. Februar 2016 · Volksinitiative', { exact: true })).toBeVisible();
  await expect(
    page.getByText('Braucht das Volksmehr und das Ständemehr.', { exact: true }),
  ).toBeVisible();
  await expect(page.locator('.figures dd')).toHaveText([
    "1'609'152",
    "1'664'224",
    '49.16%',
    '63.25%',
  ]);
  await expect(page.locator('.verdict h2')).toHaveText(['Volksmehr', 'Ständemehr']);
  await expect(page.locator('.verdict .word')).toHaveText(['Nein', 'Ja']);
  await expect(page.locator('.verdict p:not(.word)')).toHaveText(['49.16%', '16½ : 6½']);
  await expect(page.locator('.outcome')).toHaveText('Abgelehnt');
  const rows = page.locator('tbody tr');
  await expect(rows).toHaveCount(26);
  await expect(rows.first().locator('th, td')).toHaveText(['ZH', '43.46%', '1', 'Nein']);
  await expect(page.getByText('Quelle: BBl 2019 4599', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Hinweis der Bundeskanzlei' })).toBeVisible();
  await expect(
    page.getByText(/^Das Bundesgericht hat mit Urteilen vom 10\. April 2019 /),
  ).toBeVisible();
});

test('a majority that is not needed: its cantonal votes greyed out', async ({ page }) => {
  await page.goto('/votes/6790');
  await expect(page.getByText('Braucht nur das Volksmehr.', { exact: true })).toBeVisible();
  await expect(page.locator('.verdict .word')).toHaveText(['Ja', 'nicht nötig']);
  const figures = page.locator('.verdict p:not(.word)');
  await expect(figures).toHaveText(['50.39%', '7½ : 15½']);
  await expect(figures.nth(1)).toHaveClass(/\bgreyed\b/);
  const colour = (index: number) =>
    figures.nth(index).evaluate((element) => getComputedStyle(element).color);
  expect(await colour(1)).not.toBe(await colour(0));
  // Greyed, but still readable: WCAG's minimum for text of normal size.
  expect(contrastOnWhite(await colour(1))).toBeGreaterThanOrEqual(4.5);
  await expect(page.locator('.outcome')).toHaveText('Angenommen');
});

test('the tie-break question: its figures, and no verdicts', async ({ page }) => {
  await page.goto('/votes/6823');
  for (const line of [
    "Für die Initiative: 1'098'341 (37.36%)",
    "Für den Gegenentwurf: 1'841'208 (62.64%)",
    'Stände: 2 für die Initiative, 21 für den Gegenentwurf',
    'Die Stichfrage zählt nur, wenn die Initiative und der Gegenentwurf beide angenommen sind; ' +
      'sie wird hier nicht beurteilt.',
  ]) {
    await expect(page.getByText(line, { exact: true })).toBeVisible();
  }
  for (const word of ['Volksmehr', 'Ständemehr', 'Angenommen', 'Abgelehnt']) {
    await expect(page.locator('body')).not.toContainText(word);
  }
  await expect(page.getByRole('table')).toHaveCount(0);
});

test('the calculated figures, with a note where they differ from the validated result', async ({
  page,
}) => {
  await page.goto('/votes/6650');
  await expect(page.locator('.figures dd').nth(1)).toHaveText("1'350'525");
  await expect(page.locator('.outcome')).toHaveText('Angenommen');
  await expect(
    page.getByText(
      "Das erwahrte Ergebnis zählt 1'350'325 Nein-Stimmen (BBl 2024 996); die Zahlen der " +
        'Gemeinden, aus denen hier gerechnet wird, ergeben 200 mehr.',
      { exact: true },
    ),
  ).toBeVisible();
});

test("the vote's entries stay out of the browser", async ({ page }) => {
  const paths: string[] = [];
  page.on('request', (request) => paths.push(new URL(request.url()).pathname));
  await page.goto('/votes/5960', { waitUntil: 'networkidle' });
  expect(paths).toContain('/votes/5960');
  expect(paths.filter((path) => path.startsWith('/data/votes/'))).toEqual([]);
});

test("a vote's page requests nothing from other servers", async ({ page }) => {
  const origins = new Set<string>();
  const paths: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    origins.add(url.origin);
    paths.push(url.pathname);
  });
  await page.goto('/votes/5960', { waitUntil: 'networkidle' });
  await page.getByRole('link', { name: 'Alle Abstimmungen' }).click();
  await expect(page).toHaveURL('/');
  await page.waitForLoadState('networkidle');
  // Back on the start page, the browser has asked for its data.
  expect(paths).toContain('/__data.json');
  expect([...origins]).toEqual([new URL(page.url()).origin]);
});
