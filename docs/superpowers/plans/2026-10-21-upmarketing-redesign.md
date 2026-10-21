# UP Marketing Ads — Redesign + SEO Londres + Diagnóstico — Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Nesta casa o implementador de cada tarefa é o **Codex** (`/codex:rescue --model gpt-5.5`), e o Claude verifica no browser antes de liberar a próxima.

**Goal:** Substituir o site atual por um site estático em inglês (com `/pt/` e `/fr/`), com hero animado "sistema se montando", 6 páginas de serviço, 15 páginas de região de Londres, formulário de diagnóstico com score A/B/C ligado ao n8n, e deploy no container nginx existente sem quebrar `/portfolio/` nem os previews do Traefik.

**Architecture:** Eleventy 3 (Nunjucks) gera `dist/` a partir de `src/`; dados em JSON (`services`, `areas`, `i18n`) alimentam templates paginados. Motion em camada separada (`motion.js`, GSAP + Lenis locais) que respeita `prefers-reduced-motion` e degrada sem JS. Formulário é um componente Nunjucks + `diagnosis.js` que usa `score.js` (puro, testável) e envia ao webhook n8n existente com retry e fallback WhatsApp. Deploy = `npm run build` + `rsync dist/` para a VPS.

**Tech Stack:** Node ≥ 22, @11ty/eleventy ^3, Nunjucks, GSAP 3.13+ (ScrollTrigger, DrawSVGPlugin), Lenis, Playwright (e2e), `node:test` (unit), rsync/ssh, n8n REST API, Resend.

**Spec:** `docs/superpowers/specs/2026-10-21-upmarketing-redesign-design.md`

## Global Constraints

- Tokens de marca: fundo `#0A1428`, deep `#060D1C`, panel `#0D1830`, texto `#EEF2F8`, muted `#7C8BA3`, linha `rgba(238,242,248,0.12)`, acento `#3DE8C8` (CTA, destaques e nós ativos do diagrama — nunca em áreas grandes). Fontes: Instrument Serif (display), Space Grotesk (texto), IBM Plex Mono (rótulos), **self-hosted**, `font-display: swap`.
- URLs finais (29 no sitemap): `/`, `/pt/`, `/fr/`, `/services/`, `/services/{seo-ai-search,websites,social-media-content,video-editing,ai-automation,paid-ads}/`, `/london/`, `/london/{westminster,city-of-london,canary-wharf,shoreditch,mayfair-soho,camden,kensington-chelsea,islington,hackney,southwark,greenwich,stratford,richmond,wimbledon,croydon}/`, `/diagnosis/`, `/portfolio/`, `/privacy/`. `/diagnosis/thanks/` existe mas é `noindex`.
- Idiomas: EN em `/`, PT em `/pt/`, FR em `/fr/`; `hreflang` `en`, `pt`, `fr`, `x-default`=EN, recíproco nas 3 homes. Serviços/regiões/privacy só EN.
- Motion: nada fica invisível sem JS ou com `prefers-reduced-motion: reduce`. Nível `lite` quando `navigator.hardwareConcurrency <= 4` ou `(pointer: coarse)`. Sem barra fixa de CTA no mobile.
- Webhook: `POST https://n8n.moneygirls.com.br/webhook/upmarketing-form` (workflow `VjfgeaF1iALztPMF`). WhatsApp `447547020024`. E-mail destino `up.marketing.ads@gmail.com`, remetente `UP Marketing Ads <site@mgintelligence.tools>`.
- Score: `revenue` Pre-revenue 0 · <£2k 1 · £2–10k 2 · £10–50k 3 · £50–200k 4 · >£200k 5; `budget` <£500 0 · £500–1.5k 1 · Not sure yet 1 · £1.5–5k 3 · £5k+ 4; `timeline` Exploring 0 · Next 1–3 months 2 · This month 3; `pain_duration` <3 months 0 · 3–12 months 1 · 1–3 years 2 · Since I started 2. A ≥ 10, B 6–9, C ≤ 5.
- Nada de endereço em Londres, nada de Instagram/LinkedIn, nada de nome/domínio de cliente. Método em EN = "sales system".
- Deploy só toca `/docker/upmarketing/site/`; `/portfolio/` continua servido; `/preview-ginagaya/` e `/preview-lainedoll/` continuam respondendo (Traefik).
- Commits: conventional commits em inglês, terminando com `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.

## Review Focus

1. Usuário com `prefers-reduced-motion: reduce` ou sem JS: todo texto e CTA do hero visível na primeira pintura (teste na Tarefa 4).
2. Webhook fora do ar: o lead vê o botão WhatsApp com os dados já no texto e o formulário não "sucede" em silêncio (teste na Tarefa 6).
3. Payload antigo (`name/email/whats/goal/revenue/msg`) ainda chega enquanto o site novo não está no ar: n8n continua mandando e-mail sem erro (teste na Tarefa 7).
4. `rsync --delete` em `dist/` não pode apagar `/portfolio/` nem suas imagens (teste na Tarefa 1 e verificação na Tarefa 12).
5. Página de região com menos de 600 palavras ou texto igual ao de outra região = doorway page; teste de unicidade na Tarefa 9.

---

### Task 1: Scaffold Eleventy + passthrough do portfólio + deploy script

**Files:**
- Create: `package.json`, `eleventy.config.js`, `.gitignore`, `src/index.njk` (placeholder), `scripts/deploy.sh`, `tests/build.test.mjs`
- Modify: `README.md` (substituir seção de deploy)
- Move: `index.html` → `legacy/index.html` (referência, fora do build)

**Interfaces:**
- Produces: `npm run build` → `dist/`; `npm run dev` → `http://localhost:8080`; `npm test` → `node --test tests/`; `bash scripts/deploy.sh` → rsync para VPS.
- `eleventy.config.js` exporta config com `dir: { input: "src", output: "dist", includes: "_includes", data: "_data" }`, `addPassthroughCopy({ "portfolio": "portfolio", "src/assets": "assets" })`.

