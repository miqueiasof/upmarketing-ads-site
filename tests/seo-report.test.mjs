import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { matchesKeyword, summarise, diff, opportunities, renderMarkdown, renderHtml } from '../scripts/seo/lib.mjs';

const fixture = JSON.parse(readFileSync('tests/fixtures/gsc-sample.json', 'utf8'));
const targets = JSON.parse(readFileSync('scripts/seo/targets.json', 'utf8'));

test('palavra-chave casa com a busca em qualquer ordem, sem acento nem maiúscula', () => {
  assert.ok(matchesKeyword('SEO agency in London', 'seo agency london'));
  assert.ok(matchesKeyword('london seo agency', 'seo agency london'));
  assert.ok(matchesKeyword('agencia de marketing digital em londres', 'agência de marketing digital londres'));
  assert.ok(!matchesKeyword('seo agency manchester', 'seo agency london'));
});

test('todas as 29 páginas do sitemap têm alvo e nenhuma rota repetida', () => {
  const sitemap = readFileSync('dist/sitemap.xml', 'utf8');
  const paths = [...sitemap.matchAll(/<loc>https:\/\/upmarketingads\.com(\/[^<]*)<\/loc>/g)].map((m) => m[1]);
  assert.equal(targets.length, 29);
  assert.deepEqual([...targets.map((t) => t.path)].sort(), [...paths].sort());
});

test('resumo soma por página e pondera a posição pelas impressões', () => {
  const summary = summarise(fixture.pageRows, fixture.queryRows, targets);
  const seo = summary.find((p) => p.path === '/services/seo-ai-search/');
  assert.equal(seo.impressions, 120);
  const kw = seo.keywords.find((k) => k.keyword === 'seo agency london');
  assert.equal(kw.impressions, 90);
  assert.equal(kw.position, 20.7);
  const croydon = summary.find((p) => p.path === '/london/croydon/');
  assert.equal(croydon.impressions, 0);
  assert.equal(croydon.position, null);
});

test('diferença semanal: posição menor = subiu', () => {
  const now = summarise(fixture.pageRows, fixture.queryRows, targets);
  const before = now.map((p) => (p.path === '/services/seo-ai-search/' ? { ...p, position: 30, impressions: 40 } : p));
  const changes = diff(before, now);
  assert.equal(changes['/services/seo-ai-search/'].positionDelta, 7.5);
  assert.equal(changes['/services/seo-ai-search/'].impressionsDelta, 80);
  assert.deepEqual(diff(null, now)['/'], null);
});

test('relatório em markdown e HTML traz páginas, alvos e buscas', () => {
  const summary = summarise(fixture.pageRows, fixture.queryRows, targets);
  const md = renderMarkdown({
    site: 'upmarketingads.com', period: { start: '2026-10-01', end: '2026-10-28' }, summary,
    changes: {}, inspections: { '/': { verdict: 'PASS' } }, ideas: opportunities(fixture.queryRows),
  });
  assert.match(md, /\| SEO & AI Search \| não verificado \| 120 \| 4 \| 22\.5 \|/);
  assert.match(md, /\| Home \(EN\) \| indexada \|/);
  assert.match(md, /\| seo agency london \| SEO & AI Search \| 90 \| 3 \| 20\.7 \|/);
  assert.match(md, /Croydon/);
  const html = renderHtml(md);
  assert.match(html, /<table/);
  assert.match(html, /<strong>.*impressões/);
});

test('CLI roda com dados de exemplo sem tocar na API', () => {
  const out = execFileSync('node', ['scripts/seo/gsc-report.mjs', '--fixture', 'tests/fixtures/gsc-sample.json'], { encoding: 'utf8' });
  assert.match(out, /# Ranking no Google — upmarketingads\.com/);
  assert.match(out, /Shoreditch/);
});
