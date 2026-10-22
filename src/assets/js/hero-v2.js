// Hero v2: "the sales system assembling itself" — intro sequence, live loops, scroll scrub,
// and the services entrance below it. Loaded after motion.js (motion level + Lenis/ScrollTrigger).
(function () {
  const hero = document.querySelector('[data-hv2]');
  if (!hero) return;
  const svg = hero.querySelector('.hv2-dia');
  const level = (window.UPMotion && window.UPMotion.level) || document.documentElement.dataset.motion || 'off';
  const { gsap, ScrollTrigger, DrawSVGPlugin } = window;

  if (level !== 'full' || !gsap || !ScrollTrigger || !DrawSVGPlugin) {
    hero.classList.add('is-ready');
    if (svg) svg.dataset.drawn = 'static';
    return;
  }
  gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin);

  const CENTER = '410 360';
  const ORBIT_RADIUS = 232;
  const SCRUB_PUSH = 70;
  const PULSE_FROM = 74;
  const PULSE_TO = 165;
  const SCRAMBLE_STEPS = 9;
  const SCRAMBLE_MS = 45;

  const one = (sel, root = hero) => root.querySelector(sel);
  const all = (sel, root = hero) => Array.from(root.querySelectorAll(sel));

  const el = {
    text: one('.hv2__text'),
    kicker: one('.hv2__kicker'),
    kline: one('.hv2__kline'),
    words: all('.hv2__w > span'),
    sub: one('.hv2__sub'),
    actions: one('.hv2__actions'),
    cue: one('.hv2__scroll'),
    stage: one('.hv2__stage'),
    tilt: one('.hv2__tilt'),
    aura: one('.hv2__aura'),
    spot: one('.hv2__spot'),
    caption: one('.hv2__caption'),
    ticks: one('.ring--ticks'),
    orbit: one('.ring--orbit'),
    inner: one('.ring--inner'),
    net: one('.hv2-net'),
    spokes: all('.spoke'),
    chords: all('.chord'),
    comets: all('.comet'),
    core: one('.hv2-core'),
    coreDisc: one('.core__disc'),
    coreGlow: one('.core__glow'),
    pulses: all('.pulse'),
    nodes: all('.node'),
    bodies: all('.node__body'),
  };

  // SVG transform origins must be identical in the from and to states, or GSAP offsets the element to compensate.
  const nodeCentre = (i, body) => {
    const disc = body.querySelector('.node__disc');
    return `${disc.getAttribute('cx')} ${disc.getAttribute('cy')}`;
  };

  // Hidden states are applied in the same tick the CSS failsafe is switched off, so nothing flashes.
  hero.classList.add('is-ready');
  gsap.set(el.comets, { autoAlpha: 0 });

  gsap.timeline({ defaults: { ease: 'power3.out' }, onComplete: startLoops })
    .fromTo(el.aura, { autoAlpha: 0, scale: 0.55 }, { autoAlpha: 1, scale: 1, duration: 1.8 }, 0)
    .fromTo(el.kicker, { autoAlpha: 0, x: -18 }, { autoAlpha: 1, x: 0, duration: 0.7 }, 0.05)
    .fromTo(el.kline, { scaleX: 0, transformOrigin: 'left center' }, { scaleX: 1, transformOrigin: 'left center', duration: 0.9 }, 0.05)
    .fromTo(el.words, { yPercent: 118 }, { yPercent: 0, duration: 1.05, ease: 'power4.out', stagger: 0.05 }, 0.1)
    .fromTo(el.sub, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.8 }, 0.6)
    .fromTo(el.actions, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.8 }, 0.75)
    .fromTo(el.orbit, { drawSVG: '50% 50%' }, { drawSVG: '0% 100%', duration: 1.5, ease: 'power2.inOut' }, 0.1)
    .fromTo(el.ticks, { autoAlpha: 0, rotation: -60, svgOrigin: CENTER }, { autoAlpha: 1, rotation: 0, svgOrigin: CENTER, duration: 1.8 }, 0.15)
    .fromTo(el.inner, { autoAlpha: 0, scale: 0.5, svgOrigin: CENTER }, { autoAlpha: 1, scale: 1, svgOrigin: CENTER, duration: 1.2 }, 0.3)
    .fromTo(el.core, { scale: 0, svgOrigin: CENTER }, { scale: 1, svgOrigin: CENTER, duration: 1, ease: 'back.out(1.6)' }, 0.3)
    .fromTo(el.spokes, { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.7, ease: 'power2.inOut', stagger: 0.1 }, 0.6)
    .fromTo(el.bodies, { autoAlpha: 0, scale: 0.3, svgOrigin: nodeCentre }, { autoAlpha: 1, scale: 1, svgOrigin: nodeCentre, duration: 0.75, ease: 'back.out(2)', stagger: 0.1 }, 1)
    .fromTo(el.chords, { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.45, ease: 'none', stagger: 0.07 }, 1.4)
    .fromTo(el.cue, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6 }, 1.7);

  let pulseIndex = 0;
  function beat() {
    const ring = el.pulses[pulseIndex % el.pulses.length];
    pulseIndex += 1;
    gsap.fromTo(ring, { attr: { r: PULSE_FROM }, autoAlpha: 0.85 }, { attr: { r: PULSE_TO }, autoAlpha: 0, duration: 1.5, ease: 'power2.out', overwrite: true });
    gsap.fromTo(el.coreGlow, { autoAlpha: 1 }, { autoAlpha: 0.6, duration: 1.1, ease: 'power2.out', overwrite: true });
    gsap.fromTo(el.coreDisc, { strokeWidth: 3.5 }, { strokeWidth: 1.5, duration: 0.7, ease: 'power2.out', overwrite: true });
  }

  function startLoops() {
    hero.classList.add('is-live');
    svg.dataset.drawn = 'true';
    gsap.to(el.ticks, { rotation: 360, svgOrigin: CENTER, duration: 140, ease: 'none', repeat: -1 });
    gsap.to(el.inner, { rotation: -360, svgOrigin: CENTER, duration: 70, ease: 'none', repeat: -1 });
    el.bodies.forEach((body, i) => {
      gsap.to(body, { y: i % 2 ? 7 : -7, duration: 2.2 + i * 0.27, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    });
    // Each comet travels from a service node into the core; the core answers with a pulse.
    el.comets.forEach((comet, i) => {
      gsap.timeline({ repeat: -1, delay: i * 0.45, repeatDelay: gsap.utils.random(0.6, 2.4) })
        .set(comet, { autoAlpha: 1, drawSVG: '0% 0%' })
        .to(comet, { drawSVG: '0% 24%', duration: 0.3, ease: 'power1.in' })
        .to(comet, { drawSVG: '76% 100%', duration: 0.85, ease: 'none' })
        .to(comet, { drawSVG: '100% 100%', duration: 0.22, ease: 'power1.out' })
        .add(beat)
        .set(comet, { autoAlpha: 0 });
    });
  }

  // Pointer: 3D tilt on the diagram + grid lit under the cursor.
  const rotX = gsap.quickTo(el.tilt, 'rotationX', { duration: 0.9, ease: 'power3' });
  const rotY = gsap.quickTo(el.tilt, 'rotationY', { duration: 0.9, ease: 'power3' });
  let frame = 0;
  let pointer = { x: 0, y: 0 };
  hero.addEventListener('pointermove', (e) => {
    const box = hero.getBoundingClientRect();
    rotY(((e.clientX - box.left) / box.width - 0.5) * 12);
    rotX(((e.clientY - box.top) / box.height - 0.5) * -9);
    pointer = { x: e.clientX - box.left, y: e.clientY - box.top };
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      el.spot.style.setProperty('--mx', `${pointer.x}px`);
      el.spot.style.setProperty('--my', `${pointer.y}px`);
    });
  }, { passive: true });
  hero.addEventListener('pointerleave', () => { rotX(0); rotY(0); });

  // Hovering a node lights its spoke and dims the rest.
  el.nodes.forEach((node) => {
    const spoke = el.spokes[Number(node.dataset.i)];
    node.addEventListener('pointerenter', () => {
      node.classList.add('is-hot');
      spoke.classList.add('is-hot');
      svg.classList.add('has-hot');
    });
    node.addEventListener('pointerleave', () => {
      node.classList.remove('is-hot');
      spoke.classList.remove('is-hot');
      svg.classList.remove('has-hot');
    });
  });

  // Scroll: hero pins, text leaves, the system moves to centre stage and opens up.
  const mm = gsap.matchMedia();
  mm.add('(min-width: 901px)', () => {
    gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: '+=80%', scrub: 0.7, pin: true, anticipatePin: 1 } })
      .to(el.text, { yPercent: -14, autoAlpha: 0, ease: 'none' }, 0)
      .to(el.cue, { autoAlpha: 0, ease: 'none', duration: 0.15 }, 0)
      .to(el.stage, { xPercent: -50, y: 48, scale: 1.04, ease: 'none' }, 0)
      .to(el.net, { scale: 1 + SCRUB_PUSH / ORBIT_RADIUS, svgOrigin: CENTER, ease: 'none' }, 0)
      .to(el.nodes, { x: (i, n) => Number(n.dataset.dx) * SCRUB_PUSH, y: (i, n) => Number(n.dataset.dy) * SCRUB_PUSH, ease: 'none' }, 0)
      .to([el.ticks, el.orbit], { scale: 1.16, svgOrigin: CENTER, ease: 'none' }, 0)
      .fromTo(el.core, { scale: 1 }, { scale: 1.14, svgOrigin: CENTER, ease: 'none', immediateRender: false }, 0)
      .fromTo(el.caption, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, ease: 'none', duration: 0.35 }, 0.55);
  });
  if (document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh());

  // Services: cards wipe up in sequence, accent line draws, number scrambles; light follows the cursor.
  const cards = all('[data-motion-own] .service-card', document);
  const scramble = (node) => {
    if (!node) return;
    const final = node.textContent;
    let step = 0;
    const id = setInterval(() => {
      step += 1;
      node.textContent = step < SCRAMBLE_STEPS ? `0${Math.floor(Math.random() * 10)}` : final;
      if (step >= SCRAMBLE_STEPS) clearInterval(id);
    }, SCRAMBLE_MS);
  };
  if (cards.length) {
    gsap.set(cards, { clipPath: 'inset(0% 0% 100% 0%)', y: 48 });
    ScrollTrigger.batch(cards, {
      start: 'top 88%',
      once: true,
      onEnter: (batch) => {
        gsap.to(batch, { clipPath: 'inset(0% 0% 0% 0%)', y: 0, duration: 1.15, ease: 'power4.out', stagger: 0.09 });
        batch.forEach((card, i) => gsap.delayedCall(0.15 + i * 0.09, () => {
          card.classList.add('is-in');
          scramble(one('.service-card__num', card));
        }));
      },
    });
    cards.forEach((card) => card.addEventListener('pointermove', (e) => {
      const box = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - box.left}px`);
      card.style.setProperty('--my', `${e.clientY - box.top}px`);
    }, { passive: true }));
  }
})();
