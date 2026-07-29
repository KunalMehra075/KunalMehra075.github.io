/* ══════════════════════════════════════════════════════════════════════
   Glass surface — refraction for the stuck navbar.

   A port of reactbits' Glass Surface. The whole effect is one SVG filter
   used as a backdrop-filter, and it works like this:

     1. A displacement map is painted as an inline SVG (below). Its middle
        is flat mid-grey, and mid-grey means "no displacement" — 0.5 is the
        neutral point of feDisplacementMap. Toward the edges a red gradient
        (running right to left) and a blue gradient (running top to bottom)
        pull the values away from neutral, so only the rim of the bar bends
        what is behind it. That is what real glass does: the middle of a
        pane is flat, the curved edge is where the world goes crooked.

     2. The backdrop is displaced three times, once per colour channel, at
        slightly different strengths. Splitting red from green from blue is
        dispersion — the reason a prism makes colour out of white light.
        The three passes are masked back to one channel each and screened
        together.

   Only Chromium accepts url() inside backdrop-filter. Safari and Firefox
   support backdrop-filter but not filter references, and a declaration
   they cannot parse is dropped whole, which would leave the bar with no
   blur at all — so support is detected up front and the plain-blur bar
   stays put unless the filter is really available.
════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const nav = document.getElementById('navbar');
  const feImage = document.getElementById('navGlassMap');
  if (!nav || !feImage) return;

  /* Tuned for a wide, short bar rather than reactbits' 200x80 demo card.
     Their -180 distortion throws the backdrop further than this bar is
     tall, which reads as a smear; -132 keeps the bend inside the rim. */
  const CFG = {
    radius: 100,          // matches the pill's border-radius, clamped to h/2
    borderWidth: 0.07,    // fraction of the short side the rim occupies
    brightness: 60,       // lightness of the flat, neutral middle
    opacity: 0.93,
    blur: 11,             // softness of the rim falloff, in map pixels
    soften: 0.4,          // final blur over the recombined channels
    distortion: -95,
    redOffset: 0,
    greenOffset: 8,      // the channel spread — this is the dispersion
    blueOffset: 16,
    xChannel: 'R',
    yChannel: 'G',
    blend: 'difference',
  };

  /* ── support ──────────────────────────────────────────────────────────
     UA sniffing is not something to reach for lightly, but there is no
     feature query that separates "backdrop-filter works" from "filter
     references work inside it": Safari happily accepts the url() string
     into the style property and then paints nothing. */
  function supported() {
    const ua = navigator.userAgent;
    const isWebkit = /Safari/.test(ua) && !/Chrome|Chromium|Edg/.test(ua);
    if (isWebkit || /Firefox/.test(ua)) return false;
    const probe = document.createElement('div');
    probe.style.backdropFilter = 'url(#nav-glass)';
    return probe.style.backdropFilter !== '';
  }

  if (!supported()) return;
  document.documentElement.classList.add('glass-ok');

  /* ── the displacement map ─────────────────────────────────────────────
     Painted at the bar's real size so the rim lands on the rim. */
  function buildMap(w, h) {
    const r = Math.min(CFG.radius, h / 2);
    const edge = Math.min(w, h) * (CFG.borderWidth * 0.5);
    const svg =
      '<svg viewBox="0 0 ' + w + ' ' + h + '" xmlns="http://www.w3.org/2000/svg">' +
        '<defs>' +
          '<linearGradient id="gr" x1="100%" y1="0%" x2="0%" y2="0%">' +
            '<stop offset="0%" stop-color="#0000"/><stop offset="100%" stop-color="red"/>' +
          '</linearGradient>' +
          '<linearGradient id="gb" x1="0%" y1="0%" x2="0%" y2="100%">' +
            '<stop offset="0%" stop-color="#0000"/><stop offset="100%" stop-color="blue"/>' +
          '</linearGradient>' +
        '</defs>' +
        '<rect width="' + w + '" height="' + h + '" fill="black"/>' +
        '<rect width="' + w + '" height="' + h + '" rx="' + r + '" fill="url(#gr)"/>' +
        '<rect width="' + w + '" height="' + h + '" rx="' + r + '" fill="url(#gb)" ' +
          'style="mix-blend-mode:' + CFG.blend + '"/>' +
        '<rect x="' + edge + '" y="' + edge + '" ' +
          'width="' + (w - edge * 2) + '" height="' + (h - edge * 2) + '" rx="' + r + '" ' +
          'fill="hsl(0 0% ' + CFG.brightness + '% / ' + CFG.opacity + ')" ' +
          'style="filter:blur(' + CFG.blur + 'px)"/>' +
      '</svg>';
    return 'data:image/svg+xml,' + encodeURIComponent(svg);
  }

  let lastW = 0;
  let lastH = 0;

  function paint() {
    const r = nav.getBoundingClientRect();
    const w = Math.round(r.width);
    const h = Math.round(r.height);
    if (!w || !h || (w === lastW && h === lastH)) return;
    lastW = w;
    lastH = h;
    feImage.setAttribute('href', buildMap(w, h));
  }

  /* The bar resizes for half a second every time it sticks or unsticks.
     Repainting the map on each of those frames means decoding a data URI
     ~30 times for no visible gain: feImage stretches the existing map to
     the element (preserveAspectRatio="none"), so a stale map still covers
     the bar, just with a slightly wrong corner radius in passing. Repaint
     on the trailing edge, and again when the transition lands. */
  let timer = 0;
  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(paint, 90);
  }

  const channels = [
    ['navGlassR', CFG.redOffset],
    ['navGlassG', CFG.greenOffset],
    ['navGlassB', CFG.blueOffset],
  ];
  channels.forEach(function (pair) {
    const node = document.getElementById(pair[0]);
    if (!node) return;
    node.setAttribute('scale', String(CFG.distortion + pair[1]));
    node.setAttribute('xChannelSelector', CFG.xChannel);
    node.setAttribute('yChannelSelector', CFG.yChannel);
  });

  const soften = document.getElementById('navGlassSoften');
  if (soften) soften.setAttribute('stdDeviation', String(CFG.soften));

  paint();

  if ('ResizeObserver' in window) {
    new ResizeObserver(schedule).observe(nav);
  } else {
    window.addEventListener('resize', schedule);
  }

  nav.addEventListener('transitionend', function (e) {
    if (e.target === nav && (e.propertyName === 'max-width' || e.propertyName === 'padding')) paint();
  });
})();
