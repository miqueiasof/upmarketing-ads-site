import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';

execSync('npm run build', { stdio: 'pipe' });
const areas = JSON.parse(readFileSync('src/_data/areas.json', 'utf8'));

const mainText = (html) => html.match(/<main[^>]*>([\s\S]*?)<\/main>/)[1]
  .replace(/<script[\s\S]*?<\/script>/g, '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const shingles = (text, n = 5) => {
  const w = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);
  const set = new Set();
  for (let i = 0; i + n <= w.length; i++) set.add(w.slice(i, i + n).join(' '));
  return set;
};
const jaccard = (a, b) => {
  let inter = 0;
  for (const s of a) if (b.has(s)) inter++;
  return inter / (a.size + b.size - inter);
};

const pages = {};
for (const a of areas) {
  const path = `dist/london/${a.slug}/index.html`;
  assert.ok(existsSync(path), path);
  pages[a.slug] = readFileSync(path, 'utf8');
}

test('15 páginas de região, cada uma com ≥600 palavras e schema sem address', () => {
  assert.equal(areas.length, 15);
  for (const a of areas) {
    const html = pages[a.slug];
    const words = mainText(html).split(' ').length;
    assert.ok(words >= 600, `${a.slug}: ${words} palavras`);
    assert.ok(html.includes(`<h1>${a.h1.replace(/&/g, '&amp;')}</h1>`), `h1 ${a.slug}`);
    const ld = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1];
    assert.ok(!ld.includes('"address"'), `${a.slug} não pode ter address`);
    assert.ok(ld.includes(`"${a.name}, London"`));
    assert.equal((html.match(/class="faq__item"/g) || []).length, 4);
  }
});

test('texto de cada região é próprio (Jaccard de 5-shingles < 0.35)', () => {
  const sets = Object.fromEntries(areas.map((a) => [a.slug, shingles(mainText(pages[a.slug]))]));
  for (let i = 0; i < areas.length; i++) {
    for (let j = i + 1; j < areas.length; j++) {
      const sim = jaccard(sets[areas[i].slug], sets[areas[j].slug]);
      assert.ok(sim < 0.35, `${areas[i].slug} × ${areas[j].slug}: ${sim.toFixed(2)}`);
    }
  }
});

test('hub /london/ tem 15 links de região e o mapa', () => {
  const html = readFileSync('dist/london/index.html', 'utf8');
  const links = new Set(html.match(/href="\/london\/[a-z-]+\/"/g) || []);
  assert.equal(links.size, 15);
  assert.match(html, /<svg class="london-map"/);
  assert.equal((html.match(/<circle /g) || []).length, 15);
});
