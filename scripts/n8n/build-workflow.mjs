// Builds scripts/n8n/workflow.json (safe to commit) from the raw export:
// - keeps only the fields the n8n PUT endpoint accepts
// - swaps the Resend email body for email-body.expr.js
// - replaces the Resend API key with the __RESEND_API_KEY__ placeholder
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const raw = JSON.parse(readFileSync(join(here, 'workflow.raw.json'), 'utf8'));
const expr = readFileSync(join(here, 'email-body.expr.js'), 'utf8').trim();

const resend = raw.nodes.find((n) => n.name === 'Resend Email');
if (!resend) throw new Error('node "Resend Email" not found');
resend.parameters.jsonBody = expr;
for (const h of resend.parameters.headerParameters.parameters) {
  if (h.name === 'Authorization') h.value = 'Bearer __RESEND_API_KEY__';
}

const webhook = raw.nodes.find((n) => n.name === 'Webhook');
if (!webhook || webhook.parameters.options?.allowedOrigins !== '*') throw new Error('webhook node changed unexpectedly');

const out = { name: raw.name, nodes: raw.nodes, connections: raw.connections, settings: raw.settings, staticData: raw.staticData ?? null };
writeFileSync(join(here, 'workflow.json'), JSON.stringify(out, null, 2) + '\n');
console.log('workflow.json written:', out.nodes.length, 'nodes');
