import { computeScore } from './score.js';

const RETRY_DELAYS_MS = [0, 1000, 3000];
const FETCH_TIMEOUT_MS = 8000;

const form = document.getElementById('diagnosis');
if (form) init(form);

function init(form) {
  const i18n = JSON.parse(document.getElementById('diag-i18n').textContent);
  const steps = Array.from(form.querySelectorAll('.diag__step'));
  const dots = Array.from(form.querySelectorAll('[data-step-dot]'));
  let current = 1;

  const show = (n) => {
    current = n;
    steps.forEach((s) => { s.hidden = Number(s.dataset.step) !== n; });
    dots.forEach((d) => d.classList.toggle('is-active', Number(d.dataset.stepDot) <= n));
    form.scrollIntoView({ block: 'start', behavior: 'smooth' });
  };

  const setErr = (name, msg) => {
    const el = form.querySelector(`[data-err-for="${name}"]`);
    if (!el) return;
    el.textContent = msg || '';
    el.hidden = !msg;
    const group = form.querySelector(`[data-group="${name}"]`) || form.querySelector(`[name="${name}"]`);
    group?.classList.toggle('is-invalid', Boolean(msg));
  };

  const checked = (name) => Array.from(form.querySelectorAll(`input[name="${name}[]"]:checked`)).map((i) => i.value);
  const radio = (name) => form.querySelector(`input[name="${name}"]:checked`)?.value || '';
  const text = (name) => (form.querySelector(`[name="${name}"]`)?.value || '').trim();

  const validators = {
    1: () => {
      let ok = true;
      for (const name of ['business_type', 'revenue', 'time_in_business']) {
        const bad = !radio(name); setErr(name, bad ? i18n.errRequired : ''); ok = ok && !bad;
      }
      return ok;
    },
    2: () => {
      let ok = true;
      const pain = checked('pain');
      setErr('pain', pain.length === 0 ? i18n.errRequired : pain.length > 3 ? i18n.errMax3 : ''); ok = ok && pain.length > 0 && pain.length <= 3;
      const dur = !radio('pain_duration'); setErr('pain_duration', dur ? i18n.errRequired : ''); ok = ok && !dur;
      const tried = checked('tried'); setErr('tried', tried.length ? '' : i18n.errRequired); ok = ok && tried.length > 0;
      return ok;
    },
    3: () => {
      let ok = true;
      const services = checked('services'); setErr('services', services.length ? '' : i18n.errRequired); ok = ok && services.length > 0;
      for (const name of ['budget', 'timeline']) { const bad = !radio(name); setErr(name, bad ? i18n.errRequired : ''); ok = ok && !bad; }
      for (const name of ['name', 'whatsapp']) { const bad = !text(name); setErr(name, bad ? i18n.errRequired : ''); ok = ok && !bad; }
      const email = text('email');
      const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
      setErr('email', !email ? i18n.errRequired : !emailOk ? i18n.errEmail : ''); ok = ok && emailOk;
      const consent = form.querySelector('input[name="consent"]').checked; setErr('consent', consent ? '' : i18n.errConsent); ok = ok && consent;
      return ok;
    },
  };

  form.addEventListener('click', (e) => {
    if (e.target.closest('[data-next]')) { if (validators[current]()) show(current + 1); }
    if (e.target.closest('[data-back]')) show(current - 1);
  });

  // "Other" pain reveals a short text field; max-3 enforcement for the pain group
  form.addEventListener('change', (e) => {
    const input = e.target;
    if (input.name === 'pain[]') {
      const other = form.querySelector('[data-shown-by="pain:other"]');
      other.hidden = !checked('pain').includes('other');
      const max = Number(input.closest('[data-group]').dataset.max || 0);
      if (max && checked('pain').length > max) { input.checked = false; setErr('pain', i18n.errMax3); } else setErr('pain', '');
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validators[3]()) return;
    const btn = form.querySelector('[data-submit]');
    btn.disabled = true; btn.textContent = btn.dataset.sending;

    const answers = {
      business_type: radio('business_type'), website: text('website'), revenue: radio('revenue'), time_in_business: radio('time_in_business'),
      pain: checked('pain'), pain_other: text('pain_other'), pain_duration: radio('pain_duration'), tried: checked('tried'), tried_why: text('tried_why'),
      services: checked('services'), budget: radio('budget'), timeline: radio('timeline'),
      name: text('name'), email: text('email'), whatsapp: text('whatsapp'), consent: true,
    };
    const { points, priority } = computeScore(answers);
    const payload = { ...answers, score: points, priority, lang: form.dataset.lang, source_page: location.pathname };
    try { sessionStorage.setItem('diagnosis', JSON.stringify(payload)); } catch { /* private mode */ }

    const isBot = Boolean(text('company_url'));
    const sent = isBot ? true : await submit(form.dataset.webhook, payload);
    location.href = `${form.dataset.thanks}?p=${priority}${sent ? '' : '&sent=0'}`;
  });
}

async function submit(url, payload) {
  const body = JSON.stringify(payload);
  for (const delay of RETRY_DELAYS_MS) {
    if (delay) await new Promise((r) => setTimeout(r, delay));
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, signal: ctrl.signal });
      clearTimeout(timer);
      if (res.ok) return true;
    } catch { /* retry */ }
  }
  // Last resort: queue a beacon, but still report failure — a beacon's return value
  // only means "queued", so the thank-you page keeps the WhatsApp fallback visible.
  try { navigator.sendBeacon?.(url, new Blob([body], { type: 'application/json' })); } catch { /* ignore */ }
  return false;
}
