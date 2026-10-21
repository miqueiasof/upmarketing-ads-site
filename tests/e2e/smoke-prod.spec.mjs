// Production smoke test. Run: npm run test:prod (uses playwright.prod.config.mjs, no local server).
import { test, expect } from 'playwright/test';

const SITE = 'https://upmarketingads.com';
const EXPECTED_URLS = 29;
const PORTFOLIO_IMAGES = 8;

const locsFromSitemap = async (request) => {
  const res = await request.get(`${SITE}/sitemap.xml`);
  expect(res.status()).toBe(200);
  const xml = await res.text();
  return [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
};

test('sitemap tem 29 URLs e todas respondem 200', async ({ request }) => {
  const locs = await locsFromSitemap(request);
  expect(locs).toHaveLength(EXPECTED_URLS);
  const statuses = await Promise.all(locs.map(async (u) => [u, (await request.get(u)).status()]));
  const failing = statuses.filter(([, s]) => s !== 200);
  expect(failing, failing.map(([u, s]) => `${s} ${u}`).join('\n')).toEqual([]);
});

test('robots e llms.txt no ar', async ({ request }) => {
  const robots = await request.get(`${SITE}/robots.txt`);
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain(`Sitemap: ${SITE}/sitemap.xml`);
  const llms = await request.get(`${SITE}/llms.txt`);
  expect(llms.status()).toBe(200);
  expect(await llms.text()).toContain('# UP Marketing Ads');
});

test('portfólio continua no ar com as imagens', async ({ request }) => {
  const res = await request.get(`${SITE}/portfolio/`);
  expect(res.status()).toBe(200);
  const html = await res.text();
  const srcs = [...html.matchAll(/<img[^>]+src="([^"]+)"/g)].map((m) => new URL(m[1], `${SITE}/portfolio/`).href);
  expect(srcs).toHaveLength(PORTFOLIO_IMAGES);
  for (const src of srcs) expect((await request.get(src)).status(), src).toBe(200);
});

test('rota de preview protegida segue intacta (401)', async ({ request }) => {
  const res = await request.get(`${SITE}/preview-ginagaya/`, { maxRedirects: 0 });
  expect(res.status()).toBe(401);
});

test('obrigado é noindex; og:image única e existente em cada URL indexável', async ({ request }) => {
  const thanks = await request.get(`${SITE}/diagnosis/thanks/`);
  expect(await thanks.text()).toContain('<meta name="robots" content="noindex,nofollow">');
  const locs = (await locsFromSitemap(request)).filter((u) => !u.endsWith('/portfolio/'));
  const images = await Promise.all(locs.map(async (u) => {
    const html = await (await request.get(u)).text();
    return html.match(/<meta property="og:image" content="([^"]+)">/)?.[1];
  }));
  expect(images.every(Boolean)).toBe(true);
  expect(new Set(images).size, 'og:image repetida').toBe(images.length);
  for (const img of new Set(images)) {
    const res = await request.get(img);
    expect(res.status(), img).toBe(200);
    expect(res.headers()['content-type']).toContain('image/jpeg');
  }
});
