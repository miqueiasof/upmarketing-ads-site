# UP Marketing Ads — redesign do site + SEO local Londres + formulário de diagnóstico

Data: 2026-10-21 · Dono: Miqueias (UP Marketing Ads) · Status: aguardando aprovação

## 1. Intenção

Trocar o site atual (export do Claude Design, trilíngue por botão, hero vazio no mobile, zero prova, sem páginas indexáveis em inglês) por um site **em inglês como idioma principal**, com motion de verdade, um hero que mostra o sistema da UP em 3 segundos, 6 serviços alinhados ao que o Reino Unido busca no Google, páginas de SEO local por região de Londres e um **formulário de diagnóstico** que qualifica o lead (método "consulta médica") e alimenta a automação já existente (n8n → e-mail + WhatsApp).

Por quê agora: o site atual não ranqueia em inglês (uma URL só, conteúdo em PT), não transmite "empresa séria de alto valor" no mobile e não prova nada. A UP já entrega os 6 serviços hoje (sites Laine/ONYX/Gina&Gaya, esteira de vídeo MG, agentes Hermes/Gaby, Meta Ads Gene/Karol) — o site só precisa dizer isso bem e ser encontrado.

## 2. Objetivos / não-objetivos / anti-objetivos

**Objetivos**
- Ranquear em Londres (e depois Inglaterra) para buscas de serviço em inglês.
- Hero mobile e desktop que posiciona premium e mostra os 6 serviços como um sistema.
- Formulário de diagnóstico que gera dossiê útil (dor, tempo, o que já tentou, faturamento) com prioridade A/B/C.
- Manter tudo que funciona: domínio, VPS, Traefik/nginx, webhook n8n, e-mail Resend, CTA WhatsApp, portfólio.

**Não-objetivos (fase 1)**
- Blog. CMS. Login. Pagamento. Páginas de serviço/região em PT/FR (só EN).
- Outras cidades da Inglaterra (fase 2: Manchester, Birmingham, Leeds, Bristol).
- Depoimentos inventados, logos de cliente, números que não existem.

**Anti-objetivos (falha mesmo funcionando)**
- Páginas de região iguais trocando o nome (doorway pages). Cada uma precisa de conteúdo próprio.
- Hero com foto de banco / template de agência.
- Animação que trava celular ou ignora `prefers-reduced-motion`.
- Expor nome/domínio de cliente fora do que o portfólio já mostra.
- Perder submissões do formulário (hoje o fetch falha em silêncio).

## 3. Restrições

- Hospedagem: VPS Hostinger `76.13.253.56`, container `upmarketing` (nginx:alpine, `/docker/upmarketing/site`), Traefik com Let's Encrypt. Deploy = arquivos estáticos nessa pasta. Caminhos `/preview-ginagaya/` e `/preview-lainedoll/` são roteados pelo Traefik para outros containers e **não podem ser quebrados**.
- Formulário: webhook existente `https://n8n.moneygirls.com.br/webhook/upmarketing-form` (workflow `VjfgeaF1iALztPMF`, CORS `*`), e-mail para `up.marketing.ads@gmail.com` via Resend. Pode (e deve) receber campos novos.
- Identidade: fundo `#0A1428`, texto `#EEF2F8`, muted `#7C8BA3`, acento `#3DE8C8`, fontes Instrument Serif (display), Space Grotesk (texto), IBM Plex Mono (rótulos). Manter.
- Portfólio `/portfolio/` existente permanece (pode ganhar o header novo).
- Repo: `miqueiasof/upmarketing-ads-site` (branch main). Commits em inglês, conventional commits.
- Processo da casa: Claude planeja e revisa, Codex implementa (`--model gpt-5.5`); pesquisa visual obrigatória no Refero antes de desenhar telas (skill `refero-design`); checklist `seo-launch-ratos` antes de publicar.

## 4. Decisões tomadas