- [ ] **Step 1: Escrever o teste de build**

```js
// tests/build.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { execSync } from 'node:child_process';

test('build produz dist com home e portfólio preservado', () => {
  execSync('npm run build', { stdio: 'pipe' });
  assert.ok(existsSync('dist/index.html'));
  assert.ok(existsSync('dist/portfolio/index.html'));
  assert.ok(existsSync('dist/portfolio/img/m01-desktop.jpg'));
});
```

- [ ] **Step 2: Rodar e ver falhar** — `npm test` → FAIL (sem package.json / build).
- [ ] **Step 3: Criar `package.json`** com scripts `build: "eleventy"`, `dev: "eleventy --serve"`, `test: "node --test tests/"`, devDependencies `@11ty/eleventy@^3`, `playwright@^1.63`. `.gitignore`: `node_modules/`, `dist/`, `.playwright/`.
- [ ] **Step 4: Criar `eleventy.config.js`** (ESM) com dirs e passthrough acima; `src/index.njk` com `<!doctype html><title>UP</title>`.
- [ ] **Step 5: Mover `index.html` para `legacy/`** e ignorar `legacy/` no Eleventy (`eleventyConfig.ignores.add("legacy/**")`).
- [ ] **Step 6: Criar `scripts/deploy.sh`**: `set -euo pipefail; npm run build; rsync -az --delete dist/ root@76.13.253.56:/docker/upmarketing/site/`. Comentário no topo: `/portfolio` vem do passthrough, por isso `--delete` é seguro.
- [ ] **Step 7: Rodar `npm test`** → PASS.
- [ ] **Step 8: Commit** — `chore: scaffold eleventy build, keep portfolio passthrough, add deploy script`

---

### Task 2: Tokens, fontes self-hosted, layout base e head de SEO

**Files:**
- Create: `src/assets/css/tokens.css`, `src/assets/css/base.css`, `src/assets/css/layout.css`, `src/assets/css/components.css`, `src/assets/fonts/*.woff2` (Instrument Serif 400/400i, Space Grotesk 300/400/500, IBM Plex Mono 400/500 — latin + latin-ext), `src/_includes/layouts/base.njk`, `src/_includes/partials/head.njk`, `src/_includes/partials/header.njk`, `src/_includes/partials/footer.njk`, `src/_data/site.json`, `tests/head.test.mjs`
- Modify: `eleventy.config.js` (filtros `absoluteUrl`, `jsonld`)

**Interfaces:**
- `site.json`: `{ "name": "UP Marketing Ads", "url": "https://upmarketingads.com", "whatsapp": "447547020024", "whatsappDisplay": "+44 7547 020024", "webhook": "https://n8n.moneygirls.com.br/webhook/upmarketing-form", "accent": "#3DE8C8", "email": "" }`
- Front matter que todo layout consome: `title`, `description`, `lang` (`en|pt|fr`), `canonical` (path), `noindex` (bool), `alternates` (`{en:'/',pt:'/pt/',fr:'/fr/'}` só nas homes), `jsonld` (objeto), `ogImage` (path).
- `head.njk` emite: title, description, canonical absoluto, OG/Twitter, hreflang quando `alternates`, `robots noindex` quando `noindex`, favicon, preload das 3 fontes, `<script type="application/ld+json">` quando `jsonld`.
- `header.njk`: logo "UP Marketing Ads" (link `/`), nav `Services · London · Portfolio · Diagnosis`, CTA `Get your diagnosis` → `/diagnosis/`; menu hambúrguer < 900px. Sem barra fixa.
- `footer.njk`: WhatsApp (`https://wa.me/447547020024`), link `/privacy/`, seletor de idioma só quando `alternates`. Sem redes sociais. E-mail só se `site.email` não for vazio (preenchido na Tarefa 11).

