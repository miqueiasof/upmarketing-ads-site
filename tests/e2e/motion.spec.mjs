import { test, expect } from 'playwright/test';

test('reduced motion mostra tudo e desliga a camada', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.goto('/');
  await page.waitForTimeout(300);
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.locator('.service-card').first()).toHaveCSS('opacity', '1');
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'off');
  await expect(page.locator('.hero-diagram svg')).toHaveAttribute('data-drawn', 'static');
  await ctx.close();
});

test('sem JS tudo continua visível', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.goto('/');
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.locator('.hero-diagram svg')).toBeVisible();
  await expect(page.locator('#faq h2')).toBeVisible();
  await ctx.close();
});

test('mobile: headline e CTA na primeira dobra', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto('/');
  const h1 = await page.locator('h1').boundingBox();
  const cta = await page.locator('.hero__actions .btn--primary').boundingBox();
  expect(h1.y + h1.height).toBeLessThan(812);
  expect(cta.y + cta.height).toBeLessThan(812);
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'lite');
  await ctx.close();
});

test('desktop full: diagrama desenha e marca data-drawn', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'full');
  await expect(page.locator('.hero-diagram svg')).toHaveAttribute('data-drawn', 'true', { timeout: 6000 });
  const edgeOpacity = await page.locator('.edge').first().evaluate((el) => Number(getComputedStyle(el).opacity));
  expect(edgeOpacity).toBeGreaterThan(0.2);
});
