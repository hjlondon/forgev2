/* ==========================================================================
   FORGE V2 — COMPONENT INITIALIZERS
   Each function checks for its own markup before running, so this single file
   can be included on every page without per-page branching.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', function () {
  initMobileNav();
  initCounters();
  initHeroPlayers();
  initSelectPlayer();
  initPipeline();
  initEmptyBay();
  FORGE.initReveals('[data-reveal]');
  FORGE.initStagger('[data-stagger]', ':scope > *');
});

/* -------------------------------------------------------------------------
   Mobile navigation
   ------------------------------------------------------------------------- */
function initMobileNav() {
  var toggle = document.querySelector('.nav-toggle');
  var panel = document.querySelector('.mobile-nav');
  var closeBtn = document.querySelector('.mobile-nav-close');
  if (!toggle || !panel) return;

  function open() {
    panel.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    if (FORGE.hasGsap && !FORGE.prefersReducedMotion) {
      gsap.fromTo(panel.querySelectorAll('.mobile-nav-links a, .mobile-nav .btn'),
        { opacity: 0, y: FORGE.motion.moveSm },
        { opacity: 1, y: 0, duration: FORGE.motion.durFast, stagger: 0.05, ease: FORGE.motion.ease2 });
    }
  }
  function close() {
    panel.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  toggle.addEventListener('click', open);
  if (closeBtn) closeBtn.addEventListener('click', close);
  panel.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', close); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') close();
  });
}

/* -------------------------------------------------------------------------
   Production Proof — count-up counters.
   IMPORTANT: DOM already contains the real final value (e.g. "100+").
   JS only animates the visual count; it restores the exact original text.
   ------------------------------------------------------------------------- */
function initCounters() {
  var nums = document.querySelectorAll('.stat .num[data-target]');
  if (!nums.length) return;

  function animate(el) {
    var target = parseFloat(el.dataset.target);
    var suffix = el.dataset.suffix || '';
    var finalText = el.textContent;
    if (isNaN(target)) return;

    var duration = FORGE.hasGsap ? 1600 : 0;
    var start = null;

    function step(ts) {
      if (start === null) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target) + suffix;
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = finalText;
      }
    }

    if (FORGE.prefersReducedMotion || !duration) {
      el.textContent = finalText;
      return;
    }
    requestAnimationFrame(step);
  }

  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animate(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    nums.forEach(function (el) { observer.observe(el); });
  }
}

/* -------------------------------------------------------------------------
   Hero — PLAYER 1..4 rotation.
   Initial DOM state is Player 1 (real, crawlable content). JS cross-fades
   through the remaining players and loops; pauses on hover/focus.
   ------------------------------------------------------------------------- */
function initHeroPlayers() {
  var root = document.querySelector('[data-hero-players]');
  if (!root) return;

  var players = JSON.parse(root.getAttribute('data-hero-players'));
  var tagEl = root.querySelector('.player-tag');
  var headingEl = root.querySelector('h1');
  var accentEl = headingEl ? headingEl.querySelector('.accent') : null;
  var dots = root.querySelectorAll('.hero-dots button');
  var index = 0;
  var timer = null;
  var interval = 4200;

  function render(i) {
    var p = players[i];
    if (tagEl) tagEl.textContent = 'PLAYER ' + (i + 1);
    if (headingEl && accentEl) {
      headingEl.childNodes[0].nodeValue = p.pre + ' ';
      accentEl.textContent = p.accent;
    }
    dots.forEach(function (d, di) { d.setAttribute('aria-current', di === i ? 'true' : 'false'); });
  }

  function goTo(i) {
    index = i;
    if (FORGE.prefersReducedMotion || !FORGE.hasGsap) {
      render(index);
      return;
    }
    gsap.timeline()
      .to(headingEl, { opacity: 0, y: -FORGE.motion.moveSm, duration: FORGE.motion.durFast * 0.6, ease: FORGE.motion.ease2 })
      .call(function () { render(index); })
      .to(headingEl, { opacity: 1, y: 0, duration: FORGE.motion.durFast, ease: FORGE.motion.ease2 });
  }

  function next() { goTo((index + 1) % players.length); }

  function start() {
    if (FORGE.prefersReducedMotion) return;
    stop();
    timer = setInterval(next, interval);
  }
  function stop() { if (timer) clearInterval(timer); }

  dots.forEach(function (d, i) {
    d.addEventListener('click', function () { goTo(i); start(); });
  });

  root.addEventListener('mouseenter', stop);
  root.addEventListener('mouseleave', start);
  root.addEventListener('focusin', stop);
  root.addEventListener('focusout', start);

  start();
}