- [ ] **Step 1: Teste do head** — `tests/head.test.mjs` builda e lê `dist/index.html`; asserts: `<link rel="canonical" href="https://upmarketingads.com/">`, `hreflang="x-default"`, `hreflang="pt" href="https://upmarketingads.com/pt/"`, `rel="preload"` para `.woff2` ×3, ausência de `fonts.googleapis.com`.
- [ ] **Step 2: Rodar** → FAIL.
- [ ] **Step 3: Baixar as fontes** (Google Fonts, licença OFL) para `src/assets/fonts/` e declarar `@font-face` em `tokens.css` com `font-display: swap`.
- [ ] **Step 4: Escrever `tokens.css`** (variáveis da seção Global Constraints + escala tipográfica: display `clamp(2.6rem,7vw,6rem)`, h2 `clamp(1.8rem,3.6vw,3.2rem)`, mono 11px/0.2em), `base.css` (reset, body, links, foco visível `outline: 2px solid var(--accent)`), `layout.css` (container 1200px, gutter `clamp(24px,6vw,96px)`, grid 12), `components.css` (botão primário acento/texto `#0A1428`, botão ghost, tag mono, card `#0D1830` borda `--line` raio 10px).
- [ ] **Step 5: Escrever `base.njk`, `head.njk`, `header.njk`, `footer.njk`** conforme Interfaces; `src/index.njk` passa a usar `layout: layouts/base.njk` com `alternates`.
- [ ] **Step 6: Rodar `npm test`** → PASS. Abrir `npm run dev` e conferir header/footer em 375px e 1440px.
- [ ] **Step 7: Commit** — `feat: design tokens, self-hosted fonts, base layout and SEO head`

---

### Task 3: Home trilíngue (conteúdo estático, sem motion)

**Files:**
- Create: `src/_data/i18n/en.json`, `src/_data/i18n/pt.json`, `src/_data/i18n/fr.json`, `src/_includes/layouts/home.njk`, `src/_includes/partials/{hero,proof,services-grid,method,funnel,portfolio-strip,founder,faq,cta}.njk`, `src/pt/index.njk`, `src/fr/index.njk`, `tests/home.test.mjs`
- Modify: `src/index.njk`

**Interfaces:**
- `i18n/{lang}.json` tem as chaves: `hero.kicker`, `hero.h1a`, `hero.h1b` (parte em itálico/acento), `hero.sub`, `hero.cta`, `proof.items[]` (3 strings), `services[]` (6 × `{slug,name,blurb,ai}`), `method.kicker`, `method.steps[]` (5), `funnel.before/after`, `founder.{name,lines[]}`, `faq[]` (6 × `{q,a}`), `cta.{h2,button}`.
- EN hero: `h1a` "Your product isn't selling little." · `h1b` "It's being sold wrong." · `sub` "Websites, content, video, AI automation and ads — built as one sales system. London." · `cta` "Get your free diagnosis".
- PT/FR: tradução fiel (PT mantém "engenharia de vendas online" no `method.kicker`; FR "ingénierie de vente en ligne").
- `home.njk` monta as partials na ordem: hero → proof → services-grid → method → funnel → portfolio-strip → founder → faq → cta. `services-grid` linka cada card para `/services/{slug}/` (EN) — em PT/FR os cards não linkam, só mostram.
- `proof.items` EN: "4 sales systems live", "Operating in 9 countries", "AI agents answering WhatsApp 24/7". Sem números de faturamento.
- `founder.njk` usa `src/assets/img/founder.jpg` (placeholder cinza 800×1000 até a foto definitiva) + `founder.lines`.

- [ ] **Step 1: Teste** — `tests/home.test.mjs`: `dist/index.html` contém `It's being sold wrong.`, 6 ocorrências de `class="service-card"`, link `/services/ai-automation/`; `dist/pt/index.html` tem `lang="pt"` e `hreflang="en"`; `dist/fr/index.html` tem `lang="fr"`.
- [ ] **Step 2: Rodar** → FAIL.
- [ ] **Step 3: Escrever os 3 JSON de i18n** (EN primeiro, PT/FR traduzidos). Copy das 6 blurbs em EN: uma frase de benefício + uma frase "AI:" em cada.
- [ ] **Step 4: Escrever `home.njk` e as 9 partials** (HTML semântico, classes BEM curtas, `class="reveal"` nos blocos que vão animar depois). Hero: coluna de texto + `<div class="hero-diagram">` vazio (preenchido na Tarefa 4). Mobile: hero **sem** `min-height: 100svh`; texto na primeira dobra.
- [ ] **Step 5: `src/pt/index.njk` e `src/fr/index.njk`** com `lang`, `permalink`, `alternates`.
- [ ] **Step 6: Rodar `npm test`** → PASS. Checar no dev server a 375px: headline visível sem rolar.
- [ ] **Step 7: Commit** — `feat: trilingual home with services, method, funnel, founder and FAQ sections`

