/* ══════════════════════════════════════════════════════════════════════
   Hero — nameplate, local clock and drifting geometry.

   The glass solid itself lives in JS/hero-shader.js, which is shared with
   the hero-variant-*.html studies. This file only supplies what is specific
   to the site: what gets painted into the refracted backdrop, the live
   clock, and the ambient geometry layer.
════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const canvas = document.getElementById('hero-canvas');
  if (!canvas || typeof initHeroShader !== 'function') return;

  const NAME = 'Kunal Mehra';
  const ROLE = 'A Software Engineer';

  /* The nameplate is painted into the shader's backdrop texture so the solid
     refracts it — DOM text would sit on top and stay flat. */
  initHeroShader({
    canvas,
    section: document.getElementById('shape-hero'),
    paint(bx, w, h, u) {
      /* The name leads and the role is a secondary line beneath it. Sizing
         the two together would let the longer role string shrink the name,
         so the name is fitted to the measure and the role derived from it. */
      const maxW = w - u.gutter * 2;
      const REF = 100;
      bx.font = '800 ' + REF + 'px ' + u.face;
      const nameW = bx.measureText(NAME).width;
      const size =
        Math.min((REF * maxW) / nameW, h * (u.isNarrow ? 0.13 : 0.22)) * 0.92;

      // keep the role inside the measure too, whatever the name allowed
      bx.font = '500 ' + REF + 'px ' + u.face;
      const roleW = bx.measureText(ROLE).width;
      const roleSize = Math.min(size * 0.4, (REF * maxW) / roleW);

      bx.textAlign = 'left';
      const top = u.isNarrow ? h * 0.2 : h * 0.34;
      bx.font = '800 ' + size + 'px ' + u.face;
      bx.fillText(NAME, u.gutter, top);

      // the role drops to a dim grey — the de-emphasis used across the site
      bx.font = '500 ' + roleSize + 'px ' + u.face;
      bx.fillStyle = 'rgba(255,255,255,.38)';
      bx.fillText(ROLE, u.gutter, top + size * 0.78);
    },
  });

  /* Live local time. A small, disproportionately human detail: it says a
     person in a timezone, not a company. */
  (function () {
    const el = document.getElementById('heroClock');
    if (!el) return;
    const fmt = new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata',
    });
    const tick = () => { el.textContent = fmt.format(new Date()) + ' IST'; };
    tick();
    setInterval(tick, 15000);
  })();

  /* ── drifting geometry ────────────────────────────────────────────────
     Outlined shapes and hairlines wandering slowly across the frame. The
     WebGL pass paints an opaque black plate, so this cannot sit behind it —
     it rides just above at low opacity instead. Stroke only, no fills or
     shadows, so ~16 primitives cost close to nothing. */
  (function () {
    const cv = document.getElementById('hero-geo');
    if (!cv) return;
    const ctx = cv.getContext('2d');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const section = document.getElementById('shape-hero');
    let W = 0, H = 0, dpr = 1, items = [], running = true, rafId = 0;

    function build() {
      const KINDS = ['circle', 'square', 'triangle', 'line', 'ring'];
      const n = W < 700 ? 10 : 16;
      items = Array.from({ length: n }, (_, i) => ({
        kind: KINDS[i % KINDS.length],
        x: Math.random() * W,
        y: Math.random() * H,
        r: 18 + Math.random() * 62,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.0016,
        vx: (Math.random() - 0.5) * 0.16,
        vy: -0.05 - Math.random() * 0.16,   // a slow general drift upward
        a: 0.07 + Math.random() * 0.13,
      }));
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = cv.getBoundingClientRect();
      W = r.width; H = r.height;
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    }

    function shape(o) {
      ctx.save();
      ctx.translate(o.x, o.y);
      ctx.rotate(o.rot);
      ctx.strokeStyle = 'rgba(255,255,255,' + o.a + ')';
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (o.kind === 'circle' || o.kind === 'ring') {
        ctx.arc(0, 0, o.r, 0, Math.PI * 2);
        if (o.kind === 'ring') {
          ctx.moveTo(o.r * 0.55, 0);
          ctx.arc(0, 0, o.r * 0.55, 0, Math.PI * 2);
        }
      } else if (o.kind === 'square') {
        ctx.rect(-o.r * 0.7, -o.r * 0.7, o.r * 1.4, o.r * 1.4);
      } else if (o.kind === 'triangle') {
        ctx.moveTo(0, -o.r);
        ctx.lineTo(o.r * 0.87, o.r * 0.5);
        ctx.lineTo(-o.r * 0.87, o.r * 0.5);
        ctx.closePath();
      } else {
        ctx.moveTo(-o.r * 1.6, 0);
        ctx.lineTo(o.r * 1.6, 0);
      }
      ctx.stroke();
      ctx.restore();
    }

    function frame() {
      if (!running) return;
      ctx.clearRect(0, 0, W, H);
      for (const o of items) {
        if (!reduced) {
          o.x += o.vx; o.y += o.vy; o.rot += o.vr;
          // wrap with a margin so shapes never pop at the edge
          const m = o.r * 2;
          if (o.y < -m) { o.y = H + m; o.x = Math.random() * W; }
          if (o.x < -m) o.x = W + m;
          if (o.x > W + m) o.x = -m;
        }
        shape(o);
      }
      rafId = requestAnimationFrame(frame);
    }

    // no reason to animate this once the hero is scrolled away
    if ('IntersectionObserver' in window && section) {
      new IntersectionObserver((es) => {
        const vis = es[0].isIntersecting;
        if (vis === running) return;
        running = vis;
        if (running) rafId = requestAnimationFrame(frame);
        else cancelAnimationFrame(rafId);
      }, { rootMargin: '80px' }).observe(section);
    }

    window.addEventListener('resize', resize);
    resize();
    rafId = requestAnimationFrame(frame);
  })();
})();