### 4.1 Arquitetura e URLs (minha escolha, salvo marcado)
- Gerador estático **Eleventy 3 + Nunjucks**, saída em `dist/`, zero JS de framework no cliente. Motivo: 1 home × 3 idiomas + 6 serviços + 16 páginas de Londres = template, não HTML na mão. _(minha escolha)_
- Idiomas: `/` = EN (principal, indexável). `/pt/` e `/fr/` = home + formulário traduzidos, com `hreflang` nas três (`en`, `pt`, `fr` + `x-default` = EN). Serviços e regiões só em EN. _(decidido com o usuário: inglês vira principal)_
- Alvo de `/pt/` e `/fr/`: lusófonos e francófonos **que vivem no Reino Unido/Europa** e compram em libras — não o mercado Brasil/França. Logo: mesmas faixas em £, mesmo DDI padrão (+44), mesmo score, mesmo e-mail. Entram no sitemap (hreflang exige reciprocidade). _(minha escolha)_
- Rotas EN:
  - `/` home · `/services/` índice · `/services/seo-ai-search/` · `/services/websites/` · `/services/social-media-content/` · `/services/video-editing/` · `/services/ai-automation/` · `/services/paid-ads/`
  - `/london/` hub · `/london/<area>/` × 15 (lista em 4.5)
  - `/diagnosis/` formulário (também embutido no fim da home) · `/diagnosis/thanks/` obrigado por prioridade
  - `/portfolio/` (existente) · `/privacy/`
- Deploy: `rsync dist/ → /docker/upmarketing/site/`, mantendo `portfolio/` e sem tocar nas rotas de preview.

### 4.2 Design e motion
- Direção: **"o sistema se montando"** (aprovada). Hero = diagrama SVG dos 6 serviços como nós ligados por linhas que se desenham e pulsam (GSAP + DrawSVG); headline contrária em serif; no mobile os nós empilham em coluna e a headline fica na primeira dobra (nada de hero vazio). Abaixo, faixa com mockups do portfólio rolando (reaproveita `/portfolio/img/`).
- Stack de motion: **Lenis + GSAP 3 (ScrollTrigger, DrawSVG)**, arquivos servidos localmente (sem CDN). Reveals por seção, botões magnéticos, marquee dos serviços, funil antes/depois animado, números contando, cursor com brilho só em `pointer: fine`. Tudo desligado em `prefers-reduced-motion` e com nível "lite" em celular fraco (mesmo padrão `data-motion` do site da Laine). _(minha escolha de stack, já aprovada em 2 sites)_
- Headline EN (rascunho, ajustável na execução): "Your product isn't selling little. It's being sold wrong." / sub: "Websites, content, video, AI automation and ads — built as one sales system. London."
- Pesquisa de referência no Refero antes de desenhar hero, cards de serviço e formulário; registrar 3–5 referências por tela no plano.
- Sem barra fixa de CTA no mobile (rejeitada pelo usuário). CTA no hero + no header + fim de cada seção.

### 4.3 Os 6 serviços (aprovados) — ordem no site
1. **SEO & AI Search** (Google + ChatGPT/AI Overviews; SEO local Londres; GEO)
2. **Websites & Landing Pages** (posicionamento + site que converte)
3. **Social Media & Content** (gestão + criação, calendário por IA)
4. **Video Editing & Short-form** (Reels/TikTok/YouTube/corporativo; avatar, dublagem, b-roll IA)
5. **AI Automation & Agents** (WhatsApp/chat, atendimento, follow-up, CRM, e-mail)
6. **Paid Ads** (Google + Meta; criativos e otimização por IA)

Cada página de serviço: H1 com termo buscado + "London", o que entra, como a IA é usada, para quem é, 3 exemplos anônimos (do portfólio quando houver), FAQ (5), CTA para o diagnóstico. Schema `Service` + `FAQPage`.

### 4.4 Prova e credibilidade
- Faixa de prova logo após o hero: "4 sistemas no ar · 3 idiomas · diagnóstico em 24h" + mockups do portfólio.
- Bloco "Quem assina": nome, foto e 3 linhas — **depende de foto e texto do usuário** (ver §6).
- Rodapé: e-mail, WhatsApp, Instagram/LinkedIn **só se existirem** (hoje são links mortos; ver §6).