---

### Task 4: Hero "sistema se montando" + camada de motion

**Files:**
- Create: `src/assets/vendor/{gsap.min.js,ScrollTrigger.min.js,DrawSVGPlugin.min.js,lenis.min.js}`, `src/assets/js/motion.js`, `src/assets/js/hero-diagram.js`, `src/assets/css/motion.css`, `src/_includes/partials/hero-diagram.svg.njk`, `tests/e2e/motion.spec.mjs`, `playwright.config.mjs`
- Modify: `src/_includes/partials/hero.njk`, `src/_includes/layouts/base.njk` (scripts `defer` no fim)

**Interfaces:**
- `hero-diagram.svg.njk`: SVG inline `viewBox="0 0 640 480"` com 6 nós `<g class="node" data-node="{slug}">` (círculo r=34 + rótulo mono) dispostos em anel, 9 `<path class="edge">` ligando-os, um nó central `<g class="node node--core">` com texto "SALES SYSTEM". Abaixo de 900px o mesmo SVG é renderizado com `viewBox="0 0 360 720"` (nós em coluna) via segunda `<svg>` com `<use>` dos mesmos `<symbol>`s.
- `motion.js`: `initMotion({ level })` — `level` ∈ `full|lite|off`. Decide: `off` se `matchMedia('(prefers-reduced-motion: reduce)')`; `lite` se `pointer: coarse` ou `hardwareConcurrency <= 4`; senão `full`. Seta `document.documentElement.dataset.motion = level`. `full`: Lenis + reveals ScrollTrigger + botões magnéticos + marquee + contadores; `lite`: só reveals e contadores; `off`: nada (CSS mostra tudo).
- `hero-diagram.js`: `playHeroDiagram(svg)` — DrawSVG das edges 0→100% em 1.2s stagger 0.08, nós aparecem com scale 0.6→1, pulso infinito leve nas edges (`strokeDashoffset`) só em `full`. Em `lite`/`off`: nós e edges já visíveis.
- CSS: `.reveal { opacity: 1 }` por padrão; só `html[data-motion="full"] .reveal, html[data-motion="lite"] .reveal { opacity: 0; transform: translateY(24px) }` antes de animar — **sem JS nada some**.

- [ ] **Step 1: Teste e2e** — `tests/e2e/motion.spec.mjs` (Playwright, `webServer: npm run dev`, baseURL `http://localhost:8080`):
  - `reduced motion mostra tudo`: contexto `reducedMotion: 'reduce'`, abre `/`, espera 300ms, `expect(h1).toBeVisible()`, `expect(primeiro .service-card).toHaveCSS('opacity','1')`, `html[data-motion="off"]`.
  - `sem JS mostra tudo`: contexto `javaScriptEnabled: false`, h1 e `.hero-diagram svg` visíveis.
  - `mobile hero na primeira dobra`: viewport 375×812, `boundingBox` do h1 tem `y + height < 812`.
  - `full anima o diagrama`: desktop, após 2s todas `.edge` têm `stroke-dashoffset` igual a 0 (via `getComputedStyle`).
- [ ] **Step 2: Rodar `npx playwright test`** → FAIL.
- [ ] **Step 3: Verificar versão/licença do GSAP** — `npm view gsap version` ≥ 3.13 (plugins livres desde 3.13); instalar `gsap` e `lenis` como devDependencies e copiar os `dist/*.min.js` para `src/assets/vendor/`.
- [ ] **Step 4: Escrever o SVG do diagrama** e incluir no hero; rótulos dos 6 serviços vêm de `i18n[lang].services[].name` (curtos: "SEO & AI Search", "Websites", "Social & Content", "Video", "AI Automation", "Paid Ads").
- [ ] **Step 5: Escrever `motion.js` e `hero-diagram.js`** conforme Interfaces; `motion.css` com os estados.
- [ ] **Step 6: Rodar e2e** → PASS. Checar manualmente no dev server: desktop 1440 (diagrama desenha, scroll suave), 375 (coluna, sem área vazia), DevTools "Emulate prefers-reduced-motion".
- [ ] **Step 7: Commit** — `feat: animated sales-system hero diagram and motion layer with reduced-motion fallback`

---

### Task 5: Módulo de score do diagnóstico

**Files:**
- Create: `src/assets/js/score.js`, `tests/score.test.mjs`

**Interfaces:**
- `export const SCORE = { revenue: {...}, budget: {...}, timeline: {...}, pain_duration: {...} }` com os valores exatos de Global Constraints (chaves = `value` dos inputs: `pre`, `lt2k`, `2-10k`, `10-50k`, `50-200k`, `gt200k`; `lt500`, `500-1500`, `unsure`, `1500-5000`, `gt5000`; `exploring`, `1-3m`, `now`; `lt3m`, `3-12m`, `1-3y`, `since-start`).
- `export function computeScore(answers) → { points: number, priority: 'A'|'B'|'C' }`; chave ausente ou inválida conta 0.

