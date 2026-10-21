// Draws the hero "sales system" diagram: nodes pop in, edges draw themselves,
// then the edges keep a slow pulse. Requires gsap + DrawSVGPlugin on window.
window.playHeroDiagram = function playHeroDiagram(svg, level) {
  const edges = Array.from(svg.querySelectorAll('.edge'));
  const nodes = Array.from(svg.querySelectorAll('.node'));
  if (level !== 'full' || !window.gsap || !window.DrawSVGPlugin) {
    svg.dataset.drawn = 'static';
    return;
  }
  const { gsap } = window;
  gsap.registerPlugin(window.DrawSVGPlugin);

  const pulse = () => {
    gsap.to(edges, {
      opacity: 0.35,
      duration: 1.6,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
      stagger: { each: 0.18, from: 'random' },
    });
  };

  gsap.timeline({ defaults: { ease: 'power3.out' }, onComplete: () => { svg.dataset.drawn = 'true'; pulse(); } })
    .set(nodes, { transformOrigin: '50% 50%' })
    .fromTo(edges, { drawSVG: '0%' }, { drawSVG: '100%', duration: 1.2, stagger: 0.08, ease: 'power2.inOut' }, 0.2)
    .fromTo(nodes, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.7, stagger: 0.08, ease: 'back.out(1.6)' }, 0);
};
