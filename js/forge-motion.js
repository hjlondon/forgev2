/* ==========================================================================
   FORGE V2 — MOTION SYSTEM
   Shared GSAP setup + constants. Every page includes this before forge-app.js.
   Motion should feel mechanical, precise, responsive — never bouncy or cartoonish.
   ========================================================================== */

window.FORGE = window.FORGE || {};

(function () {
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var hasGsap = typeof window.gsap !== 'undefined';
  if (hasGsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
  }

  FORGE.prefersReducedMotion = prefersReducedMotion;
  FORGE.hasGsap = hasGsap;

  /* Duration / ease constants — see css/forge.css --dur-* for the CSS-side mirror */
  FORGE.motion = {
    durFast: 0.3,      /* fast UI interactions: 0.2-0.4s */
    durStandard: 0.75, /* standard entrances: 0.6-0.9s */
    durHero: 1.1,      /* hero sequences: 0.8-1.4s */
    ease2: 'power2.out',
    ease3: 'power3.out',
    easeExpo: 'expo.out',
    stagger: 0.08,
    moveSm: 8,
    moveMd: 24,
    moveLg: 48
  };

  /**
   * Reveal-on-scroll for generic content blocks.
   * Elements must already show their real final content in the DOM
   * (accessibility / SEO / no-JS requirement) — this only animates opacity/transform.
   */
  FORGE.initReveals = function (selector) {
    var els = document.querySelectorAll(selector || '[data-reveal]');
    if (!els.length) return;

    if (prefersReducedMotion || !hasGsap) {
      els.forEach(function (el) { el.style.opacity = 1; el.style.transform = 'none'; });
      return;
    }

    els.forEach(function (el) {
      var distance = parseInt(el.dataset.revealDistance || FORGE.motion.moveMd, 10);
      gsap.set(el, { opacity: 0, y: distance });
      ScrollTrigger.create({
        trigger: el,
        start: 'top 88%',
        once: true,
        onEnter: function () {
          gsap.to(el, {
            opacity: 1,
            y: 0,
            duration: FORGE.motion.durStandard,
            ease: FORGE.motion.ease3
          });
        }
      });
    });
  };

  /**
   * Stagger-reveal for card grids.
   */
  FORGE.initStagger = function (containerSelector, itemSelector) {
    var containers = document.querySelectorAll(containerSelector);
    if (!containers.length) return;

    containers.forEach(function (container) {
      var items = container.querySelectorAll(itemSelector);
      if (!items.length) return;

      if (prefersReducedMotion || !hasGsap) {
        items.forEach(function (el) { el.style.opacity = 1; el.style.transform = 'none'; });
        return;
      }

      gsap.set(items, { opacity: 0, y: FORGE.motion.moveMd });
      ScrollTrigger.create({
        trigger: container,
        start: 'top 85%',
        once: true,
        onEnter: function () {
          gsap.to(items, {
            opacity: 1,
            y: 0,
            duration: FORGE.motion.durStandard,
            ease: FORGE.motion.ease3,
            stagger: FORGE.motion.stagger
          });
        }
      });
    });
  };
})();