- [ ] **Step 1: Teste** — `tests/score.test.mjs`:
  - `A no máximo`: `{revenue:'gt200k',budget:'gt5000',timeline:'now',pain_duration:'1-3y'}` → `{points:14, priority:'A'}`
  - `limite A/B`: `{revenue:'10-50k',budget:'1500-5000',timeline:'1-3m',pain_duration:'3-12m'}` → 9 → `'B'`; mesmo objeto com `timeline:'now'` → 10 → `'A'`
  - `C`: `{revenue:'pre',budget:'unsure',timeline:'exploring',pain_duration:'lt3m'}` → `{points:1, priority:'C'}`
  - `inválido conta 0`: `{revenue:'xyz'}` → `{points:0, priority:'C'}`
- [ ] **Step 2: Rodar `npm test`** → FAIL (módulo inexistente).
- [ ] **Step 3: Implementar `score.js`** (ESM, sem dependências).
- [ ] **Step 4: Rodar** → PASS.
- [ ] **Step 5: Commit** — `feat: diagnosis lead score (A/B/C)`

---

### Task 6: Formulário de diagnóstico (3 passos) + obrigado por prioridade

**Files:**
- Create: `src/_includes/partials/diagnosis-form.njk`, `src/assets/js/diagnosis.js`, `src/assets/js/thanks.js`, `src/assets/css/form.css`, `src/diagnosis/index.njk`, `src/diagnosis/thanks.njk`, `tests/e2e/diagnosis.spec.mjs`
- Modify: `src/_includes/partials/cta.njk` (home embute o formulário), `src/_data/i18n/*.json` (chave `form.*`)

**Interfaces:**
- Campos e `name`/`value` exatos: `business_type` (`local`, `course`, `ecommerce`, `professional`, `creator`, `other`), `website` (url opcional), `revenue`, `time_in_business` (`lt1y`,`1-3y`,`3-10y`,`gt10y`), `pain[]` (checkbox máx. 3: `leads`,`conversion`,`content-time`,`website`,`ads-cost`,`follow-up`,`not-found`,`other`), `pain_other` (texto ≤ 80), `pain_duration`, `tried[]` (`myself`,`freelancer`,`agency`,`course`,`changed-ads`,`nothing`), `tried_why` (textarea ≤ 300), `services[]` (os 6 slugs), `budget`, `timeline`, `name`, `email`, `whatsapp`, `consent` (checkbox obrigatório), honeypot `company_url` (hidden, deve ficar vazio), automáticos `lang`, `source_page`, `score`, `priority`.
- Opções de escolha única renderizam como **cards clicáveis** (`<label class="opt">` com `input[type=radio]` dentro), não `<select>`. Barra de progresso 3 segmentos; botões "Continue"/"Back"; passo 3 termina em "Send my diagnosis".
- `diagnosis.js`: valida por passo (campos obrigatórios do passo), monta payload `{...campos, score, priority, lang, source_page}`, `submit(payload)` = `fetch` POST JSON com até 3 tentativas (0 s, 1 s, 3 s); se todas falharem tenta `navigator.sendBeacon`; em qualquer caso grava `sessionStorage.diagnosis = JSON.stringify(payload)` e redireciona para `/diagnosis/thanks/?p={priority}`; se **tudo** falhou, adiciona `&sent=0`. Honeypot preenchido → não envia, redireciona igual.
- `thanks.njk` (`noindex`): lê `?p` e `sessionStorage.diagnosis`; três variantes por prioridade; quando `sent=0` mostra bloco "We couldn't reach our server — send it on WhatsApp" com o botão já carregando um resumo do payload. Botão WhatsApp sempre com `?text=` = `Hi, I'm {name}. I just filled the diagnosis on upmarketingads.com — main issue: {pain joined}.`
  - A: h1 "We've got it, {name}." · p "{pain} for {pain_duration} is costing you every week. You'll get your diagnosis within 24 hours — or skip the queue:" · CTA WhatsApp grande.
  - B: h1 idem · p "Here's something useful while we prepare your diagnosis:" + 1 link para `/services/{serviço mais ligado à dor}/` · WhatsApp.
  - C: h1 "Thanks, {name}." · p "No rush. Two things worth reading:" + links `/services/seo-ai-search/` e `/portfolio/` · "Message us when the timing is right."
- Mapeamento dor → serviço (B): `leads`→`paid-ads`, `conversion`→`websites`, `content-time`→`social-media-content`, `website`→`websites`, `ads-cost`→`paid-ads`, `follow-up`→`ai-automation`, `not-found`→`seo-ai-search`, `other`→`websites`.

