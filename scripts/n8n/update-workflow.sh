#!/usr/bin/env bash
# Pushes scripts/n8n/workflow.json to the self-hosted n8n (workflow VjfgeaF1iALztPMF) and activates it.
# The Resend key is injected from ~/.claude/settings.json at push time and never written to the repo.
set -euo pipefail
cd "$(dirname "$0")"
WF_ID="VjfgeaF1iALztPMF"
VPS="root@76.13.253.56"

RESEND_KEY=$(node -e 'const s=require(require("os").homedir()+"/.claude/settings.json");process.stdout.write(s.env.RESEND_API_KEY)')
[ -n "$RESEND_KEY" ] || { echo "RESEND_API_KEY missing"; exit 1; }

sed "s/__RESEND_API_KEY__/$RESEND_KEY/" workflow.json > /tmp/upmarketing-workflow.json
scp -q /tmp/upmarketing-workflow.json "$VPS:/tmp/upmarketing-workflow.json"
rm -f /tmp/upmarketing-workflow.json

ssh "$VPS" bash -s "$WF_ID" <<'REMOTE'
set -euo pipefail
WF_ID="$1"
export $(grep N8N_API_KEY /docker/n8n/.env)
NIP=$(docker inspect n8n --format '{{range .NetworkSettings.Networks}}{{.IPAddress}} {{end}}' | awk '{print $1}')
API="http://$NIP:5678/api/v1/workflows/$WF_ID"
code=$(curl -s -o /tmp/wf-put.json -w '%{http_code}' -X PUT "$API" -H "X-N8N-API-KEY: $N8N_API_KEY" -H 'Content-Type: application/json' -d @/tmp/upmarketing-workflow.json)
echo "PUT http=$code"
[ "$code" = "200" ] || { head -c 400 /tmp/wf-put.json; echo; exit 1; }
curl -s -X POST "$API/activate" -H "X-N8N-API-KEY: $N8N_API_KEY" | python3 -c 'import sys,json; d=json.load(sys.stdin); print("active =", d.get("active"))'
rm -f /tmp/upmarketing-workflow.json /tmp/wf-put.json
REMOTE
