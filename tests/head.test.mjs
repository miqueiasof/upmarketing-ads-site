import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

execSync('npm run build', { stdio: 'pipe' });
const html = readFileSync('dist/index.html', 'utf8');

test('canonical absoluto e hreflang recíproco na home EN', () => {
  assert.match(html, /<link rel="canonical" href="https:\/\/upmarketingads\.com\/">/);
  assert.match(html, /hreflang="x-default" href="https:\/\/upmarketingads\.com\/"/);
  assert.match(html, /hreflang="pt" href="https:\/\/upmarketingads\.com\/pt\/"/);
  assert.match(html, /hreflang="fr" href="https:\/\/upmarketingads\.com\/fr\/"/);
});

test('fontes self-hosted com preload, sem Google Fonts', () => {
  const preloads = html.match(/<link rel="preload"[^>]+\.woff2"[^>]*>/g) || [];
  assert.equal(preloads.length, 3);
  assert.doesNotMatch(html, /fonts\.googleapis\.com/);
});

test('header e footer sem redes sociais nem endereço', () => {
  assert.match(html, /href="\/diagnosis\/"/);
  assert.match(html, /wa\.me\/447547020024/);
  assert.doesNotMatch(html, /instagram|linkedin/i);
});
