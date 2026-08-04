# UP Marketing Ads — Site institucional

Site one-page trilíngue (PT / EN / FR) da UP Marketing Ads — engenharia de vendas online, Londres.

## Estrutura

- `index.html` — o site completo, autocontido (HTML + CSS + JS num único arquivo). Não precisa de build, servidor Node ou dependências: qualquer servidor web estático serve.

## Rodar localmente

Abra o `index.html` no navegador, ou:

```bash
npx serve .
```

## Deploy na VPS (Nginx)

```bash
scp index.html usuario@SEU_IP:/var/www/upmarketing/
```

```nginx
server {
  listen 80;
  server_name seudominio.com www.seudominio.com;
  root /var/www/upmarketing;
  index index.html;
}
```

Depois do DNS propagar: `certbot --nginx` para SSL grátis.

## Conteúdo e idiomas

Todo o texto dos 3 idiomas está no objeto `CONTENT` dentro do `index.html` (chaves `pt`, `en`, `fr`). Edite lá para mudar qualquer copy.

## Pendências

- O formulário de contato é visual — ainda não envia leads a nenhum backend. Conectar a Formspree, webhook próprio ou WhatsApp antes de rodar tráfego.
- Espaços de imagem (avatares de depoimentos) aceitam arrastar-e-soltar no editor de origem; substituir por `<img>` reais em produção.
