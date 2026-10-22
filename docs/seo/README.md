# Monitoramento de ranking no Google

`npm run seo:report` lê o Google Search Console (propriedade `https://upmarketingads.com/`) e gera:

- `docs/seo/reports/AAAA-MM-DD.md` — relatório legível: indexação de cada página, impressões, cliques e posição média por página, palavras-chave alvo que já aparecem, buscas que já trazem impressões (ideias de conteúdo) e páginas ainda sem impressão.
- `docs/seo/snapshots/AAAA-MM-DD.json` — dados brutos; o relatório seguinte compara com o último e mostra quanto cada página subiu (▲) ou caiu (▼).

As palavras-chave alvo de cada página ficam em `scripts/seo/targets.json`. Uma busca conta para a palavra-chave quando contém todas as palavras dela, em qualquer ordem e sem acento ("london seo agency" conta para "seo agency london").

Opções: `--days 28` (janela), `--no-inspect` (pula a checagem de indexação página a página), `--email` (envia o relatório por e-mail via Resend; exige `REPORT_EMAIL_TO`), `--fixture arquivo.json` (roda com dados de exemplo, sem API).

## Credencial (conta de serviço, só leitura)

O app OAuth do projeto está em modo "Testando", e nesse modo o Google derruba o login a cada 7 dias — inviável pra um relatório semanal. Por isso o script usa uma conta de serviço, que não expira:

1. Ligar a **Google Search Console API** no projeto `gen-lang-client-0642018730`: https://console.cloud.google.com/apis/library/searchconsole.googleapis.com?project=gen-lang-client-0642018730
2. Criar uma conta de serviço (ex.: `gsc-reader`, sem nenhum papel no projeto) em IAM → Contas de serviço, e gerar uma chave JSON.
3. Salvar a chave em `~/.config/upmarketing/gsc-service-account.json` com permissão `600`. Nunca dentro do repositório.
4. No Search Console → Configurações → Usuários e permissões → Adicionar usuário: o e-mail da conta de serviço, permissão **Restrita** (só leitura).
5. Testar: `npm run seo:report`.

## Status (22/10/2026)

- Search Console API ligada no projeto; conta de serviço `gsc-reader@gen-lang-client-0642018730.iam.gserviceaccount.com` criada sem papéis no projeto e adicionada como usuário **Restrito** na propriedade; chave em `~/.config/upmarketing/gsc-service-account.json` (600).
- Agendado no Mac: `~/Library/LaunchAgents/com.upmarketing.seo-report.plist` — toda segunda 09:00 (Londres) roda `gsc-report.mjs --email` para `up.marketing.ads@gmail.com`. Log em `~/Library/Logs/upmarketing-seo-report.log`. Rodar agora: `launchctl kickstart gui/$(id -u)/com.upmarketing.seo-report`. Desligar: `launchctl bootout gui/$(id -u)/com.upmarketing.seo-report`.
- Relatórios e snapshots ficam em `docs/seo/reports/` e `docs/seo/snapshots/`, só no Mac (fora do git).

## Quando esperar dados

A propriedade foi verificada em 22/10/2026. O Search Console mostra as primeiras impressões 2–3 dias depois, e páginas novas costumam levar de 1 a 4 semanas pra entrar no índice e alguns meses pra estabilizar posição. Nas primeiras semanas o dado mais útil do relatório é a coluna **Indexação**.
