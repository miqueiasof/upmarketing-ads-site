// Home sections: split headings, proof counters, method rail, funnel bars, portfolio gallery,
// founder reveal and animated FAQ. Runs before motion.js and marks what it animates with
// data-motion-own so the generic reveal leaves it alone.
(function () {
  const main = document.getElementById('main');
  const { gsap, ScrollTrigger } = window;
  const level = document.documentElement.dataset.motion || 'off';
  if (!main || !gsap) return;

  const DESKTOP = '(min-width: 901px)';
  const ENTER = 'top 85%';
  const NUMBER_IN_TEXT = /(?<![\d/])(\d{1,2})(?![\d/])/;
  const FAQ_PADDING = 24;

  const one = (sel, root = main) => root.querySelector(sel);
  const all = (sel, root = main) => Array.from(root.querySelectorAll(sel));
  const own = (els) => els.forEach((el) => el && el.setAttribute('data-motion-own', ''));
  const onEnter = (trigger, fn, start = ENTER) => ScrollTrigger.create({ trigger, start, once: true, onEnter: fn });

  animateFaq();
  if (level !== 'full' || !ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  headings();
  proof();
  method();
  funnel();
  portfolio();
  founder();
  faqEntrance();
  if (ScrollTrigger.sort) ScrollTrigger.sort();

  // Wraps every word of an element (keeping inline children like <em>) in a clipping span.
  function splitWords(el) {
    const walk = (node) => {
      Array.from(node.childNodes).forEach((child) => {
        if (child.nodeType === Node.ELEMENT_NODE) {
          walk(child);
          return;
        }
        if (child.nodeType !== Node.TEXT_NODE) return;
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) {
            frag.appendChild(document.createTextNode(part));
            return;
          }
          const outer = document.createElement('span');
          const inner = document.createElement('span');
          outer.className = 'sw';
          inner.textContent = part;
          outer.appendChild(inner);
          frag.appendChild(outer);
        });
        node.replaceChild(frag, child);
      });
    };
    walk(el);
    return Array.from(el.querySelectorAll('.sw > span'));
  }

  function headings() {
    all('.section__head').forEach((head) => {
      const h2 = head.querySelector('h2');
      const num = head.querySelector('.section__num');
      if (!h2) return;
      own([head]);
      const words = splitWords(h2);
      gsap.set(words, { yPercent: 115 });
      if (num) gsap.set(num, { opacity: 0, x: -14 });
      onEnter(head, () => {
        gsap.to(words, { yPercent: 0, duration: 1.05, ease: 'power4.out', stagger: 0.045 });
        if (num) gsap.to(num, { opacity: 1, x: 0, duration: 0.7, ease: 'power3.out' });
      });
    });
  }

  function wrapNumber(item) {
    const textNode = Array.from(item.childNodes).find((n) => n.nodeType === Node.TEXT_NODE && NUMBER_IN_TEXT.test(n.textContent));
    if (!textNode) return null;
    const text = textNode.textContent;
    const match = text.match(NUMBER_IN_TEXT);
    const span = document.createElement('span');
    span.className = 'proof__n';
    span.textContent = '0';
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createTextNode(text.slice(0, match.index)));
    frag.appendChild(span);
    frag.appendChild(document.createTextNode(text.slice(match.index + match[0].length)));
    item.replaceChild(frag, textNode);
    return { node: span, target: Number(match[1]) };
  }

  function proof() {
    const section = one('.proof');
    const list = section && one('.proof__list', section);
    if (!list) return;
    own([list]);
    const items = all('.proof__item', list);
    const counters = items.map(wrapNumber).filter(Boolean);
    gsap.set(items, { opacity: 0, x: -24 });
    onEnter(list, () => {
      section.classList.add('is-live');
      gsap.to(items, { opacity: 1, x: 0, duration: 0.8, ease: 'power3.out', stagger: 0.12 });
      counters.forEach(({ node, target }) => {
        const state = { value: 0 };
        gsap.to(state, { value: target, duration: 1.4, ease: 'power2.out', onUpdate: () => { node.textContent = String(Math.round(state.value)); } });
      });
    }, 'top 92%');
  }

  // A rail fills as you read; each step lights up when the fill reaches it.
  function method() {
    const wrap = one('.steps-wrap');
    if (!wrap) return;
    const fill = one('.steps__fill', wrap);
    own([wrap]);
    wrap.classList.add('is-armed');
    gsap.fromTo(fill, { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: wrap, start: 'top 65%', end: 'bottom 65%', scrub: 0.4 } });
    all('.step', wrap).forEach((step) => {
      ScrollTrigger.create({
        trigger: step,
        start: 'top 65%',
        onEnter: () => step.classList.add('is-on'),
        onLeaveBack: () => step.classList.remove('is-on'),
      });
    });
  }

  // Before shrinks and leaks, after holds: bars grow column by column.
  function funnel() {
    const box = one('.funnel');
    if (!box) return;
    const [before, after] = all('.funnel__col', box);
    if (!before || !after) return;
    own([box]);
    gsap.set(before, { opacity: 0, x: -40 });
    gsap.set(after, { opacity: 0, x: 40 });
    gsap.set(all('.funnel__bar', box), { scaleX: 0, transformOrigin: 'left center' });
    onEnter(box, () => {
      gsap.timeline({ defaults: { ease: 'power3.out' }, onComplete: () => box.classList.add('is-live') })
        .to([before, after], { opacity: 1, x: 0, duration: 0.9, stagger: 0.15 })
        .to(all('.funnel__bar', before), { scaleX: 1, duration: 0.9, stagger: 0.14 }, 0.35)
        .to(all('.funnel__bar', after), { scaleX: 1, duration: 0.9, stagger: 0.14 }, 0.6)
        .add(() => after.classList.add('is-in'), 0.9);
    }, 'top 80%');
  }

  // Desktop: the gallery pins and slides sideways as you scroll, images drifting inside their frames.
  function portfolio() {
    const strip = one('.strip');
    const track = strip && one('.strip__track', strip);
    if (!track) return;
    own([strip]);
    const items = all('.strip__item', track);
    gsap.set(items, { opacity: 0, y: 60 });
    onEnter(strip, () => gsap.to(items, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.1 }), 'top 90%');
    gsap.matchMedia().add(DESKTOP, () => {
      strip.classList.add('is-scrub');
      const distance = () => Math.max(0, track.scrollWidth - strip.clientWidth);
      const slide = gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: { trigger: strip, start: 'center center', end: () => `+=${distance()}`, scrub: 0.6, pin: true, anticipatePin: 1, invalidateOnRefresh: true, refreshPriority: 1 },
      });
      items.forEach((item) => {
        gsap.fromTo(item.querySelector('img'), { xPercent: -6, scale: 1.14 }, {
          xPercent: 6, scale: 1.14, ease: 'none',
          scrollTrigger: { trigger: item, containerAnimation: slide, start: 'left right', end: 'right left', scrub: true },
        });
      });
      return () => strip.classList.remove('is-scrub');
    });
  }

  function founder() {
    const photo = one('.founder__photo');
    if (!photo) return;
    const img = photo.querySelector('img');
    const lines = all('.founder__name, .founder__line');
    own([photo, ...lines]);
    gsap.set(photo, { clipPath: 'inset(0% 100% 0% 0%)' });
    gsap.set(img, { scale: 1.3 });
    gsap.set(lines, { opacity: 0, y: 22 });
    onEnter(photo, () => {
      gsap.to(photo, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'power4.inOut' });
      gsap.to(img, { scale: 1, duration: 1.8, ease: 'power3.out' });
      gsap.to(lines, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.1, delay: 0.3 });
    }, 'top 80%');
  }

  function faqEntrance() {
    const items = all('.faq__item');
    if (!items.length) return;
    own(items);
    gsap.set(items, { opacity: 0, y: 30 });
    ScrollTrigger.batch(items, {
      start: 'top 90%',
      once: true,
      onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.08 }),
    });
  }

  // FAQ answers open and close with an animated height instead of jumping.
  function animateFaq() {
    if (level === 'off') return;
    all('.faq__item').forEach((item) => {
      const summary = item.querySelector('summary');
      const answer = item.querySelector('.faq__a');
      if (!summary || !answer) return;
      summary.addEventListener('click', (e) => {
        e.preventDefault();
        if (item.dataset.busy) return;
        item.dataset.busy = '1';
        const done = () => {
          gsap.set(answer, { clearProps: 'height,paddingBottom,opacity,visibility,overflow' });
          delete item.dataset.busy;
          if (ScrollTrigger) ScrollTrigger.refresh();
        };
        if (item.open) {
          gsap.to(answer, { height: 0, paddingBottom: 0, opacity: 0, overflow: 'hidden', duration: 0.35, ease: 'power2.inOut', onComplete: () => { item.open = false; done(); } });
          return;
        }
        item.open = true;
        gsap.fromTo(answer, { height: 0, paddingBottom: 0, opacity: 0, overflow: 'hidden' }, { height: 'auto', paddingBottom: FAQ_PADDING, opacity: 1, duration: 0.45, ease: 'power2.out', onComplete: done });
      });
    });
  }
})();
