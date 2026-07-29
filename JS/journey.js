/* ══════════════════════════════════════════════════════════════════════
   Journey — the experience section.

   Two builds from one dataset:

     desktop  a serpentine SVG path with cards alternating either side. The
              path is generated from the data, so it adapts to the number of
              stops and to the viewport rather than being hand-drawn.
     mobile   a straight rail with square cards all on one side. Trying to
              squeeze the serpentine into a phone width produced a curve with
              nowhere to go, so below 768px a separate block takes over and
              the SVG one is hidden outright.

   Both are driven by the same scroll progress: the line fills, and each stop
   lights up as the fill reaches it.
════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const STOPS = [
    {
      year: '2022', role: 'Full Stack Trainee', co: 'Masai School, Bengaluru',
      date: 'Aug 2022 - May 2023', badge: 'Education',
      logo: 'Images/companies/masai_logo.jpeg',
      points: [
        '1200+ hours of hands on coding and 800+ DSA problems solved.',
        'Mastered the MERN stack, TypeScript and UI frameworks.',
      ],
    },
    {
      year: '2023', role: 'Engineering Fellow', co: 'Pesto Tech, Remote',
      date: 'Jul 2023 - Sept 2024', badge: 'Fellowship',
      logo: 'Images/companies/PestoTech_Logo.jpeg',
      points: [
        '10 month intensive MERN stack program.',
        'Led a team of 5 building a Hospital Management System.',
      ],
    },
    {
      year: '2023', role: 'Software Developer', co: '86 Agency, Gurugram',
      date: 'Jun 2023 - Jun 2025', badge: 'Work',
      logo: 'Images/companies/86agency_logo.jpeg',
      points: [
        'Built 20+ web apps with React, Node.js, Python and Django.',
        'Shipped Apple and Google Passes for 3 international clients.',
        'Managed 15+ AWS deployments with Docker and Jenkins.',
      ],
    },
    {
      year: '2025', role: 'B.C.A, Computer Applications', co: 'KL University, A.P.',
      date: '2025 - 2028', badge: 'Education',
      logo: 'Images/companies/kluniversity_logo.jpeg',
      points: ['Bachelor of Computer Applications, alongside full time work.'],
    },
    {
      year: '2025', role: 'Software Engineer', co: 'OneIOT, Hyderabad',
      date: 'Jun 2025 - Jan 2026', badge: 'Work',
      logo: 'Images/companies/oneiot_logo.jpeg',
      points: [
        'Led full stack feature work across web and mobile portals.',
        'Delivered 4 to 5 proof of concepts in 1 to 2 days each.',
        'Led the MongoDB to CassandraDB migration for high volume data.',
      ],
    },
    {
      year: '2026', role: 'Software Engineer', co: 'The Factual Holding Co.',
      date: 'Jan 2026 - Present', badge: 'Current', now: true,
      logo: 'Images/companies/factual_logo.png',
      points: [
        'Built telehealth infrastructure connecting a doctor network to B2B brands.',
        'Owned a project end to end on Redis, Kafka and Postgres.',
        'Designed an AI image and video platform with multi-provider fallbacks.',
      ],
    },
  ];

  const wrap = document.getElementById('jrWrap');
  const mob  = document.getElementById('jrMobile');
  if (!wrap || !mob) return;

  const svg   = document.getElementById('jrSvg');
  const track = document.getElementById('jrTrack');
  const glow  = document.getElementById('jrGlow');
  const fill  = document.getElementById('jrFill');
  const leads = document.getElementById('jrLeads');
  const head  = document.getElementById('jrHead');

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const cardInner = (s) =>
    '<div class="jr-aside">' +
      '<div class="jr-logo"><img src="' + s.logo + '" alt="" loading="lazy" ' +
        'onerror="this.style.display=\'none\'"/></div>' +
      '<span class="jr-badge' + (s.now ? ' now' : '') + '">' + s.badge + '</span>' +
    '</div>' +
    '<div class="jr-body">' +
      '<div class="jr-top">' +
        '<div class="jr-role">' + s.role + '</div>' +
        '<div class="jr-co">' + s.co + '</div>' +
      '</div>' +
      '<div class="jr-date">' + s.date + '</div>' +
      '<ul class="jr-list">' + s.points.map((p) => '<li>' + p + '</li>').join('') + '</ul>' +
    '</div>';

  /* ── desktop build ─────────────────────────────────────────────────── */
  const items = STOPS.map((s) => {
    const el = document.createElement('div');
    el.className = 'jr-item';
    el.innerHTML =
      '<span class="jr-node"></span>' +
      '<span class="jr-year">' + s.year + '</span>' +
      '<div class="jr-card">' + cardInner(s) + '</div>';
    wrap.appendChild(el);
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.innerHTML = '<path class="jr-lead"/><path class="jr-lead"/>';
    leads.appendChild(g);
    return {
      root: el, node: el.querySelector('.jr-node'), year: el.querySelector('.jr-year'),
      card: el.querySelector('.jr-card'), lead: g, t: 0,
    };
  });

  /* ── mobile build ──────────────────────────────────────────────────── */
  const mItems = STOPS.map((s) => {
    const el = document.createElement('div');
    el.className = 'jm-item';
    el.innerHTML =
      '<span class="jm-dot"></span>' +
      '<div class="jm-card">' +
        '<span class="jm-year">' + s.year + '</span>' +
        cardInner(s) +
      '</div>';
    mob.appendChild(el);
    return { root: el, t: 0 };
  });
  const mFill = document.getElementById('jrMobFill');

  let pathLen = 0;
  let isNarrow = false;

  function layout() {
    isNarrow = window.matchMedia('(max-width:768px)').matches;

    // ── mobile: where each card sits down the rail, as a 0..1 fraction ──
    const mh = mob.offsetHeight || 1;
    mItems.forEach((it) => {
      it.t = clamp((it.root.offsetTop + it.root.offsetHeight * 0.4) / mh, 0, 1);
    });
    if (isNarrow) return;   // the SVG is display:none, so measuring it is moot

    const W = wrap.clientWidth;
    /* padBot is deliberately generous. The last stop only lights up at ~90%
       of the way through the wrap, so without room beneath it the card was
       still arriving as the next section pushed into view. */
    const segH = 300, padTop = 96, padBot = 250;
    const total = padTop + segH * (STOPS.length - 1) + padBot;

    wrap.style.height = total + 'px';
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + total);

    const pts = STOPS.map((_, i) => ({
      x: i % 2 === 0 ? W * 0.36 : W * 0.64,
      y: padTop + i * segH,
    }));

    /* Lead-in and tail. These used to kick sideways by 70px over a short
       105px rise, which hooked the ends into a thread-like squiggle. Now
       they rise much further with only a slight lateral drift, so the line
       enters and leaves the frame travelling almost straight. */
    const first = pts[0], last = pts[pts.length - 1];
    const all = [
      { x: first.x + (first.x < W / 2 ? 22 : -22), y: first.y - 168 },
      ...pts,
      { x: last.x + (last.x < W / 2 ? 22 : -22), y: last.y + 178 },
    ];

    let d = 'M ' + all[0].x + ' ' + all[0].y;
    for (let i = 1; i < all.length; i++) {
      const p0 = all[i - 1], p1 = all[i];
      const k = (p1.y - p0.y) * 0.5;
      d += ' C ' + p0.x + ' ' + (p0.y + k) + ', ' + p1.x + ' ' + (p1.y - k) +
           ', ' + p1.x + ' ' + p1.y;
    }
    [track, glow, fill].forEach((p) => p.setAttribute('d', d));

    pathLen = track.getTotalLength();
    [glow, fill].forEach((p) => {
      p.style.strokeDasharray = pathLen;
      p.style.strokeDashoffset = pathLen;
    });

    /* Each node's position along the path, found by bisecting on y rather
       than kept as a hand-maintained table of offsets. */
    items.forEach((it, i) => {
      let lo = 0, hi = pathLen;
      for (let n = 0; n < 22; n++) {
        const mid = (lo + hi) / 2;
        if (track.getPointAtLength(mid).y < pts[i].y) lo = mid; else hi = mid;
      }
      it.t = ((lo + hi) / 2) / pathLen;
    });

    const cardW = Math.min(W * 0.50, 580);
    items.forEach((it, i) => {
      const p = pts[i];
      const right = i % 2 === 0;
      it.root.className = 'jr-item ' + (right ? 'side-r' : 'side-l') +
        (it.root.classList.contains('is-in') ? ' is-in' : '');

      it.node.style.left = p.x + 'px';
      it.node.style.top = p.y + 'px';
      it.year.style.top = p.y + 'px';
      if (right) { it.year.style.left = 'auto'; it.year.style.right = (W - p.x + 24) + 'px'; }
      else       { it.year.style.right = 'auto'; it.year.style.left = (p.x + 24) + 'px'; }

      const card = it.card;
      card.style.width = cardW + 'px';
      const gap = 54;
      if (right) { card.style.left = (p.x + gap) + 'px'; card.style.right = 'auto'; }
      else       { card.style.right = (W - p.x + gap) + 'px'; card.style.left = 'auto'; }

      const h = card.offsetHeight;
      card.style.top = (p.y - h / 2) + 'px';

      const edgeX = right ? p.x + gap : p.x - gap;
      const [l1, l2] = it.lead.querySelectorAll('.jr-lead');
      l1.setAttribute('d', 'M ' + p.x + ' ' + p.y + ' L ' + edgeX + ' ' + (p.y - h / 2 + 28));
      l2.setAttribute('d', 'M ' + p.x + ' ' + p.y + ' L ' + edgeX + ' ' + (p.y + h / 2 - 28));
    });
  }

  function onScroll() {
    const host = isNarrow ? mob : wrap;
    const r = host.getBoundingClientRect();
    const vh = window.innerHeight;
    /* endAt is where the block's BOTTOM sits when the fill completes. At
       0.22vh the wrap was almost scrolled past before the last stop lit up,
       so it landed with the next section already on screen. Finishing while
       the bottom is still near the fold reveals everything earlier. */
    const startAt = vh * 0.74, endAt = vh * 0.90;
    const p = clamp((startAt - r.top) / (r.height + startAt - endAt), 0, 1);

    if (isNarrow) {
      if (mFill) mFill.style.height = (p * 100).toFixed(2) + '%';
      mItems.forEach((it) => it.root.classList.toggle('is-in', p >= it.t - 0.02));
      return;
    }

    const drawn = pathLen * p;
    glow.style.strokeDashoffset = pathLen - drawn;
    fill.style.strokeDashoffset = pathLen - drawn;

    if (p > 0.001 && p < 0.999) {
      const pt = track.getPointAtLength(drawn);
      head.setAttribute('cx', pt.x);
      head.setAttribute('cy', pt.y);
      head.style.opacity = 1;
    } else {
      head.style.opacity = 0;
    }
    items.forEach((it) => it.root.classList.toggle('is-in', p >= it.t - 0.015));
  }

  let ticking = false;
  function tick() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { onScroll(); ticking = false; });
  }

  window.addEventListener('scroll', tick, { passive: true });
  window.addEventListener('resize', () => {
    layout(); onScroll();
    if (window.__jrSizeGeo) window.__jrSizeGeo();
  });

  /* ══ drifting geometry ══════════════════════════════════════════════
     Outlined shapes wandering slowly behind the line so the white field is
     not just empty. Stroke only, no fills or shadows, so ~15 primitives cost
     close to nothing, and it stops entirely when the section is off screen.
     The canvas is sized to the section's full height rather than the
     viewport, because the section is far taller than one screen. */
  (function () {
    const cv = document.getElementById('jrGeo');
    if (!cv) return;
    const ctx = cv.getContext('2d');
    const host = document.getElementById('experience');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let W = 0, H = 0, shapes = [], running = true, geoRaf = 0;

    function build() {
      const KINDS = ['circle', 'square', 'triangle', 'line', 'ring'];
      const n = W < 700 ? 9 : 15;
      shapes = Array.from({ length: n }, (_, i) => ({
        kind: KINDS[i % KINDS.length],
        x: Math.random() * W, y: Math.random() * H,
        r: 22 + Math.random() * 78,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.0014,
        vx: (Math.random() - 0.5) * 0.14,
        vy: -0.04 - Math.random() * 0.13,
        a: 0.05 + Math.random() * 0.07,
      }));
    }

    function sizeGeo() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = host.clientWidth;
      H = host.offsetHeight;
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    }

    function draw(o) {
      ctx.save();
      ctx.translate(o.x, o.y);
      ctx.rotate(o.rot);
      ctx.strokeStyle = 'rgba(0,0,0,' + o.a + ')';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      if (o.kind === 'circle' || o.kind === 'ring') {
        ctx.arc(0, 0, o.r, 0, Math.PI * 2);
        if (o.kind === 'ring') { ctx.moveTo(o.r * 0.55, 0); ctx.arc(0, 0, o.r * 0.55, 0, Math.PI * 2); }
      } else if (o.kind === 'square') {
        ctx.rect(-o.r * 0.7, -o.r * 0.7, o.r * 1.4, o.r * 1.4);
      } else if (o.kind === 'triangle') {
        ctx.moveTo(0, -o.r); ctx.lineTo(o.r * 0.87, o.r * 0.5);
        ctx.lineTo(-o.r * 0.87, o.r * 0.5); ctx.closePath();
      } else {
        ctx.moveTo(-o.r * 1.6, 0); ctx.lineTo(o.r * 1.6, 0);
      }
      ctx.stroke();
      ctx.restore();
    }

    function geoFrame() {
      if (!running) return;
      ctx.clearRect(0, 0, W, H);
      for (const o of shapes) {
        if (!reduced) {
          o.x += o.vx; o.y += o.vy; o.rot += o.vr;
          const m = o.r * 2;                     // wrap with margin, never pop
          if (o.y < -m) { o.y = H + m; o.x = Math.random() * W; }
          if (o.x < -m) o.x = W + m;
          if (o.x > W + m) o.x = -m;
        }
        draw(o);
      }
      geoRaf = requestAnimationFrame(geoFrame);
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver((es) => {
        const vis = es[0].isIntersecting;
        if (vis === running) return;
        running = vis;
        if (running) geoRaf = requestAnimationFrame(geoFrame);
        else cancelAnimationFrame(geoRaf);
      }, { rootMargin: '150px' }).observe(host);
    }

    window.addEventListener('resize', sizeGeo);
    // the section's height is set by layout(), so re-measure after each pass
    window.__jrSizeGeo = sizeGeo;
    sizeGeo();
    geoRaf = requestAnimationFrame(geoFrame);
  })();

  layout();
  onScroll();
  if (window.__jrSizeGeo) window.__jrSizeGeo();
  // card heights move once the webfont swaps in, and every position is
  // measured from them
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      layout(); onScroll();
      if (window.__jrSizeGeo) window.__jrSizeGeo();
    });
  }
})();
