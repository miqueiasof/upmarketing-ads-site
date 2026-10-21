import { test, expect } from 'playwright/test';

const WEBHOOK = '**/webhook/upmarketing-form';

async function fillA(page) {
  await page.goto('/diagnosis/');
  await page.locator('input[name="business_type"][value="course"]').check({ force: true });
  await page.locator('input[name="revenue"][value="gt200k"]').check({ force: true });
  await page.locator('input[name="time_in_business"][value="3-10y"]').check({ force: true });
  await page.locator('[data-step="1"] [data-next]').click();

  await page.locator('input[name="pain[]"][value="leads"]').check({ force: true });
  await page.locator('input[name="pain[]"][value="follow-up"]').check({ force: true });
  await page.locator('input[name="pain_duration"][value="1-3y"]').check({ force: true });
  await page.locator('input[name="tried[]"][value="agency"]').check({ force: true });
  await page.fill('#tried_why', 'Slow and generic');
  await page.locator('[data-step="2"] [data-next]').click();

  await page.locator('input[name="services[]"][value="ai-automation"]').check({ force: true });
  await page.locator('input[name="budget"][value="gt5000"]').check({ force: true });
  await page.locator('input[name="timeline"][value="now"]').check({ force: true });
  await page.fill('#diag-name', 'Test Person');
  await page.fill('#diag-email', 'test@example.com');
  await page.fill('#diag-whatsapp', '+447000000000');
  await page.locator('input[name="consent"]').check({ force: true });
}

test('fluxo A completo envia payload com score e cai no obrigado A', async ({ page }) => {
  let body = null;
  await page.route(WEBHOOK, async (route) => { body = route.request().postDataJSON(); await route.fulfill({ status: 200, body: '{}' }); });
  await fillA(page);
  await page.locator('[data-submit]').click();
  await page.waitForURL(/\/diagnosis\/thanks\/\?p=A$/);
  expect(body.priority).toBe('A');
  expect(body.score).toBe(14);
  expect(body.tried_why).toBe('Slow and generic');
  expect(body.lang).toBe('en');
  expect(body.pain).toEqual(['leads', 'follow-up']);
  await expect(page.locator('#thanks h1')).toHaveText("We've got it, Test.");
  await expect(page.locator('#thanks a.thanks__wa')).toHaveAttribute('href', /wa\.me\/447547020024\?text=.*Test/);
});

test('validação por passo segura no passo 1', async ({ page }) => {
  await page.goto('/diagnosis/');
  await page.locator('[data-step="1"] [data-next]').click();
  await expect(page.locator('[data-err-for="business_type"]')).toBeVisible();
  await expect(page.locator('[data-step="1"]')).toBeVisible();
  await expect(page.locator('[data-step="2"]')).toBeHidden();
});

test('webhook caído: cai no obrigado com sent=0 e fallback WhatsApp', async ({ page }) => {
  await page.route(WEBHOOK, (route) => route.abort('failed'));
  await fillA(page);
  await page.locator('[data-submit]').click();
  await page.waitForURL(/sent=0/, { timeout: 20000 });
  await expect(page.locator('.thanks__fallback')).toBeVisible();
  await expect(page.locator('#thanks a.thanks__wa')).toHaveAttribute('href', /text=.*Test/);
});

test('honeypot preenchido não chama o webhook', async ({ page }) => {
  let called = false;
  await page.route(WEBHOOK, async (route) => { called = true; await route.fulfill({ status: 200, body: '{}' }); });
  await fillA(page);
  await page.fill('input[name="company_url"]', 'http://spam.example', { force: true });
  await page.locator('[data-submit]').click();
  await page.waitForURL(/\/diagnosis\/thanks\//);
  expect(called).toBe(false);
});
