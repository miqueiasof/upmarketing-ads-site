import { test, expect } from 'playwright/test';

const scrollTo = async (page, selector, block = 'center') => {
  await page.locator(selector).first().evaluate((el, b) => el.scrollIntoView({ block: b }), block);
  await page.waitForTimeout(1600);
};

test.describe('desktop full motion', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await expect(page.locator('.hv2-dia')).toHaveAttribute('data-drawn', 'true', { timeout: 6000 });
  });

  test('títulos de seção são divididos em palavras e aparecem', async ({ page }) => {
    await scrollTo(page, '#method .section__head');
    const words = page.locator('#method .section__head .sw > span');
    expect(await words.count()).toBeGreaterThan(2);
    const transform = await words.first().evaluate((el) => getComputedStyle(el).transform);
    expect(['none', 'matrix(1, 0, 0, 1, 0, 0)']).toContain(transform);
  });

  test('método: trilho enche e o passo alcançado acende', async ({ page }) => {
    await expect(page.locator('.steps-wrap')).toHaveClass(/is-armed/);
    await scrollTo(page, '.step:nth-child(3)');
    await expect(page.locator('.step').nth(0)).toHaveClass(/is-on/);
    await expect(page.locator('.step').nth(4)).not.toHaveClass(/is-on/);
  });

  test('funil: barras crescem e o vazamento liga', async ({ page }) => {
    await scrollTo(page, '.funnel');
    await expect(page.locator('.funnel')).toHaveClass(/is-live/, { timeout: 4000 });
    const t = await page.locator('.funnel__col--before .funnel__bar').last().evaluate((el) => getComputedStyle(el).transform);
    expect(['none', 'matrix(1, 0, 0, 1, 0, 0)']).toContain(t);
  });

  test('portfólio: galeria fixa e desliza para o lado com o scroll', async ({ page }) => {
    await expect(page.locator('.strip')).toHaveClass(/is-scrub/);
    await scrollTo(page, '.strip');
    const before = await page.locator('.strip__track').evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m41);
    await page.mouse.wheel(0, 700);
    await page.waitForTimeout(1500);
    const after = await page.locator('.strip__track').evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m41);
    expect(after).toBeLessThan(before - 200);
  });

  test('FAQ abre e fecha com animação e termina no estado certo', async ({ page }) => {
    await scrollTo(page, '#faq');
    const second = page.locator('.faq__item').nth(1);
    await second.locator('summary').click();
    await expect(second).toHaveAttribute('open', '');
    await page.waitForTimeout(600);
    expect(await second.locator('.faq__a').evaluate((el) => el.getBoundingClientRect().height)).toBeGreaterThan(20);
    await second.locator('summary').click();
    await page.waitForTimeout(600);
    await expect(second).not.toHaveAttribute('open', '');
  });

  test('prova: números contam até o valor do texto', async ({ page }) => {
    await scrollTo(page, '.proof');
    await expect(page.locator('.proof__n').first()).toHaveText('4', { timeout: 4000 });
    await expect(page.locator('.proof__item').nth(2)).toContainText('24/7');
  });
});

test('reduced motion: nada dividido, barras cheias, galeria arrastável', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.goto('/');
  await expect(page.locator('.sw')).toHaveCount(0);
  const t = await page.locator('.funnel__bar').first().evaluate((el) => getComputedStyle(el).transform);
  expect(t).toBe('none');
  await expect(page.locator('.strip')).not.toHaveClass(/is-scrub/);
  expect(await page.locator('.strip').evaluate((el) => getComputedStyle(el).overflowX)).toBe('auto');
  await ctx.close();
});
