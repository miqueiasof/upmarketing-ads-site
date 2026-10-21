import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';

execSync('npm run build', { stdio: 'pipe' });

const H1 = {
  'seo-ai-search': 'SEO &amp; AI Search agency in London',
  websites: 'Websites &amp; landing pages that sell — London',
  'social-media-content': 'Social media management &amp; content creation, London',
  'video-editing': 'Video editing &amp; short-form video for brands in London',
  'ai-automation': 'AI automation &amp; AI agents for London businesses',
  'paid-ads': 'Google &amp; Meta ads management, London',
};

const words = (html) => {
  const main = html.match(/<main[^>]*>([\s\S]*?)<\/main>/)[1];
  return main.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
};

for (const [slug, h1] of Object.entries(H1)) {
  test(`serviço ${slug}: h1, ≥500 palavras, 5 FAQ, schema Service`, () => {
    const path = `dist/services/${slug}/index.html`;
    assert.ok(existsSync(path), path);
    const html = readFileSync(path, 'utf8');
    assert.ok(html.includes(`<h1>${h1}</h1>`), `h1 de ${slug}`);
    assert.ok(words(html) >= 500, `${slug} tem ${words(html)} palavras`);
    assert.equal((html.match(/class="faq__item"/g) || []).length, 5);
    const ld = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1];
    const graph = JSON.parse(ld)['@graph'];
    assert.ok(graph.some((n) => n['@type'] === 'Service'));
    assert.equal(graph.find((n) => n['@type'] === 'FAQPage').mainEntity.length, 5);
    assert.ok(html.includes(`<link rel="canonical" href="https://upmarketingads.com/services/${slug}/">`));
  });
}

test('índice de serviços lista os 6', () => {
  const html = readFileSync('dist/services/index.html', 'utf8');
  const links = new Set((html.match(/href="\/services\/[a-z-]+\/"/g) || []));
  assert.equal(links.size, 6);
});
