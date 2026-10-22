import { test, expect } from 'playwright/test';

const URL = '/preview-motion/';
const opacityOf = (locator) => locator.evaluate((el) => Number(getComputedStyle(el).opacity));

test('v2 full: intro termina, loops ligam e o texto fica visível', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(URL);
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'full');
  await expect(page.locator('.hv2-dia')).toHaveAttribute('data-drawn', 'true', { timeout: 6000 });
  await expect(page.locator('.hv2')).toHaveClass(/is-live/);
  expect(await opacityOf(page.locator('.hv2__w > span').last())).toBe(1);
  expect(await opacityOf(page.locator('.hv2__actions'))).toBe(1);
  await expect.poll(() => opacityOf(page.locator('.hv2-dia .flow').first())).toBeGreaterThan(0.3);
});

test('v2 scroll: hero fixa e o diagrama vai para o centro', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(URL);
  await expect(page.locator('.hv2-dia')).toHaveAttribute('data-drawn', 'true', { timeout: 6000 });
  const before = await page.locator('.hv2__stage').boundingBox();
  await page.mouse.wheel(0, 650);
  await page.waitForTimeout(1500);
  const after = await page.locator('.hv2__stage').boundingBox();
  expect(after.x).toBeLessThan(before.x - 150);
  expect(await opacityOf(page.locator('.hv2__text'))).toBeLessThan(0.5);
});

test('v2 sem o script do hero: failsafe mostra o texto', async ({ page }) => {
  await page.route('**/hero-v2.js', (route) => route.abort());
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(URL);
  await page.waitForTimeout(3000);
  expect(await opacityOf(page.locator('.hv2__w > span').first())).toBe(1);
  expect(await opacityOf(page.locator('.hv2__actions'))).toBe(1);
});

test('v2 reduced motion: estático e visível', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.goto(URL);
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'off');
  await expect(page.locator('.hv2-dia')).toHaveAttribute('data-drawn', 'static');
  expect(await opacityOf(page.locator('.hv2__w > span').first())).toBe(1);
  await ctx.close();
});

test('v2 mobile: headline e CTA na dobra, sem scroll horizontal', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto(URL);
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'lite');
  const cta = await page.locator('.hv2__actions .btn--primary').boundingBox();
  expect(cta.y + cta.height).toBeLessThan(812);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  await ctx.close();
});

test('v2 é noindex e não substitui a home', async ({ page }) => {
  await page.goto(URL);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,nofollow');
  await page.goto('/');
  await expect(page.locator('.hv2')).toHaveCount(0);
  await expect(page.locator('.hero-diagram svg')).toHaveCount(1);
});