- [ ] **Step 1: Teste e2e** — `tests/e2e/diagnosis.spec.mjs`:
  - `fluxo A completo`: intercepta `**/webhook/upmarketing-form` (route.fulfill 200) e captura o body; preenche A (revenue `gt200k`, budget `gt5000`, timeline `now`, pain_duration `1-3y`, pain `leads`+`follow-up`, tried `agency`, tried_why "Slow and generic", name "Test"), envia; assert body tem `priority:'A'`, `score:14`, `tried_why`, `lang:'en'`; URL final `/diagnosis/thanks/?p=A`; página tem "We've got it, Test." e link `wa.me/447547020024`.
  - `validação por passo`: clicar Continue sem preencher → erro visível e permanece no passo 1.
  - `webhook caído`: route.abort() nas 3 tentativas; URL final contém `sent=0`; texto "We couldn't reach our server" e botão WhatsApp com `text=` contendo "Test".
  - `honeypot`: preencher `company_url` → nenhum request ao webhook, redireciona igual.
- [ ] **Step 2: Rodar** → FAIL.
- [ ] **Step 3: Escrever `diagnosis-form.njk`** (3 `<fieldset data-step>`), `form.css` (cards de opção, selecionado com borda acento, erros em linha, mobile-first), strings em `i18n.form.*` (EN/PT/FR).
- [ ] **Step 4: Escrever `diagnosis.js`** importando `computeScore` de `score.js`; `thanks.js` com as 3 variantes.
- [ ] **Step 5: Páginas `/diagnosis/` e `/diagnosis/thanks/`** (thanks com `noindex: true`); `cta.njk` da home inclui `diagnosis-form.njk`.
- [ ] **Step 6: Rodar e2e** → PASS. Testar no celular real (dev server pela rede) o passo 2 com 3 dores.
- [ ] **Step 7: Commit** — `feat: 3-step diagnosis form with lead score, retry/beacon fallback and priority-based thank-you`

---

### Task 7: n8n — payload novo com prioridade e contra-objeção (compatível com o antigo)

**Files:**
- Create: `scripts/n8n/workflow.json` (export do workflow atualizado, chave Resend substituída por `{{RESEND_API_KEY}}`), `scripts/n8n/update-workflow.sh`, `scripts/n8n/test-payloads.sh`

**Interfaces:**
- `update-workflow.sh`: injeta `RESEND_API_KEY` de `~/.claude/settings.json` no JSON, copia para a VPS, e via `ssh root@76.13.253.56` lê `N8N_API_KEY` de `/docker/n8n/.env`, resolve o IP do container `n8n` e faz `PUT /api/v1/workflows/VjfgeaF1iALztPMF`; depois `POST .../activate`.
- E-mail (nó "Resend Email", `jsonBody` em expressão JS): assunto `🚀 [{{priority||'—'}}] New lead — {{name}}`; corpo HTML com 3 blocos: **Lead** (name, email, whatsapp, business_type, website, revenue, time_in_business, services, budget, timeline, lang, source_page), **Contra-objeção** (pain + pain_other, pain_duration, tried, tried_why — "not provided" quando ausente), **Legacy** (goal, msg, whats — só se existirem). `reply_to` = email do lead. Arrays viram lista separada por " · ". Nó Webhook inalterado (`allowedOrigins: "*"`, `responseMode: onReceived`).
- `test-payloads.sh`: envia (1) payload antigo `{name,email,whats,goal,revenue,msg,lang}` e (2) payload novo completo com `priority:"A"`; imprime status HTTP e consulta `GET /api/v1/executions?workflowId=...&limit=2` esperando `status: success` e `resend_id` nos dois.

- [ ] **Step 1: Escrever `test-payloads.sh`** e rodar contra o workflow atual → ambos 200, mas o e-mail do payload novo sai sem `[A]` no assunto (comportamento a mudar).
- [ ] **Step 2: Exportar o workflow atual** (`GET /api/v1/workflows/VjfgeaF1iALztPMF`) para `scripts/n8n/workflow.json` e editar o `jsonBody` conforme Interfaces.
- [ ] **Step 3: Rodar `update-workflow.sh`** → HTTP 200 + `active: true`.
- [ ] **Step 4: Rodar `test-payloads.sh`** → 200/200, 2 execuções `success`, 2 `resend_id`; conferir na caixa `up.marketing.ads@gmail.com` um e-mail com `[A]` no assunto e bloco Contra-objeção.
- [ ] **Step 5: Commit** — `feat(n8n): priority + counter-objection email template, backwards-compatible payload`

---

### Task 8: Páginas de serviço (6, EN)

**Files:**
- Create: `src/_data/services.json`, `src/services/index.njk`, `src/services/service.njk` (paginação sobre `services`), `src/_includes/layouts/service.njk`, `tests/services.test.mjs`

