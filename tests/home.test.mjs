import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

execSync('npm run build', { stdio: 'pipe' });
const en = readFileSync('dist/index.html', 'utf8');
const pt = readFileSync('dist/pt/index.html', 'utf8');
const fr = readFileSync('dist/fr/index.html', 'utf8');

test('home EN tem headline, 6 serviços linkados e seções', () => {
  assert.match(en, /It(&#39;|')s being sold wrong\./);
  assert.equal((en.match(/class="service-card reveal"/g) || []).length, 6);
  assert.match(en, /href="\/services\/ai-automation\/"/);
  for (const id of ['services', 'method', 'funnel', 'work', 'founder', 'faq', 'contact']) {
    assert.match(en, new RegExp(`id="${id}"`), `seção ${id}`);
  }
});

test('home PT e FR traduzidas, com lang e hreflang', () => {
  assert.match(pt, /<html lang="pt">/);
  assert.match(pt, /Ele está sendo vendido errado\./);
  assert.match(pt, /hreflang="en" href="https:\/\/upmarketingads\.com\/"/);
  assert.doesNotMatch(pt, /href="\/services\/ai-automation\/"/, 'cards PT não linkam');
  assert.match(fr, /<html lang="fr">/);
  assert.match(fr, /Il est mal vendu\./);
});

test('nav e footer seguem o idioma', () => {
  assert.match(pt, /Pedir diagnóstico/);
  assert.match(fr, /Demander un diagnostic/);
  assert.match(pt, /Privacidade/);
});
