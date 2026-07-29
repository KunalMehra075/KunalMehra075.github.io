/* ════════════════════════════════════════════════════════════════════
   Experience & Education — interactive area chart
   Renders each role/degree as a smooth gradient "hill" along a shared
   time axis. Hover a hill → it highlights, the rest fade, and a tooltip
   with full details opens. Work = blue gradient, Education = green.
═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // ── Data (chronological). start/end are fractional years. ──────────
  const XP = [
    {
      cat: 'edu', name: 'Masai School', role: 'Full Stack Trainee',
      loc: 'Bengaluru, KA', logo: 'Images/journey/masai-logo.webp',
      start: 2022.62, end: 2023.42, label: 'Aug 2022 – May 2023',
      dur: '9 mos', type: 'Education',
      bullets: [
        '1200+ hours hands-on coding, 800+ DSA problems solved.',
        'Mastered MERN stack, TypeScript, and UI frameworks.'
      ]
    },
    {
      cat: 'work', name: '86 Agency', role: 'Software Developer',
      loc: 'Gurugram, HR', logo: 'Images/journey/86agency-logo.webp',
      start: 2023.42, end: 2025.42, label: 'Jun 2023 – Jun 2025',
      dur: '2 yrs', type: 'Work',
      bullets: [
        'Built 20+ web apps with React, Node.js, Python and Django.',
        'Integrated Apple & Google Passes for 3 international clients.',
        'Completed wallet integration in 2 months vs. planned 4.',
        'Built React Native video call app with WebSocket messaging.',
        'Managed 15+ AWS deployments with Docker and Jenkins CI/CD.'
      ]
    },
    {
      cat: 'edu', name: 'Pesto Tech', role: 'Engineering Fellow',
      loc: 'Remote, San Francisco', logo: 'Images/journey/pestotech-logo.webp',
      start: 2023.50, end: 2024.75, label: 'Jul 2023 – Sept 2024',
      dur: '1 yr 2 mos', type: 'Fellowship',
      bullets: [
        '10-month intensive MERN-stack engineering program.',
        'Led a team of 5 building a Hospital Management System.'
      ]
    },
    {
      cat: 'work', name: 'OneIOT', role: 'Software Engineer',
      loc: 'Hyderabad, TS', logo: 'Images/journey/oneiot-logo.webp',
      start: 2025.42, end: 2026.00, label: 'Jun 2025 – Jan 2026',
      dur: '8 mos', type: 'Work',
      bullets: [
        'Led full-stack feature development across web and mobile portals.',
        'Delivered 4–5 PoC projects in 1–2 days each for client demos.',
        'Integrated a custom reporting dashboard in React Web & Native.',
        'Led MongoDB → CassandraDB migration for high-volume data.',
        'Migrated frontend to ShadCN/Recharts, integrated 3D Digital Twin.'
      ]
    },
    {
      cat: 'work', name: 'Bizmorphic Research', role: 'Software Engineer',
      loc: 'Bizmorphic Research', logo: 'Images/archive/companies/bizmorphic_research_logo.jpeg',
      start: 2026.00, end: 2026.42, label: 'Jan 2026 – May 2026',
      dur: '5 mos', type: 'Work',
      bullets: ['Role details coming soon.']
    },
    {
      cat: 'work', name: 'Chapter', role: 'Software Engineer',
      logo: 'Images/archive/companies/chapter_logo.png',
      loc: 'Co-founded startup', start: 2026.08, end: 2026.42,
      label: 'Feb 2026 – Jun 2026', dur: '5 mos', type: 'Work',
      bullets: [
        'Co-founded the startup with two friends; later stepped away.',
        'More details coming soon.'
      ]
    },
    {
      cat: 'work', name: 'The Factual', role: 'Software Engineer',
      logo: 'Images/journey/factual-logo.webp',
      loc: 'The Factual Holding Co.', start: 2026.42, end: 2026.46,
      label: 'Jun 2026 – Present', dur: 'New', type: 'Work', current: true,
      bullets: ['Role details coming soon.']
    },
    {
      cat: 'edu', name: 'KL University', role: 'B.C.A — Computer Applications',
      loc: 'Andhra Pradesh', logo: 'Images/journey/kluniversity-logo.webp',
      start: 2025.00, end: 2028.95, label: '2025 – 2028',
      dur: '3 yrs', type: 'Education',
      bullets: [
        'Bachelor of Computer Applications.',
        'Focus on software engineering, systems & data structures.'
      ]
    }
  ];

  // Axis ends at "now" (mid-2026). In-progress spans (current role, ongoing
  // degree) are clamped to this edge so the chart stops at the present.
  const X_MIN = 2022, X_MAX = 2026.7;
  const MIN_SPAN = 0.22; // shortest visible hill width, in years
  const SVG_NS = 'http://www.w3.org/2000/svg';

  const COLOR = {
    work: { stroke: '#0d42f2', top: 'rgba(13,66,242,.55)', mid: 'rgba(13,66,242,.16)', dot: '#0d42f2' },
    edu:  { stroke: '#0db4f2', top: 'rgba(13,180,242,.50)', mid: 'rgba(13,180,242,.14)', dot: '#0db4f2' }
  };
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  let stage, svg, tooltip, track;
  let active = -1;

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function el(tag, attrs, ns) {
    const node = ns ? document.createElementNS(SVG_NS, tag) : document.createElement(tag);
    for (const k in attrs) node.setAttribute(k, attrs[k]);
    return node;
  }

  // Build a smooth half-sine "hill" filled area path + its top stroke path.
  function hillPaths(x0, x1, baseY, amp) {
    const steps = 56, w = x1 - x0;
    let top = '';
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = x0 + t * w;
      // sin^1.15 gives a slightly rounder crown, like shadcn area charts
      const y = baseY - amp * Math.pow(Math.sin(Math.PI * t), 1.15);
      top += (i === 0 ? 'M' : 'L') + x.toFixed(2) + ' ' + y.toFixed(2) + ' ';
    }
    const area = 'M' + x0.toFixed(2) + ' ' + baseY.toFixed(2) + ' ' +
                 top.slice(1) + 'L' + x1.toFixed(2) + ' ' + baseY.toFixed(2) + ' Z';
    return { area, top: top.trim() };
  }

  function render() {
    if (!stage) return;
    stage.querySelectorAll('.xp-peak').forEach(n => n.remove());

    // width is data-driven so each month gets real room; scrolls when it
    // exceeds the visible card.
    const PPY = 384; // px per year
    const avail = track ? track.clientWidth : stage.clientWidth;
    const W = Math.max(avail, Math.round((X_MAX - X_MIN) * PPY));
    stage.style.width = W + 'px';
    const H = stage.clientHeight;
    const padT = 54, padB = 46, padL = 24, padR = 28;
    const baseY = H - padB, chartH = baseY - padT;
    const innerW = W - padL - padR;

    const xPix = y => padL + ((y - X_MIN) / (X_MAX - X_MIN)) * innerW;

    // fresh svg
    svg = el('svg', { class: 'xp-chart-svg', width: W, height: H,
      viewBox: '0 0 ' + W + ' ' + H }, true);

    // gradients
    const defs = el('defs', {}, true);
    ['work', 'edu'].forEach(cat => {
      const g = el('linearGradient', { id: 'xpg-' + cat, x1: 0, y1: 0, x2: 0, y2: 1 }, true);
      const c = COLOR[cat];
      [[0, c.top], [0.55, c.mid], [1, 'rgba(255,255,255,0)']].forEach(([o, col]) => {
        g.appendChild(el('stop', { offset: o, 'stop-color': col }, true));
      });
      defs.appendChild(g);
    });
    svg.appendChild(defs);

    // axis: baseline, year gridlines + bold year labels, month ticks + labels
    const axis = el('g', { class: 'xp-axis' }, true);
    axis.appendChild(el('line', { x1: padL, y1: baseY, x2: W - padR, y2: baseY, class: 'xp-baseline' }, true));

    const totalMonths = Math.round((X_MAX - X_MIN) * 12);
    const pxPerMonth = innerW / ((X_MAX - X_MIN) * 12);
    const monthStep = pxPerMonth >= 30 ? 1 : (pxPerMonth >= 16 ? 3 : 0);

    for (let m = 0; m <= totalMonths; m++) {
      const yr = X_MIN + m / 12;
      if (yr > X_MAX + 1e-6) break;
      const x = xPix(yr);
      const isYear = (m % 12 === 0);
      if (isYear) {
        axis.appendChild(el('line', { x1: x, y1: padT - 10, x2: x, y2: baseY, class: 'xp-grid' }, true));
        const yl = el('text', { x: x, y: baseY + 36, class: 'xp-tick xp-tick-year', 'text-anchor': 'middle' }, true);
        yl.textContent = Math.round(yr);
        axis.appendChild(yl);
      }
      axis.appendChild(el('line', { x1: x, y1: baseY, x2: x, y2: baseY + 6, class: 'xp-mtick' }, true));
      if (monthStep && !isYear && m % monthStep === 0) {
        const ml = el('text', { x: x, y: baseY + 17, class: 'xp-tick xp-tick-month', 'text-anchor': 'middle' }, true);
        ml.textContent = MONTHS[((m % 12) + 12) % 12];
        axis.appendChild(ml);
      }
    }
    svg.appendChild(axis);

    // precompute geometry — clamp spans to the visible [X_MIN, X_MAX] window,
    // and give very short stints a minimum width so they stay visible. The
    // hill is anchored at the real start and grown forward, so a just-started
    // role reads from its true month (only pushed back if it hits the edge).
    XP.forEach(d => {
      let s = Math.max(d.start, X_MIN), e = Math.min(d.end, X_MAX);
      if (e - s < MIN_SPAN) {
        e = s + MIN_SPAN;
        if (e > X_MAX) { e = X_MAX; s = Math.max(X_MIN, e - MIN_SPAN); }
      }
      d._x0 = xPix(s);
      d._x1 = xPix(e);
      d._xc = (d._x0 + d._x1) / 2;
      d._frac = clamp(0.44 + 0.13 * Math.sqrt(e - s), 0.44, 0.72);
      d._amp = d._frac * chartH;
      d._peakY = baseY - d._amp;
    });

    // draw widest first so narrow hills + labels sit on top
    const order = XP.map((d, i) => i).sort((a, b) =>
      (XP[b]._x1 - XP[b]._x0) - (XP[a]._x1 - XP[a]._x0));

    order.forEach(i => {
      const d = XP[i], c = COLOR[d.cat];
      const p = hillPaths(d._x0, d._x1, baseY, d._amp);
      const g = el('g', { class: 'xp-hill', 'data-i': i }, true);

      g.appendChild(el('path', { class: 'xp-area', d: p.area, fill: 'url(#xpg-' + d.cat + ')' }, true));
      g.appendChild(el('path', { class: 'xp-line', d: p.top, fill: 'none', stroke: c.stroke }, true));
      g.appendChild(el('line', { class: 'xp-guide', x1: d._xc, y1: d._peakY, x2: d._xc, y2: baseY, stroke: c.stroke }, true));
      g.appendChild(el('circle', { class: 'xp-peakdot', cx: d._xc, cy: d._peakY, r: 5, fill: c.stroke }, true));

      g.addEventListener('mouseenter', () => setActive(i));
      g.addEventListener('mousemove', () => setActive(i));
      g.addEventListener('mouseleave', clearActive);
      svg.appendChild(g);
    });

    const oldSvg = stage.querySelector('.xp-chart-svg');
    if (oldSvg) oldSvg.remove();
    stage.appendChild(svg);

    // HTML peak labels (logo + name + duration pill)
    XP.forEach((d, i) => {
      const lab = el('div', { class: 'xp-peak xp-peak-' + d.cat, 'data-i': i });
      lab.style.left = d._xc + 'px';
      lab.style.top = d._peakY + 'px';
      const media = d.logo
        ? '<img src="' + d.logo + '" alt="" loading="lazy"/>'
        : '<span class="xp-peak-init xp-init-' + d.cat + '">' + d.init + '</span>';
      lab.innerHTML = media +
        '<span class="xp-peak-name">' + d.name + '</span>' +
        '<span class="xp-peak-dur">' + d.dur + '</span>';
      lab.addEventListener('mouseenter', () => setActive(i));
      lab.addEventListener('mouseleave', clearActive);
      stage.appendChild(lab);
    });

    deCollideLabels();
    drawConnectors();
    if (active >= 0) paint();
  }

  // Resolve overlapping pills: first stack upward, then (once the ceiling is
  // hit) fan out horizontally. Connector lines re-attach each pill to its peak.
  function deCollideLabels() {
    const labels = Array.prototype.slice.call(stage.querySelectorAll('.xp-peak'));
    labels.sort((a, b) => a.offsetLeft - b.offsetLeft);
    const W = stage.clientWidth || stage.offsetWidth;
    const placed = [];
    const overlaps = n => {
      const r = n.getBoundingClientRect();
      return placed.some(p =>
        !(r.right < p.left - 7 || r.left > p.right + 7) &&
        !(r.bottom < p.top - 5 || r.top > p.bottom + 5));
    };
    labels.forEach(n => {
      const i = +n.getAttribute('data-i');
      const baseX = XP[i]._xc, lw = n.offsetWidth;
      const maxDy = Math.max(0, XP[i]._peakY - 14 - n.offsetHeight);
      const minX = lw / 2 + 4, maxX = W - lw / 2 - 4;
      let dy = 0, mag = 0, tries = 0;
      while (tries++ < 40 && overlaps(n)) {
        if (dy < maxDy) {
          dy = Math.min(dy + 26, maxDy);
        } else {
          mag += 22;
          n.style.left = clamp(baseX + mag, minX, maxX) + 'px';
          if (overlaps(n)) n.style.left = clamp(baseX - mag, minX, maxX) + 'px';
        }
        n.style.top = (XP[i]._peakY - dy) + 'px';
      }
      placed.push(n.getBoundingClientRect());
    });
  }

  // Coloured line + dot tying each pill to the top of its gradient hill.
  function drawConnectors() {
    const old = svg.querySelector('.xp-connectors');
    if (old) old.remove();
    const grp = el('g', { class: 'xp-connectors' }, true);
    XP.forEach((d, i) => {
      const pill = stage.querySelector('.xp-peak[data-i="' + i + '"]');
      if (!pill) return;
      const px = parseFloat(pill.style.left);          // pill centre x
      const py = parseFloat(pill.style.top) - 12;       // pill bottom edge
      const c = COLOR[d.cat];
      const cg = el('g', { class: 'xp-connect', 'data-i': i }, true);
      cg.appendChild(el('line', {
        class: 'xp-connect-line', x1: d._xc, y1: d._peakY, x2: px, y2: py,
        stroke: c.stroke
      }, true));
      cg.appendChild(el('circle', {
        class: 'xp-connect-dot', cx: d._xc, cy: d._peakY, r: 3.4, fill: c.stroke
      }, true));
      grp.appendChild(cg);
    });
    svg.appendChild(grp);
  }

  function setActive(i) {
    if (active === i) { positionTooltip(i); return; }
    active = i;
    paint();
  }

  function clearActive() {
    active = -1;
    paint();
  }

  function paint() {
    const hovering = active >= 0;
    stage.classList.toggle('is-hovering', hovering);

    svg.querySelectorAll('.xp-hill').forEach(g => {
      g.classList.toggle('xp-active', +g.getAttribute('data-i') === active);
    });
    stage.querySelectorAll('.xp-peak').forEach(p => {
      p.classList.toggle('xp-active', +p.getAttribute('data-i') === active);
    });
    svg.querySelectorAll('.xp-connect').forEach(c => {
      c.classList.toggle('xp-c-active', +c.getAttribute('data-i') === active);
    });

    if (hovering) fillTooltip(active);
    tooltip.classList.toggle('show', hovering);
    if (hovering) positionTooltip(active);
  }

  function fillTooltip(i) {
    const d = XP[i], c = COLOR[d.cat];
    tooltip.className = 'xp-tooltip xp-tip-' + d.cat;
    const tmedia = d.logo
      ? '<img src="' + d.logo + '" alt=""/>'
      : '<span class="xp-tip-init xp-init-' + d.cat + '">' + d.init + '</span>';
    tooltip.innerHTML =
      '<div class="xp-tip-top">' +
        '<div class="xp-tip-logo">' + tmedia + '</div>' +
        '<div class="xp-tip-head">' +
          '<div class="xp-tip-role">' + d.role + '</div>' +
          '<div class="xp-tip-co">' + d.name + ' · ' + d.loc + '</div>' +
        '</div>' +
        (d.current ? '<span class="xp-tip-now">Current</span>' : '') +
      '</div>' +
      '<div class="xp-tip-meta">' +
        '<span class="xp-tip-date">' + d.label + '</span>' +
        '<span class="xp-tip-badge">' + d.type + ' · ' + d.dur + '</span>' +
      '</div>' +
      '<ul class="xp-tip-bullets">' +
        d.bullets.slice(0, 2).map(b => '<li>' + b + '</li>').join('') +
      '</ul>';
  }

  // The tooltip lives in .xp-scroll (overflow visible) so it can float beyond
  // the short, horizontally-scrolling card. Map the peak's x into the visible
  // viewport by subtracting the track's scroll offset.
  function positionTooltip(i) {
    const d = XP[i];
    const tw = tooltip.offsetWidth || 280;
    const th = tooltip.offsetHeight || 150;
    const scrollLeft = track ? track.scrollLeft : 0;
    const viewW = track ? track.clientWidth : stage.clientWidth;
    const left = clamp(d._xc - scrollLeft, tw / 2 + 6, viewW - tw / 2 - 6);

    // Prefer above the peak (allowed to spill a little over the legend);
    // otherwise drop below, where it can overflow past the card freely.
    const fitsAbove = (d._peakY - 14 - th) >= -52;
    tooltip.classList.toggle('below', !fitsAbove);
    const top = fitsAbove ? d._peakY - 14 : d._peakY + 26;

    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
  }

  function init() {
    stage = document.getElementById('xp-stage');
    tooltip = document.getElementById('xp-tooltip');
    track = document.getElementById('xp-track');
    if (!stage || !tooltip) return;
    render();

    // start scrolled to the end so the most recent roles are in view
    if (track) track.scrollLeft = track.scrollWidth;

    let raf;
    const onResize = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(render); };
    window.addEventListener('resize', onResize);
    if (window.ResizeObserver) new ResizeObserver(onResize).observe(track || stage);
    // keep the tooltip glued to its peak while scrolling horizontally
    if (track) track.addEventListener('scroll', () => { if (active >= 0) positionTooltip(active); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
