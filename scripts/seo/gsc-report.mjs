#!/usr/bin/env node
// Weekly Google ranking report for upmarketingads.com from the Search Console API.
// Usage: node scripts/seo/gsc-report.mjs [--days 28] [--fixture data.json] [--no-inspect] [--email]
// Auth: read-only service account key — see docs/seo/README.md.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { homedir } from 'node:os';
import { createSign } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { summarise, diff, opportunities, renderMarkdown, renderHtml } from './lib.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const SITE_URL = 'https://upmarketingads.com/';
const SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';
const KEY_FILE = process.env.GSC_KEY_FILE || join(homedir(), '.config/upmarketing/gsc-service-account.json');
const OUT_DIR = join(ROOT, 'docs/seo');
const DATA_LAG_DAYS = 3;
const DEFAULT_DAYS = 28;
const ROW_LIMIT = 25000;
const DAY_MS = 86400000;
const EMAIL_FROM = 'UP Marketing Ads <site@mgintelligence.tools>';

const parseArgs = (argv) => ({
  days: Number(argv[argv.indexOf('--days') + 1]) || DEFAULT_DAYS,
  fixture: argv.includes('--fixture') ? argv[argv.indexOf('--fixture') + 1] : null,
  inspect: !argv.includes('--no-inspect'),
  email: argv.includes('--email'),
});

const isoDay = (date) => date.toISOString().slice(0, 10);
const periodFor = (days) => {
  const end = new Date(Date.now() - DATA_LAG_DAYS * DAY_MS);
  const start = new Date(end.getTime() - (days - 1) * DAY_MS);
  return { start: isoDay(start), end: isoDay(end) };
};

async function accessToken() {
  if (!existsSync(KEY_FILE)) throw new Error(`Service account key not found at ${KEY_FILE} (see docs/seo/README.md).`);
  const key = JSON.parse(readFileSync(KEY_FILE, 'utf8'));
  const now = Math.floor(Date.now() / 1000);
  const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const unsigned = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({ iss: key.client_email, scope: SCOPE, aud: key.token_uri, iat: now, exp: now + 3600 })}`;
  const signature = createSign('RSA-SHA256').update(unsigned).sign(key.private_key, 'base64url');
  const res = await fetch(key.token_uri, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${unsigned}.${signature}` }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`Token request failed: ${res.status} ${body.error_description || body.error}`);
  return body.access_token;
}

async function callGsc(token, path, payload) {
  const res = await fetch(`https://searchconsole.googleapis.com${path}`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`Search Console ${path} failed: ${res.status} ${body.error?.message || ''}`);
  return body;
}

async function fetchData(period, targets, withInspection) {
  const token = await accessToken();
  const analytics = (dimensions) => callGsc(token, `/webmasters/v3/sites/${encodeURIComponent(SITE_URL)}/searchAnalytics/query`, {
    startDate: period.start, endDate: period.end, dimensions, rowLimit: ROW_LIMIT,
  }).then((body) => body.rows || []);
  const [pageRows, queryRows] = await Promise.all([analytics(['page']), analytics(['page', 'query'])]);
  const inspections = {};
  if (withInspection) {
    for (const target of targets) {
      const body = await callGsc(token, '/v1/urlInspection/index:inspect', { inspectionUrl: new URL(target.path, SITE_URL).href, siteUrl: SITE_URL });
      const status = body.inspectionResult?.indexStatusResult || {};
      inspections[target.path] = { verdict: status.verdict, coverageState: status.coverageState, lastCrawlTime: status.lastCrawlTime };
    }
  }
  return { pageRows, queryRows, inspections };
}

function latestSnapshot(beforeDay) {
  const dir = join(OUT_DIR, 'snapshots');
  if (!existsSync(dir)) return null;
  const files = readdirSync(dir).filter((f) => f.endsWith('.json') && f.slice(0, 10) < beforeDay).sort();
  return files.length ? JSON.parse(readFileSync(join(dir, files.at(-1)), 'utf8')) : null;
}

async function sendEmail(subject, html) {
  const to = process.env.REPORT_EMAIL_TO;
  const settings = join(homedir(), '.claude/settings.json');
  const apiKey = process.env.RESEND_API_KEY || (existsSync(settings) ? JSON.parse(readFileSync(settings, 'utf8')).env?.RESEND_API_KEY : null);
  if (!to || !apiKey) throw new Error('Email needs REPORT_EMAIL_TO and RESEND_API_KEY.');
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({ from: EMAIL_FROM, to: [to], subject, html }),
  });
  if (!res.ok) throw new Error(`Resend failed: ${res.status} ${await res.text()}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const targets = JSON.parse(readFileSync(join(ROOT, 'scripts/seo/targets.json'), 'utf8'));
  const period = periodFor(args.days);
  const data = args.fixture ? JSON.parse(readFileSync(resolve(args.fixture), 'utf8')) : await fetchData(period, targets, args.inspect);

  const summary = summarise(data.pageRows, data.queryRows, targets);
  const previous = latestSnapshot(period.end);
  const changes = diff(previous?.summary, summary);
  const ideas = opportunities(data.queryRows);
  const markdown = renderMarkdown({ site: 'upmarketingads.com', period, summary, changes, inspections: data.inspections, ideas });

  if (!args.fixture) {
    mkdirSync(join(OUT_DIR, 'snapshots'), { recursive: true });
    mkdirSync(join(OUT_DIR, 'reports'), { recursive: true });
    writeFileSync(join(OUT_DIR, 'snapshots', `${period.end}.json`), JSON.stringify({ period, summary, inspections: data.inspections }, null, 2));
    writeFileSync(join(OUT_DIR, 'reports', `${period.end}.md`), markdown);
  }
  if (args.email) await sendEmail(`Ranking Google — upmarketingads.com — ${period.end}`, renderHtml(markdown));
  console.log(markdown);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
