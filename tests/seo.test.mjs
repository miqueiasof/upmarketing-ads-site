import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

execSync('npm run build', { stdio: 'pipe' });

const SITE = 'https://upmarketingads.com';
const EXPECTED_URLS = 29;

const generatedPages = readdirSync('dist', { recursive: true })
  .filter((f) => f.endsWith('index.html'))
  .map((f) => join('dist', f))
  .filter((f) => !f.startsWith('dist/portfolio/') && f !== 'dist/diagnosis/thanks/index.html');

test('sitemap tem 29 URLs absolutas, sem o obrigado, com hreflang nas homes', () => {
  const xml = readFileSync('dist/sitemap.xml', 'utf8');
  const locs = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
  assert.equal(locs.length, EXPECTED_URLS, locs.join('\n'));
  assert.equal(new Set(locs).size, EXPECTED_URLS, 'URLs duplicadas');
  assert.ok(locs.every((u) => u.startsWith(`${SITE}/`)));
  assert.ok(!locs.some((u) => u.includes('/diagnosis/thanks/')));
  assert.ok(locs.includes(`${SITE}/portfolio/`));
  assert.ok(locs.includes(`${SITE}/privacy/`));
  assert.equal((xml.match(/hreflang="x-default"/g) || []).length, 3);
});

test('robots aponta pro sitemap e obrigado é noindex', () => {
  const robots = readFileSync('dist/robots.txt', 'utf8');
  assert.match(robots, /User-agent: \*/);
  assert.match(robots, /Allow: \//);
  assert.ok(robots.includes(`Sitemap: ${SITE}/sitemap.xml`));
  const thanks = readFileSync('dist/diagnosis/thanks/index.html', 'utf8');
  assert.ok(thanks.includes('<meta name="robots" content="noindex,nofollow">'));
});

test('toda página gerada tem og:image existente e JSON-LD válido', () => {
  assert.ok(generatedPages.length >= 28, `${generatedPages.length} páginas`);
  for (const file of generatedPages) {
    const html = readFileSync(file, 'utf8');
    const og = html.match(/<meta property="og:image" content="([^"]+)">/);
    assert.ok(og, `${file} sem og:image`);
    const path = og[1].replace(SITE, '');
    assert.ok(existsSync(join('dist', path)), `${file}: ${path} não existe`);
    assert.ok(html.includes('<meta name="robots" content="index,follow">'), `${file} não indexável`);
    for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      assert.doesNotThrow(() => JSON.parse(m[1]), `${file}: JSON-LD inválido`);
    }
  }
});

test('privacy nomeia o controlador e reserva o número da empresa', () => {
  const html = readFileSync('dist/privacy/index.html', 'utf8');
  assert.ok(html.includes('UP Marketing Ads'));
  assert.ok(html.includes('Company number: —'));
  assert.ok(html.includes('ico.org.uk'));
  assert.ok(!/instagram|linkedin/i.test(html));
});
