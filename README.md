# UP Marketing Ads — site

Site da UP Marketing Ads (upmarketingads.com): inglês em `/`, português em `/pt/`, francês em `/fr/`, páginas de serviço, páginas de região de Londres e formulário de diagnóstico.

Gerado com **Eleventy 3** (Nunjucks) a partir de `src/`. Saída em `dist/`.

## Comandos

```bash
npm install          # uma vez
npm run dev          # http://localhost:8080 com reload
npm run build        # gera dist/
npm test             # testes unitários (build + head/home/score/serviços/regiões/SEO)
npm run test:e2e     # Playwright local (motion + formulário)
npm run og           # regenera as OG images (src/assets/img/og/*.jpg, 1200×630) — rodar quando mudar título/descrição de página
bash scripts/deploy.sh   # build + rsync dist/ -> VPS (/docker/upmarketing/site/)
npm run test:prod    # smoke contra o site no ar (29 URLs, portfólio, preview 401, OG únicas)
```

Lighthouse (relatórios em `docs/lighthouse/`): `lighthouse https://upmarketingads.com/ --output=html --output-path=docs/lighthouse/home`.

## Onde editar

- Textos da home, formulário e obrigado (EN/PT/FR): `src/_data/i18n/{en,pt,fr}.json`.
- Serviços (6): `src/_data/services.json`. Regiões de Londres (15): `src/_data/areas.json` — cada uma com perfil, 3 cenários, FAQ e vizinhas.
- Dados do site (WhatsApp, webhook, e-mail do rodapé): `src/_data/site.json` — `email` vazio = não aparece.
- Mapa de Londres: `src/_includes/partials/london-map.svg.njk` (posições dos pinos).
- Score do diagnóstico (A/B/C): `src/assets/js/score.js`; e-mail do n8n: `scripts/n8n/`.
- Privacidade: `src/privacy.njk` (número da empresa ainda em branco).

## Estrutura

- `src/` — páginas (`.njk`), `_includes/` (layouts e partials), `_data/` (textos por idioma, serviços, regiões), `assets/` (css, js, fontes, imagens).
- `portfolio/` — página de portfólio estática, copiada para `dist/portfolio/` no build.
- `legacy/index.html` — site antigo (export do Claude Design), só referência; não entra no build.
- `docs/superpowers/` — spec e plano do redesign.
- `scripts/` — deploy e utilitários (n8n, OG images).
- `tests/` — testes unitários e e2e (Playwright).

## Hospedagem

VPS Hostinger `76.13.253.56`, container `upmarketing` (nginx:alpine) servindo `/docker/upmarketing/site/`, atrás do Traefik com Let's Encrypt. DNS na HostGator (A → VPS).

## Formulário

Envia para o webhook n8n `https://n8n.moneygirls.com.br/webhook/upmarketing-form`, que manda e-mail via Resend para `up.marketing.ads@gmail.com` com a prioridade do lead (A/B/C) no assunto.
