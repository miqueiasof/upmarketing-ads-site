#!/usr/bin/env bash
# Sends one legacy-shaped payload and one new diagnosis payload to the live webhook,
# then checks the two latest executions succeeded and produced a Resend id.
set -euo pipefail
VPS="root@76.13.253.56"
WF_ID="VjfgeaF1iALztPMF"

ssh "$VPS" bash -s "$WF_ID" <<'REMOTE'
set -euo pipefail
WF_ID="$1"
URL="https://n8n.moneygirls.com.br/webhook/upmarketing-form"
LEGACY='{"name":"TEST legacy","email":"legacy@example.com","whats":"+447000000001","goal":"Diagnóstico","revenue":"10–50 mil","msg":"legacy payload","lang":"pt"}'
NEW='{"name":"TEST diagnosis","email":"new@example.com","whatsapp":"+447000000002","business_type":"course","website":"https://example.com","revenue":"gt200k","time_in_business":"3-10y","pain":["leads","follow-up"],"pain_other":"","pain_duration":"1-3y","tried":["agency"],"tried_why":"Slow and generic","services":["ai-automation","paid-ads"],"budget":"gt5000","timeline":"now","consent":true,"score":14,"priority":"A","lang":"en","source_page":"/diagnosis/"}'
echo "legacy http=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$URL" -H 'Content-Type: application/json' -d "$LEGACY")"
echo "new    http=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$URL" -H 'Content-Type: application/json' -d "$NEW")"
sleep 4
export $(grep N8N_API_KEY /docker/n8n/.env)
NIP=$(docker inspect n8n --format '{{range .NetworkSettings.Networks}}{{.IPAddress}} {{end}}' | awk '{print $1}')
curl -s "http://$NIP:5678/api/v1/executions?workflowId=$WF_ID&includeData=true&limit=2" -H "X-N8N-API-KEY: $N8N_API_KEY" | python3 -c '
import sys, json
for e in json.load(sys.stdin)["data"]:
    rd = e["data"]["resultData"]
    name = rd["runData"]["Webhook"][0]["data"]["main"][0][0]["json"]["body"].get("name")
    run = rd["runData"].get("Resend Email", [{}])[0]
    out = run.get("data", {}).get("main", [[{}]])[0][0].get("json", {}) if not run.get("error") else {}
    print(e["status"], "|", name, "| resend_id:", out.get("id", "NONE"), "| err:", str(run.get("error", ""))[:160])
'
REMOTE
