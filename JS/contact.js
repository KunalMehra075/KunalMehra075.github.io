/* ══════════════════════════════════════════════════════════════════════
   Contact — border glow and copy-to-clipboard.

   The glow is a port of reactbits' Border Glow. Their build targets a dark
   card and stacks seven mesh gradients; here the card is white, so what is
   carried over is the behaviour rather than the palette:

     - the ring is lit at the cursor's position, fed in as --gx / --gy
     - intensity rises as the cursor nears an edge (their edgeSensitivity),
       because a border glow reads best when you are actually near the border
     - it arrives fast and leaves slowly, matching their 0.25s / 0.75s
     - an idle sweep keeps the card alive before anyone touches it, the
       equivalent of their `animated` prop

   All of the painting is CSS. This file only writes custom properties.
════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── border glow ─────────────────────────────────────────────────────── */
  (function () {
    const card = document.getElementById('contactCard');
    if (!card) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const EDGE = 0.34;        // how far in from an edge the glow starts to fall off
    const HOLD = 420;         // ms of stillness before the idle sweep takes back over

    /* Handover between cursor and idle sweep is a timestamp, not a boolean.
       An enter/leave pair is easy to miss (pointerenter does not bubble, and a
       leave can be dropped if the pointer exits fast or the element moves), and
       a single missed event left the sweep overwriting the cursor every frame. */
    let lastMove = -Infinity;
    let sweep = 0;

    function set(x, y, glow) {
      card.style.setProperty('--gx', x.toFixed(1) + 'px');
      card.style.setProperty('--gy', y.toFixed(1) + 'px');
      card.style.setProperty('--glow', glow.toFixed(3));
    }

    card.addEventListener('pointermove', (e) => {
      lastMove = performance.now();
      const r = card.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      /* Distance to the nearest edge, normalised across the card: ~0 against
         an edge, 0.5 dead centre. Inverting it makes the ring brightest right
         where the cursor is closest to it. */
      const dx = Math.min(x, r.width - x) / r.width;
      const dy = Math.min(y, r.height - y) / r.height;
      const proximity = 1 - Math.min(Math.min(dx, dy) / EDGE, 1);
      /* Written straight through rather than deferred into a rAF: pointermove
         is already delivered at about frame rate, and three custom-property
         writes are cheap. The deferred version added a scheduling race with
         the idle sweep for no benefit. */
      set(x, y, 0.45 + proximity * 0.55);
    }, { passive: true });

    card.addEventListener('pointerleave', () => {
      lastMove = -Infinity;
      card.style.setProperty('--glow', reduced ? '0' : '0.34');
    });

    /* Idle sweep: walks the light around the card's perimeter so the border is
       never completely dead, and stands down while a cursor is driving. */
    if (!reduced) {
      let t = 0;
      const idle = () => {
        if (performance.now() - lastMove > HOLD) {
          t += 0.0038;
          const r = card.getBoundingClientRect();
          if (r.width) {
            // follow the perimeter rather than an ellipse, so the light tracks
            // the real border instead of cutting across the corners
            const per = 2 * (r.width + r.height);
            const d = (t % 1) * per;
            let x, y;
            if (d < r.width) { x = d; y = 0; }
            else if (d < r.width + r.height) { x = r.width; y = d - r.width; }
            else if (d < 2 * r.width + r.height) { x = r.width - (d - r.width - r.height); y = r.height; }
            else { x = 0; y = r.height - (d - 2 * r.width - r.height); }
            set(x, y, 0.34);
          }
        }
        sweep = requestAnimationFrame(idle);
      };
      sweep = requestAnimationFrame(idle);

      // no reason to run while the section is off screen
      if ('IntersectionObserver' in window) {
        new IntersectionObserver((es) => {
          if (es[0].isIntersecting) {
            if (!sweep) sweep = requestAnimationFrame(idle);
          } else {
            cancelAnimationFrame(sweep);
            sweep = 0;
          }
        }, { rootMargin: '120px' }).observe(card);
      }
    }
  })();

  /* ── copy the email ──────────────────────────────────────────────────── */
  (function () {
    const btn = document.getElementById('emailCopy');
    if (!btn) return;
    const label = btn.querySelector('.ec-text');
    let timer = 0;

    /* Synchronous fallback. execCommand is deprecated but still the only
       thing that works without a secure context, which rules the async API
       out on plain http and inside some in-app browsers. */
    function legacyCopy(text) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      ta.remove();
      return ok;
    }

    function feedback(ok) {
      btn.classList.toggle('is-copied', ok);
      if (label) label.textContent = ok ? 'Copied' : 'Select and copy';
      clearTimeout(timer);
      timer = setTimeout(() => {
        btn.classList.remove('is-copied');
        if (label) label.textContent = 'Copy';
      }, 2000);
    }

    btn.addEventListener('click', () => {
      const text = btn.dataset.email || '';
      /* Deliberately not awaited. writeText can sit unresolved when the
         permission is neither granted nor denied, which would leave the
         button silent; fall back the moment it rejects instead. */
      if (navigator.clipboard && window.isSecureContext) {
        let settled = false;
        const done = (ok) => { if (!settled) { settled = true; feedback(ok); } };
        navigator.clipboard.writeText(text).then(
          () => done(true),
          () => done(legacyCopy(text)),
        );
        // a permission prompt that is neither granted nor dismissed leaves the
        // promise pending forever, so never let the button go silent
        setTimeout(() => done(legacyCopy(text)), 600);
      } else {
        feedback(legacyCopy(text));
      }
    });
  })();
})();