/* -------------------------------------------------------------------------
   Select Your Player — hover/focus micro-interaction on the trade tiles.
   The role list and CTA are already in the DOM (no content is hidden);
   this only adds a small icon "pulse" on interaction.
   ------------------------------------------------------------------------- */
function initSelectPlayer() {
  var cards = document.querySelectorAll('.player-card');
  if (!cards.length || FORGE.prefersReducedMotion || !FORGE.hasGsap) return;

  cards.forEach(function (card) {
    var icon = card.querySelector('.p-icon');
    if (!icon) return;
    var tween;

    function play() {
      if (tween) tween.kill();
      tween = gsap.fromTo(icon, { scale: 1 }, { scale: 1.08, duration: FORGE.motion.durFast, ease: FORGE.motion.ease2, yoyo: true, repeat: 1 });
    }

    card.addEventListener('mouseenter', play);
    card.addEventListener('focus', play);
  });
}

/* -------------------------------------------------------------------------
   Vacancy -> Shop Floor pipeline.
   Desktop: pinned, scrub-driven progress line + active marker.
   Mobile: simple per-step reveal, no pin.
   ------------------------------------------------------------------------- */
function initPipeline() {
  var section = document.querySelector('[data-pipeline]');
  if (!section) return;
  var steps = section.querySelectorAll('.pipeline-step');
  var fill = section.querySelector('.pipeline-line-fill');

  if (FORGE.prefersReducedMotion || !FORGE.hasGsap) {
    steps.forEach(function (s) { s.classList.add('is-active'); });
    if (fill) fill.style.width = '100%';
    return;
  }

  if (window.matchMedia('(min-width: 901px)').matches) {
    ScrollTrigger.create({
      trigger: section,
      start: 'top top+=80',
      end: '+=' + (steps.length * 260),
      pin: true,
      scrub: 0.4,
      onUpdate: function (self) {
        var progress = self.progress;
        if (fill) fill.style.width = (progress * 100) + '%';
        var activeIndex = Math.min(steps.length - 1, Math.floor(progress * steps.length));
        steps.forEach(function (s, i) {
          s.classList.toggle('is-active', i <= activeIndex);
        });
      }
    });
  } else {
    steps.forEach(function (s) {
      ScrollTrigger.create({
        trigger: s,
        start: 'top 75%',
        once: true,
        onEnter: function () { s.classList.add('is-active'); }
      });
    });
  }
}

/* -------------------------------------------------------------------------
   Empty Bay -> Production Active.
   Reduced motion / no GSAP: jump straight to the resolved "active" state.
   ------------------------------------------------------------------------- */
function initEmptyBay() {
  var station = document.querySelector('[data-bay-station]');
  if (!station) return;
  var pill = document.querySelector('[data-bay-status]');

  function setActive(active) {
    station.classList.toggle('is-active', active);
    if (pill) {
      pill.textContent = active ? 'PRODUCTION ACTIVE' : 'OFFLINE';
      pill.classList.toggle('is-active', active);
      pill.classList.toggle('is-offline', !active);
    }
  }

  if (FORGE.prefersReducedMotion || !FORGE.hasGsap) {
    setActive(true);
    return;
  }

  setActive(false);
  ScrollTrigger.create({
    trigger: station,
    start: 'top 70%',
    once: true,
    onEnter: function () { setActive(true); }
  });
}