### 4.5 SEO local — Londres
- Hub `/london/`: por que Londres, como a UP trabalha por região, mapa com as 15 áreas, lista de serviços, FAQ.
- 15 áreas (fase 1): Westminster, City of London, Canary Wharf, Shoreditch, Mayfair & Soho, Camden, Kensington & Chelsea, Islington, Hackney, Southwark, Greenwich, Stratford, Richmond, Wimbledon, Croydon. _(minha escolha, cobre centros de negócio + bairros com comércio local)_
- Cada página de área tem conteúdo **próprio** (mínimo 600 palavras): perfil de negócios da região (indústrias dominantes, tipo de cliente), 3 cenários "como ajudaríamos um negócio em <área>", quais dos 6 serviços pesam mais ali, FAQ local (4), CTA. Nada gerado por troca de variável — o texto é escrito por área, com dados públicos (ONS/borough) citados quando usados.
- Schema `LocalBusiness` (`areaServed` = área) + `BreadcrumbList`. `sitemap.xml`, `robots.txt`, canonical, OG por página.
- Google Business Profile e endereço: **depende do usuário** (§6).
- Fase 2 (fora deste escopo): Manchester, Birmingham, Leeds, Bristol com o mesmo template.

### 4.6 Formulário de diagnóstico (método "consulta médica")
Objetivo: fazer o lead se diagnosticar e entregar à UP um dossiê com contra-objeção pronta. 3 passos, barra de progresso, ~90 segundos.

**Passo 1 — O negócio**
- `business_type` (select): Local service · Online course / info-product · E-commerce · Professional services · Creator / personal brand · Other
- `website` (url, opcional)
- `revenue` (select, peso maior no score): Pre-revenue · < £2k/mo · £2–10k · £10–50k · £50–200k · > £200k
- `time_in_business` (select): < 1 year · 1–3 · 3–10 · 10+

**Passo 2 — O que dói**
- `pain` (multi, até 3): Not enough leads · Leads don't convert · No time for content · Website doesn't sell · Ads too expensive · No follow-up / leads go cold · Don't show up on Google or AI · Other (texto curto)
- `pain_duration` (select): < 3 months · 3–12 months · 1–3 years · Since I started
- `tried` (multi): Did it myself · Hired a freelancer · Hired an agency · Bought a course · Changed ads/platform · Nothing yet
- `tried_why` (textarea curto, opcional): "Why didn't it work?"

**Passo 3 — Objetivo e contato**
- `services` (multi, os 6)
- `budget` (select): < £500/mo · £500–1.5k · £1.5–5k · £5k+ · Not sure yet
- `timeline` (select): This month · Next 1–3 months · Exploring
- `name`, `email`, `whatsapp` (DDI), `consent` (UK GDPR)
- `lang` e `source_page` automáticos.

**Score (client-side, enviado no payload):** soma de quatro campos, máximo 14. A ≥ 10 · B 6–9 · C ≤ 5. _(tabela = minha escolha)_

| Campo | Opção → pontos |
|---|---|
| `revenue` | Pre-revenue 0 · < £2k 1 · £2–10k 2 · £10–50k 3 · £50–200k 4 · > £200k 5 |
| `budget` | < £500 0 · £500–1.5k 1 · Not sure yet 1 · £1.5–5k 3 · £5k+ 4 |
| `timeline` | Exploring 0 · Next 1–3 months 2 · This month 3 |
| `pain_duration` | < 3 months 0 · 3–12 months 1 · 1–3 years 2 · Since I started 2 | O e-mail traz **Prioridade** no assunto e um bloco **Contra-objeção** com `pain`, `pain_duration`, `tried`, `tried_why`.

