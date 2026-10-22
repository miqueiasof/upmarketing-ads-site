// Motion layer. Levels: full (desktop, fine pointer), lite (touch / weak CPU), off (reduced motion).
// Nothing on the page depends on this file to be visible.
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const weak = (navigator.hardwareConcurrency || 8) <= 4;
  const level = reduce ? 'off' : (coarse || weak) ? 'lite' : 'full';
  document.documentElement.dataset.motion = level;
  window.UPMotion = { level };

  if (level === 'off' || !window.gsap || !window.ScrollTrigger) return;
  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);

  if (level === 'full' && window.Lenis) {
    const lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    document.documentElement.style.scrollBehavior = 'auto';
  }

  // Reveals: only elements below the first viewport animate; above-the-fold content is never hidden.
  // Full motion wipes blocks in through a mask; lite fades them up.
  const fold = window.innerHeight;
  const wipe = level === 'full';
  // Opacity only (never visibility): hidden-but-pending content must stay in the accessibility tree.
  const hidden = wipe ? { clipPath: 'inset(0% 0% 100% 0%)', y: 40 } : { opacity: 0, y: 24 };
  const shown = wipe
    ? { clipPath: 'inset(0% 0% 0% 0%)', y: 0, duration: 1.1, ease: 'power4.out', clearProps: 'clipPath' }
    : { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' };
  gsap.utils.toArray('.reveal').forEach((el) => {
    if (el.getBoundingClientRect().top < fold || el.closest('[data-motion-own]')) return;
    gsap.fromTo(el, hidden, { ...shown, scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });

  if (level !== 'full') return;

  // Magnetic buttons
  gsap.utils.toArray('.btn').forEach((btn) => {
    const xTo = gsap.quickTo(btn, 'x', { duration: 0.4, ease: 'power3' });
    const yTo = gsap.quickTo(btn, 'y', { duration: 0.4, ease: 'power3' });
    btn.addEventListener('mousemove', (e) => {
      const r = btn.getBoundingClientRect();
      xTo((e.clientX - r.left - r.width / 2) * 0.22);
      yTo((e.clientY - r.top - r.height / 2) * 0.3);
    });
    btn.addEventListener('mouseleave', () => { xTo(0); yTo(0); });
  });

  // Cursor glow
  const glow = document.createElement('div');
  glow.className = 'cursor-glow';
  document.body.appendChild(glow);
  const gx = gsap.quickTo(glow, 'x', { duration: 0.5, ease: 'power3' });
  const gy = gsap.quickTo(glow, 'y', { duration: 0.5, ease: 'power3' });
  window.addEventListener('mousemove', (e) => { gx(e.clientX); gy(e.clientY); }, { passive: true });
})();
