// Renders 1200×630 Open Graph images into src/assets/img/og/ with Playwright. Run: npm run og
import { chromium } from 'playwright';
import { readFileSync, mkdirSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'src/assets/img/og');
const FONTS_URL = pathToFileURL(join(ROOT, 'src/assets/fonts/')).href;
const JPEG_QUALITY = 88;

const readJson = (rel) => JSON.parse(readFileSync(join(ROOT, rel), 'utf8'));
const services = readJson('src/_data/services.json');
const areas = readJson('src/_data/areas.json');
const template = readFileSync(join(ROOT, 'src/_includes/og-template.njk'), 'utf8');

const SERVICE_LIST = 'Websites · SEO & AI search · Content · Video · AI automation · Ads';

const cards = [
  { slug: 'default', kicker: 'London · EN · PT · FR', title: 'One sales system for your business.', sub: SERVICE_LIST },
  { slug: 'home-pt', kicker: 'Londres · Português', title: 'Um sistema de vendas para o seu negócio.', sub: 'Site · SEO e busca por IA · Conteúdo · Vídeo · Automação com IA · Anúncios' },
  { slug: 'home-fr', kicker: 'Londres · Français', title: 'Un seul système de vente pour votre entreprise.', sub: 'Site · SEO et recherche IA · Contenu · Vidéo · Automatisation IA · Publicité' },
  { slug: 'services', kicker: 'Services', title: 'Six services. One sales system.', sub: SERVICE_LIST },
  { slug: 'diagnosis', kicker: 'Free diagnosis', title: 'Where are your sales leaking?', sub: 'Three short steps. A written diagnosis within 24 hours. No automated sales sequence.' },
  { slug: 'london', kicker: 'London', title: 'Sales systems for London businesses, area by area.', sub: 'Fifteen areas, each with its own page — from Westminster to Croydon.' },
  { slug: 'privacy', kicker: 'Privacy', title: 'How we handle your information.', sub: 'What we collect through the diagnosis and WhatsApp, why, where it is kept and your rights under UK GDPR.' },
  ...services.map((s) => ({ slug: s.slug, kicker: s.kicker, title: s.h1, sub: s.description })),
  ...areas.map((a) => ({ slug: `london-${a.slug}`, kicker: a.borough, title: a.h1, sub: a.description })),
];

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const titleSize = (title) => (title.length <= 36 ? 76 : title.length <= 60 ? 62 : 52);

const render = (card) => template
  .replaceAll('{{fonts}}', FONTS_URL)
  .replace('{{titleSize}}', String(titleSize(card.title)))
  .replace('{{kicker}}', esc(card.kicker))
  .replace('{{title}}', esc(card.title))
  .replace('{{sub}}', esc(card.sub));

const main = async () => {
  mkdirSync(OUT_DIR, { recursive: true });
  const tmp = mkdtempSync(join(tmpdir(), 'og-'));
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  try {
    for (const card of cards) {
      const htmlPath = join(tmp, `${card.slug}.html`);
      writeFileSync(htmlPath, render(card));
      await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: join(OUT_DIR, `${card.slug}.jpg`), type: 'jpeg', quality: JPEG_QUALITY });
      console.log(`og: ${card.slug}.jpg`);
    }
  } finally {
    await browser.close();
    rmSync(tmp, { recursive: true, force: true });
  }
  console.log(`${cards.length} images in ${OUT_DIR}`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