**Obrigado por prioridade** (`/diagnosis/thanks/?p=A|B|C`, dados vêm por `sessionStorage`):
- A: abre com a dor nas palavras dela, promete diagnóstico em 24h, botão WhatsApp em destaque (mensagem pré-preenchida com nome + dor).
- B: mesma abertura, responde à trava principal com 1 link do portfólio/serviço, WhatsApp.
- C: "sem pressa", 2 links úteis, "me avisa quando for a hora".

**Robustez:** envio com retry (3×), fallback `navigator.sendBeacon`, e se tudo falhar mostra o WhatsApp com os dados no texto — nunca perde o lead em silêncio. Validação por passo, erros em linha, honeypot anti-spam. Workflow n8n atualizado para o novo payload (template de e-mail com Prioridade + Contra-objeção).

### 4.7 Analytics e medição
- Fase 1: Google Search Console (verificação por DNS/HTML) + evento de envio do formulário no próprio n8n (contagem por prioridade). Sem GA4 e sem banner de cookie na fase 1 — mantém o site limpo e dentro do PECR. _(minha escolha; GA4 pode entrar depois com consent mode)_

## 5. Deixado para o builder
- Estrutura interna do Eleventy (layouts, data files, i18n), nomes de classes, organização do CSS.
- Easing, durações e sequência exata das animações (dentro do estilo "editorial, contido, rápido").
- Texto das 15 páginas de área (seguindo as regras de §4.5) e das 6 páginas de serviço, com revisão do Miqueias antes de publicar.
- Tamanhos/otimização de imagens, geração de OG images, favicon definitivo.
- Como embutir o formulário na home (mesmo componente da página `/diagnosis/`).

## 6. Respostas do Miqueias (2026-10-21) e escolhas residuais
- **Rosto:** sim — foto escolhida na biblioteca do Fotos (candidatas A–E enviadas; a escolhida vai em `src/img/founder.jpg`, exportada em resolução original). Texto de 3 linhas: builder escreve, Miqueias revisa.
- **Endereço:** nenhum endereço em Londres no site. `LocalBusiness` sem `address`, só `areaServed` (Londres + 15 áreas) e `@type: ProfessionalService`. Google Business Profile fica fora da fase 1 (exige endereço para verificação).
- **Redes:** sem Instagram e sem LinkedIn. Rodapé = WhatsApp + formulário (+ e-mail quando existir).
- **Método:** aprovado. EN = "sales system"; PT/FR mantêm "engenharia de vendas online" / "ingénierie de vente en ligne".
- **Prova** _(não respondido → minha escolha, reversível)_: só afirmações verificáveis e anônimas, sem nomear cliente: "4 sistemas no ar", "3 idiomas", "operação vendendo em 9 países", "agentes de IA atendendo WhatsApp 24/7", "esteira semanal de vídeo". Sem valores de faturamento de cliente.
- **Entidade legal** _(não respondido → minha escolha)_: `/privacy/` nomeia "UP Marketing Ads" como nome comercial e controlador, contato por e-mail/WhatsApp, processadores n8n (VPS própria), Resend, WhatsApp. Campo para número de empresa fica reservado até o Miqueias informar.
- **E-mail** _(não respondido → minha escolha)_: criar `hello@upmarketingads.com` como encaminhamento gratuito (ImprovMX, MX na zona HostGator) → `up.marketing.ads@gmail.com`. Só aparece no rodapé depois de testado.

## 7. Critério de pronto
- Lighthouse mobile ≥ 90 em performance/SEO/acessibilidade na home e numa página de área.
- Hero visível na primeira dobra em 375px, sem área vazia.
- Formulário envia e-mail com Prioridade e Contra-objeção; teste real recebido.
- 29 URLs no sitemap indexáveis (25 EN + `/pt/` + `/fr/` + `/portfolio/` + `/privacy/`; `/diagnosis/thanks/` fica `noindex`); hreflang válido; schema sem erro no Rich Results Test.
- `/portfolio/`, `/preview-ginagaya/` e `/preview-lainedoll/` continuam funcionando.
- Checklist `seo-launch-ratos` concluído e GSC verificado.