**Interfaces:**
- `services.json[]`: `{ slug, name, h1, title, description, kicker, intro[] (2 parágrafos), includes[] (5–7), aiHow[] (3–4), forWho[] (3), examples[] (3 × {label, text} anônimos), faq[] (5 × {q,a}), related[] (2 slugs) }`.
- H1 por slug: `seo-ai-search` "SEO & AI Search agency in London" · `websites` "Websites & landing pages that sell — London" · `social-media-content` "Social media management & content creation, London" · `video-editing` "Video editing & short-form video for brands in London" · `ai-automation` "AI automation & AI agents for London businesses" · `paid-ads` "Google & Meta ads management, London".
- `service.njk` permalink `/services/{{ service.slug }}/`, `jsonld` = `Service` (`provider` = `ProfessionalService` sem `address`, `areaServed` "London") + `FAQPage`. CTA final → `/diagnosis/`.
- Textos: **Claude escreve** `services.json` (copy é do Claude no fluxo da casa), Codex integra. Mínimo 500 palavras por página, inglês britânico, sem nomear cliente.

- [ ] **Step 1: Teste** — `tests/services.test.mjs`: existem os 6 `dist/services/{slug}/index.html`; cada um tem `<h1>` igual ao H1 acima, ≥ 500 palavras no `<main>`, 5 `itemprop="acceptedAnswer"` (FAQ), JSON-LD com `"@type":"Service"`; `dist/services/index.html` tem 6 links.
- [ ] **Step 2: Rodar** → FAIL.
- [ ] **Step 3: Claude escreve `services.json`** (6 entradas completas).
- [ ] **Step 4: Codex escreve `service.njk`, `layouts/service.njk`, `services/index.njk`**.
- [ ] **Step 5: Rodar** → PASS. Miqueias revisa os textos (lista das 6 URLs no dev server).
- [ ] **Step 6: Commit** — `feat: six service pages with FAQ and Service schema`

---

### Task 9: Londres — hub + 15 páginas de região

**Files:**
- Create: `src/_data/areas.json`, `src/london/index.njk`, `src/london/area.njk` (paginação), `src/_includes/layouts/area.njk`, `src/_includes/partials/london-map.svg.njk`, `tests/areas.test.mjs`

**Interfaces:**
- `areas.json[]`: `{ slug, name, borough, h1: "Digital marketing & sales systems in {name}, London", title, description, profile[] (3 parágrafos: perfil de negócios, indústrias, tipo de cliente), scenarios[] (3 × {business, problem, whatWeDo}), topServices[] (3 slugs), faq[] (4), neighbours[] (2–3 slugs) }`.
- `area.njk` permalink `/london/{{ area.slug }}/`; `jsonld` = `ProfessionalService` com `areaServed: {"@type":"Place","name":"{name}, London"}` **sem `address`** + `BreadcrumbList` (Home › London › {name}).
- `london-map.svg.njk`: SVG simplificado do Grande Londres com 15 `<a href="/london/{slug}/">` sobre círculos posicionados (coordenadas aproximadas), hover acende em acento.
- Hub `/london/`: intro, mapa, grade dos 15 links, os 6 serviços, FAQ (4), CTA.

- [ ] **Step 1: Teste** — `tests/areas.test.mjs`: 15 páginas existem; cada `<main>` ≥ 600 palavras; similaridade entre quaisquer duas páginas (Jaccard de shingles de 5 palavras) < 0.35; JSON-LD sem `"address"`; `dist/london/index.html` tem 15 links e o SVG.
- [ ] **Step 2: Rodar** → FAIL.
- [ ] **Step 3: Claude escreve `areas.json`** — 15 entradas, cada uma com perfil real da região (indústrias, perfil de negócio, referências públicas quando citadas), cenários diferentes por região.
- [ ] **Step 4: Codex escreve templates, hub e mapa SVG**.
- [ ] **Step 5: Rodar** → PASS (inclusive o teste de similaridade). Miqueias revisa 3 páginas amostra.
- [ ] **Step 6: Commit** — `feat: London hub and 15 area pages with unique local content`

---

### Task 10: Privacidade, sitemap, robots, OG images e validação de schema

**Files:**
- Create: `src/privacy.njk`, `src/sitemap.njk` (permalink `/sitemap.xml`), `src/robots.njk` (permalink `/robots.txt`), `src/_includes/og-template.njk`, `scripts/og-images.mjs` (Playwright renderiza o template → `src/assets/img/og/{slug}.jpg` 1200×630), `tests/seo.test.mjs`

**Interfaces:**
- `privacy.njk`: controlador "UP Marketing Ads" (nome comercial), finalidade (responder ao diagnóstico), base legal (consentimento), processadores (n8n em servidor próprio na UE, Resend, WhatsApp/Meta), retenção 24 meses, direitos UK GDPR, contato via WhatsApp/e-mail, linha "Company number: —" até informado.
- `sitemap.njk`: lista `collections.all` exceto `noindex`; `robots.njk`: `User-agent: *`, `Allow: /`, `Sitemap: https://upmarketingads.com/sitemap.xml`.
- Toda página define `ogImage` (default `/assets/img/og/default.jpg`; serviços e regiões têm o seu). Script `npm run og` roda antes do build.

