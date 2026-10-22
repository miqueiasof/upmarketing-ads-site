// Pure helpers for the Search Console ranking report: no I/O, unit-tested in tests/seo-report.test.mjs.

const TOP_QUERIES = 5;
const OPPORTUNITIES = 15;

const normalise = (text) => text
  .toLowerCase()
  .normalize('NFKD')
  .replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9& ]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const total = (rows, field) => rows.reduce((acc, row) => acc + row[field], 0);
const round = (value, digits = 1) => (value === null ? null : Math.round(value * 10 ** digits) / 10 ** digits);
const weightedPosition = (rows) => {
  const impressions = total(rows, 'impressions');
  return impressions ? rows.reduce((acc, row) => acc + row.position * row.impressions, 0) / impressions : null;
};
const pathOf = (url) => new URL(url).pathname;

// A query counts for a keyword when it contains every word of the keyword, in any order.
export function matchesKeyword(query, keyword) {
  const words = new Set(normalise(query).split(' '));
  return normalise(keyword).split(' ').every((word) => words.has(word));
}

// pageRows: Search Console rows with dimensions [page]; queryRows: dimensions [page, query].
export function summarise(pageRows, queryRows, targets) {
  const pageTotals = new Map(pageRows.map((row) => [pathOf(row.keys[0]), row]));
  const queriesByPath = queryRows.reduce((map, row) => {
    const path = pathOf(row.keys[0]);
    const entry = { query: row.keys[1], clicks: row.clicks, impressions: row.impressions, position: row.position };
    return new Map(map).set(path, [...(map.get(path) || []), entry]);
  }, new Map());

  return targets.map((target) => {
    const queries = queriesByPath.get(target.path) || [];
    const totals = pageTotals.get(target.path);
    const keywords = target.keywords.map((keyword) => {
      const hits = queries.filter((q) => matchesKeyword(q.query, keyword));
      return { keyword, clicks: total(hits, 'clicks'), impressions: total(hits, 'impressions'), position: round(weightedPosition(hits)) };
    });
    const topQueries = [...queries]
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, TOP_QUERIES)
      .map((q) => ({ ...q, position: round(q.position) }));
    return {
      path: target.path,
      label: target.label,
      clicks: totals ? totals.clicks : 0,
      impressions: totals ? totals.impressions : 0,
      position: totals ? round(totals.position) : null,
      keywords,
      topQueries,
    };
  });
}

// Positive positionDelta = moved up the results (a smaller position number is better).
export function diff(previous, current) {
  const before = new Map((previous || []).map((page) => [page.path, page]));
  return Object.fromEntries(current.map((page) => {
    const old = before.get(page.path);
    if (!old) return [page.path, null];
    const positionDelta = old.position !== null && page.position !== null ? round(old.position - page.position) : null;
    return [page.path, { positionDelta, impressionsDelta: page.impressions - old.impressions, clicksDelta: page.clicks - old.clicks }];
  }));
}

// Queries already bringing impressions, whatever page they land on — ideas for new content.
export function opportunities(queryRows) {
  return [...queryRows]
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, OPPORTUNITIES)
    .map((row) => ({ query: row.keys[1], path: pathOf(row.keys[0]), impressions: row.impressions, clicks: row.clicks, position: round(row.position) }));
}

const fmtDelta = (value) => {
  if (value === null || value === undefined || value === 0) return '—';
  return `${value > 0 ? '▲' : '▼'} ${Math.abs(value)}`;
};
const fmtPos = (value) => (value === null ? '—' : String(value));
const indexLabel = (status) => {
  if (!status) return 'não verificado';
  if (status.verdict === 'PASS') return 'indexada';
  return status.coverageState || status.verdict || 'desconhecido';
};

export function renderMarkdown({ site, period, summary, changes, inspections, ideas }) {
  const totals = {
    clicks: total(summary, 'clicks'),
    impressions: total(summary, 'impressions'),
    indexed: Object.values(inspections || {}).filter((s) => s && s.verdict === 'PASS').length,
  };
  const ranked = summary.flatMap((page) => page.keywords.filter((k) => k.impressions > 0).map((k) => ({ ...k, label: page.label })))
    .sort((a, b) => (a.position ?? 999) - (b.position ?? 999));
  const silent = summary.filter((page) => page.impressions === 0).map((page) => page.label);

  const lines = [
    `# Ranking no Google — ${site}`,
    '',
    `Período: ${period.start} a ${period.end} (Search Console tem 2–3 dias de atraso).`,
    '',
    `**${totals.impressions} impressões · ${totals.clicks} cliques · ${totals.indexed}/${summary.length} páginas indexadas**`,
    '',
    '## Páginas',
    '',
    '| Página | Indexação | Impressões | Cliques | Posição média | Posição (semana) |',
    '| --- | --- | ---: | ---: | ---: | ---: |',
    ...summary.map((page) => `| ${page.label} | ${indexLabel(inspections?.[page.path])} | ${page.impressions} | ${page.clicks} | ${fmtPos(page.position)} | ${fmtDelta(changes?.[page.path]?.positionDelta)} |`),
    '',
    '## Palavras-chave alvo que já aparecem',
    '',
  ];
  if (ranked.length) {
    lines.push('| Palavra-chave | Página | Impressões | Cliques | Posição |', '| --- | --- | ---: | ---: | ---: |',
      ...ranked.map((k) => `| ${k.keyword} | ${k.label} | ${k.impressions} | ${k.clicks} | ${fmtPos(k.position)} |`));
  } else {
    lines.push('Nenhuma ainda.');
  }
  lines.push('', '## Buscas que já trazem impressões (todas)', '');
  if (ideas && ideas.length) {
    lines.push('| Busca | Página | Impressões | Cliques | Posição |', '| --- | --- | ---: | ---: | ---: |',
      ...ideas.map((q) => `| ${q.query} | ${q.path} | ${q.impressions} | ${q.clicks} | ${fmtPos(q.position)} |`));
  } else {
    lines.push('Nenhuma ainda.');
  }
  lines.push('', '## Sem impressões ainda', '', silent.length ? silent.join(', ') : 'Todas as páginas já aparecem.', '');
  return lines.join('\n');
}

// Minimal HTML version of the same report for the weekly email.
export function renderHtml(markdown) {
  const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const inline = (s) => escape(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  const renderTable = ([head, ...body]) => `<table cellpadding="6" style="border-collapse:collapse;font-size:13px"><tr>${head.map((c) => `<th align="left" style="border-bottom:1px solid #ccc">${inline(c)}</th>`).join('')}</tr>${body.map((r) => `<tr>${r.map((c) => `<td style="border-bottom:1px solid #eee">${inline(c)}</td>`).join('')}</tr>`).join('')}</table>`;
  const out = [];
  let table = [];
  for (const line of [...markdown.split('\n'), '']) {
    if (line.startsWith('|')) {
      const cells = line.slice(1, -1).split('|').map((c) => c.trim());
      if (!cells.every((c) => /^-+:?$/.test(c))) table = [...table, cells];
      continue;
    }
    if (table.length) {
      out.push(renderTable(table));
      table = [];
    }
    if (line.startsWith('# ')) out.push(`<h2>${inline(line.slice(2))}</h2>`);
    else if (line.startsWith('## ')) out.push(`<h3>${inline(line.slice(3))}</h3>`);
    else if (line.trim()) out.push(`<p>${inline(line)}</p>`);
  }
  return `<div style="font-family:Arial,sans-serif;color:#111">${out.join('\n')}</div>`;
}
