={{ (() => {
  const b = $json.body || {};
  const esc = (v) => String(v === undefined || v === null ? '' : v).replace(/</g, '&lt;');
  const val = (v) => Array.isArray(v) ? (v.length ? v.map(esc).join(' · ') : '—') : (v === '' || v === undefined || v === null ? '—' : esc(v));
  const row = (l, v) => '<tr><td style="color:#888;padding:4px 10px 4px 0;vertical-align:top;white-space:nowrap">' + l + '</td><td style="padding:4px 0"><b>' + val(v) + '</b></td></tr>';
  const table = (rows) => '<table cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-family:sans-serif;font-size:14px;margin:0 0 18px">' + rows.join('') + '</table>';
  const pri = '[' + (b.priority ? esc(b.priority) : '—') + ']';
  const lead = table([row('Name', b.name), row('Email', b.email), row('WhatsApp', b.whatsapp || b.whats), row('Business', b.business_type), row('Website', b.website), row('Revenue', b.revenue), row('Time in business', b.time_in_business), row('Wants help with', b.services), row('Budget', b.budget), row('Timeline', b.timeline), row('Score', b.score), row('Language', b.lang), row('Page', b.source_page)]);
  const pains = (Array.isArray(b.pain) ? b.pain : []).concat(b.pain_other ? [b.pain_other] : []);
  const objection = table([row('Pain', pains), row('For how long', b.pain_duration), row('Already tried', b.tried), row('Why it failed', b.tried_why)]);
  const legacy = (b.goal || b.msg) ? '<h3 style="font-family:sans-serif">Legacy fields</h3>' + table([row('Goal', b.goal), row('Message', b.msg)]) : '';
  const html = '<h2 style="font-family:sans-serif">New lead — upmarketingads.com ' + pri + '</h2><h3 style="font-family:sans-serif">Lead</h3>' + lead + '<h3 style="font-family:sans-serif">Counter-objection</h3>' + objection + legacy + '<p style="color:#888;font-family:sans-serif;font-size:12px">Sent automatically by the diagnosis form.</p>';
  const out = { from: 'UP Marketing Ads <site@mgintelligence.tools>', to: ['up.marketing.ads@gmail.com'], subject: '🚀 ' + pri + ' New lead — ' + (b.name || 'unknown'), html };
  if (b.email) out.reply_to = b.email;
  return JSON.stringify(out);
})() }}