- [ ] **Step 1: Teste** — `tests/seo.test.mjs`: `dist/sitemap.xml` tem exatamente 29 `<loc>`; não contém `/diagnosis/thanks/`; `dist/diagnosis/thanks/index.html` tem `noindex`; todo HTML em `dist/**` (exceto thanks) tem `og:image` apontando para arquivo existente; JSON-LD de cada página faz `JSON.parse` sem erro.
- [ ] **Step 2: Rodar** → FAIL.
- [ ] **Step 3: Implementar páginas, sitemap, robots e `og-images.mjs`**.
- [ ] **Step 4: Rodar** → PASS. Validar 1 serviço e 1 região no Rich Results Test.
- [ ] **Step 5: Commit** — `feat: privacy page, sitemap, robots, OG images and schema validation`

---

### Task 11: `hello@upmarketingads.com` (encaminhamento) — executado pelo Claude com o Miqueias

**Files:**
- Modify: `src/_data/site.json` (`email: "hello@upmarketingads.com"` só após o Step 4)

- [ ] **Step 1: Conta no ImprovMX** (plano free) para `upmarketingads.com` → destino `up.marketing.ads@gmail.com`. **Miqueias cria a conta** (Claude não cria contas); Claude configura o alias no browser dele.
- [ ] **Step 2: Na zona DNS da HostGator** (painel já acessado antes): substituir `MX 0 upmarketingads.com` por `MX 10 mx1.improvmx.com` e `MX 20 mx2.improvmx.com`; adicionar `TXT "v=spf1 include:spf.improvmx.com ~all"`.
- [ ] **Step 3: Verificar** — `dig +short MX upmarketingads.com @8.8.8.8` mostra os dois `improvmx`.
- [ ] **Step 4: Teste real** — enviar e-mail de outra conta para `hello@` e confirmar chegada no Gmail. Só então preencher `site.email`.
- [ ] **Step 5: Commit** — `feat: show hello@ email in footer`

---

### Task 12: Foto do fundador, deploy e checklist de lançamento

**Files:**
- Modify: `src/assets/img/founder.jpg` (foto escolhida pelo Miqueias — original via `osxphotos export --uuid` ou arquivo enviado —, recorte 4:5, 1200px, ≤ 200 KB), `src/_data/i18n/*.json` (`founder.lines`), `README.md`
- Create: `tests/e2e/smoke-prod.spec.mjs`

**Interfaces:**
- `smoke-prod.spec.mjs` roda contra `https://upmarketingads.com`: as 29 URLs do sitemap respondem 200; `/portfolio/` tem 8 imagens 200; `/preview-ginagaya/` responde 401 (basic auth intacto); `/diagnosis/thanks/` tem `noindex`; Lighthouse mobile (`npx lighthouse --preset=mobile`) na home e em `/london/shoreditch/` ≥ 90 em performance, SEO e accessibility.

- [ ] **Step 1: Substituir `founder.jpg`** pela foto escolhida e escrever as 3 linhas (EN/PT/FR) em `i18n.founder.lines`.
- [ ] **Step 2: `bash scripts/deploy.sh`**.
- [ ] **Step 3: Rodar `npx playwright test tests/e2e/smoke-prod.spec.mjs`** → PASS; guardar relatório Lighthouse em `docs/lighthouse/`.
- [ ] **Step 4: Checklist `seo-launch-ratos`** (invocar a skill) e enviar `sitemap.xml` no Google Search Console (verificação por meta tag no `head.njk`).
- [ ] **Step 5: Teste final real** — preencher o diagnóstico no site no ar pelo celular; confirmar e-mail `[A|B|C]` recebido e botão WhatsApp abrindo com o texto.
- [ ] **Step 6: Atualizar `README.md`** (stack, comandos, deploy, onde editar textos) e a memória do projeto.
- [ ] **Step 7: Commit + push** — `feat: redesign launch — founder photo, production smoke tests, README`

---

## Self-review (feito)

- **Cobertura da spec:** §4.1 (T1, T3, T10), §4.2 (T2, T4), §4.3 (T3, T8), §4.4 (T3 proof/founder, T12), §4.5 (T9), §4.6 (T5, T6, T7), §4.7 (sem GA4; contagem fica nas execuções do n8n), §6 (T11 e-mail, T12 foto; sem endereço/redes em T2/T9/T10), §7 (T12).
- **Nomes consistentes:** `computeScore` (T5→T6), `initMotion`/`playHeroDiagram` (T4), `alternates`/`noindex`/`jsonld`/`ogImage` (T2→T3/T8/T9/T10), slugs dos 6 serviços e 15 regiões (Global Constraints→T3/T4/T6/T8/T9/T10), `site.email` (T2→T11).
- **Review Focus → testes:** 1→T4, 2→T6, 3→T7, 4→T1+T12, 5→T9.
- **Proporção:** plano menor que o código resultante; corpos de código só onde o algoritmo não era determinado.
