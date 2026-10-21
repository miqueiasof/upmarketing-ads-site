const PAIN_TO_SERVICE = {
  leads: 'paid-ads', conversion: 'websites', 'content-time': 'social-media-content', website: 'websites',
  'ads-cost': 'paid-ads', 'follow-up': 'ai-automation', 'not-found': 'seo-ai-search', other: 'websites',
};

const root = document.getElementById('thanks');
const strings = JSON.parse(document.getElementById('thanks-i18n').textContent);
const params = new URLSearchParams(location.search);
const priority = ['A', 'B', 'C'].includes(params.get('p')) ? params.get('p') : 'C';
const sent = params.get('sent') !== '0';

let data = {};
try { data = JSON.parse(sessionStorage.getItem('diagnosis') || '{}'); } catch { /* ignore */ }

const lang = ['en', 'pt', 'fr'].includes(data.lang) ? data.lang : 'en';
const t = strings[lang];
const name = (data.name || '').split(' ')[0] || t.fallbackName;
const painLabels = (data.pain || []).map((p) => t.pain[p] || p);
const painText = painLabels.length ? painLabels.join(', ') : t.fallbackPain;
const duration = t.duration[data.pain_duration] || t.fallbackDuration;
const fill = (s) => s.replace('{name}', name).replace('{pain}', painText).replace('{duration}', duration);

const waHref = `https://wa.me/${root.dataset.whatsapp}?text=${encodeURIComponent(fill(t.waMsg))}`;
const variant = t[priority];
const serviceSlug = PAIN_TO_SERVICE[(data.pain || [])[0]] || 'websites';
const links = priority === 'B' ? [`/services/${serviceSlug}/`] : priority === 'C' ? ['/services/seo-ai-search/', '/portfolio/'] : [];

root.innerHTML = `
  <p class="mono">${t.kicker} · ${priority}</p>
  <h1>${fill(variant.h1)}</h1>
  <p class="thanks__p">${fill(variant.p)}</p>
  ${!sent ? `<div class="thanks__fallback"><p class="mono">${t.fallbackTitle}</p><p>${t.fallbackText}</p></div>` : ''}
  ${links.length ? `<ul class="thanks__links">${links.map((h) => `<li><a href="${h}">${t.readMore} ${h}</a></li>`).join('')}</ul>` : ''}
  <a class="btn btn--primary thanks__wa" href="${waHref}" target="_blank" rel="noopener">${t.wa}</a>
  ${priority === 'C' ? `<p class="muted thanks__later">${variant.later}</p>` : ''}
`;
