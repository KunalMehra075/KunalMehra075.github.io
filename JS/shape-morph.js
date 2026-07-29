/* ══════════════════════════════════════════════════════════════════════
   Morphing glass solid — hero section.

   The centre object is a signed-distance field raymarched in a single
   fullscreen fragment shader. Morphing works because the SDFs of two
   primitives can simply be mix()ed — the zero-isosurface of the blend is a
   clean in-between shape, which is why a cube can become a torus without
   any vertex correspondence.

   The glass look is three things stacked:
     1. refraction  — the headline is rendered to a texture, then sampled
                      with a screen-space offset along the refracted ray
     2. dispersion  — R/G/B each use a slightly different IOR, so edges fringe
     3. fresnel     — grazing angles get an iridescent rim from a palette
   A second march *inside* the solid finds the exit point; that thickness
   drives absorption, which is what makes the interior faces readable.

   Standalone playground with light/mono/pause switches: shape-morph.html
════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // the refracted headline — it lives in the texture, not the DOM, because the
  // shader has to sample it in order to bend it
  const LINE_1 = 'Build. Scale';
  const LINE_2 = 'Inspire. Innovate';

  // fixed presentation for the portfolio. The playground exposes these as
  // switches; here they are pinned. light:true + mono:1 would give a
  // graphite solid on white if the black band ever needs to go.
  const LIGHT = false;
  const MONO  = 0;

  const canvas = document.getElementById('shape-canvas');
  if (!canvas) return;

  const section = document.getElementById('shape-hero');
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false });

  if (!gl) {
    // no WebGL2 — collapse the section rather than leaving a black void
    if (section) section.classList.add('is-unsupported');
    return;
  }

  /* ── background texture ─────────────────────────────────────────────── */
  const bg = document.createElement('canvas');
  const bx = bg.getContext('2d');

  function paintBackground(w, h) {
    bg.width = w; bg.height = h;
    bx.fillStyle = LIGHT ? '#ffffff' : '#000000';
    bx.fillRect(0, 0, w, h);

    const FACE = '"Google Sans Flex","Manrope",system-ui,sans-serif';
    bx.fillStyle = LIGHT ? '#000000' : '#ffffff';
    bx.textBaseline = 'middle';

    /* Inset by the same gutter .container uses (40px, 20px under 768) rather
       than a percentage, so the headline's left edge lines up with every
       other section title. w is in device pixels, the gutter is in CSS px. */
    const cssW   = canvas.clientWidth || w;
    const scale  = w / Math.max(cssW, 1);
    const isNarrow = cssW <= 768;
    const gutter = (isNarrow ? 20 : 40) * scale;

    if (isNarrow) {
      /* Portrait: one word per line, sized to fill the measure. Set at the
         desktop size the phrases would run nearly edge to edge and read small;
         broken up, each word can be far larger. */
      const top = LINE_1.split(/\s+/);
      const bottom = LINE_2.split(/\s+/);
      const maxW = w - gutter * 2;

      // measure once at a reference size — glyph width scales linearly with it
      const REF = 100;
      bx.font = '700 ' + REF + 'px ' + FACE;
      const widest = Math.max.apply(
        null,
        top.concat(bottom).map((t) => bx.measureText(t).width),
      );
      // cap against height too, so a short wide viewport can't collide with the solid
      const size = Math.min((REF * maxW) / widest, h * 0.115);
      bx.font = '700 ' + size + 'px ' + FACE;

      const lh = size * 1.04;
      bx.textAlign = 'left';
      top.forEach((t, i) => bx.fillText(t, gutter, h * 0.13 + i * lh));
      // the lower block is anchored to the bottom and grows upward
      bx.textAlign = 'right';
      const lastY = h * 0.87;
      bottom.forEach((t, i) =>
        bx.fillText(t, w - gutter, lastY - (bottom.length - 1 - i) * lh),
      );
      return;
    }

    const size = Math.max(Math.min(w, h) * 0.115, 20);
    bx.font = '700 ' + size + 'px ' + FACE;
    // offset the two lines so the solid sits between them
    bx.textAlign = 'left';
    bx.fillText(LINE_1, gutter, h * 0.30);
    bx.textAlign = 'right';
    bx.fillText(LINE_2, w - gutter, h * 0.70);
  }

  const bgTex = gl.createTexture();
  function uploadBackground() {
    gl.bindTexture(gl.TEXTURE_2D, bgTex);
    // canvas2d's origin is top-left, GL's is bottom-left — without this the
    // refracted headline comes out mirrored
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bg);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  }

  /* ── shaders ────────────────────────────────────────────────────────── */
  const VERT = `#version 300 es
  // fullscreen triangle, no attribute buffers needed
  void main(){
    vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
    gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
  }`;

  const FRAG = `#version 300 es
  precision highp float;

  uniform vec2      uRes;
  uniform float     uTime;
  uniform vec2      uPointer;   // -1..1, steers the object
  uniform float     uMono;      // 1.0 = drop the iridescence
  uniform float     uLight;     // 1.0 = white plate, black type
  uniform sampler2D uBg;

  out vec4 fragColor;

  const float SEG = 2.6;   // seconds a shape is held + morphed
  const int   SHAPES = 5;

  mat3 rotX(float a){ float s=sin(a),c=cos(a); return mat3(1.,0.,0., 0.,c,-s, 0.,s,c); }
  mat3 rotY(float a){ float s=sin(a),c=cos(a); return mat3(c,0.,-s, 0.,1.,0., s,0.,c); }

  // ── primitives ──────────────────────────────────────────────────────
  float sdSphere(vec3 p, float r){ return length(p) - r; }

  float sdBox(vec3 p, vec3 b){
    vec3 q = abs(p) - b;
    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
  }

  float sdOcta(vec3 p, float s){
    p = abs(p);
    return (p.x + p.y + p.z - s) * 0.57735027;
  }

  // max of the four face planes of a regular tetrahedron
  float sdTetra(vec3 p, float s){
    float d = max(max( p.x + p.y - p.z,  p.x - p.y + p.z),
                  max(-p.x + p.y + p.z, -p.x - p.y - p.z));
    return (d - s) * 0.57735027;
  }

  float sdTorus(vec3 p, vec2 t){
    vec2 q = vec2(length(p.xz) - t.x, p.y);
    return length(q) - t.y;
  }

  // radii chosen so every shape reads at roughly the same visual weight
  float shape(vec3 p, int i){
    if(i == 0) return sdSphere(p, 1.02);
    if(i == 1) return sdBox(p, vec3(0.80));
    if(i == 2) return sdOcta(p, 1.30);
    if(i == 3) return sdTetra(p, 1.05);
    return sdTorus(p, vec2(0.70, 0.34));
  }

  // ── the morphing field ──────────────────────────────────────────────
  float map(vec3 p){
    /* Rotating the sample point applies the INVERSE rotation to the rendered
       solid — shape(R*p)==0 puts the object at R^-1*q — so a naive pointer term
       drags the shape backwards. The two axes need OPPOSITE signs:

         rotY: front marker lands at x = -sin(b), so drag-right needs b to fall
         rotX: front marker lands at y = -sin(a), so drag-down needs a to rise

       The vertical flips back because DOM clientY grows downward while GL's y
       grows upward, and that cancels the inverse-rotation flip.
       (Time terms are unsigned — their direction is arbitrary.) */
    p = rotX(uTime * 0.17 + uPointer.y * 0.6)
      * rotY(uTime * 0.24 - uPointer.x * 0.9) * p;

    float t   = uTime / SEG;
    float seg = floor(t);
    float f   = fract(t);

    // hold the shape, then ease across to the next one
    float k = smoothstep(0.42, 0.98, f);

    int i = int(mod(seg,       float(SHAPES)));
    int j = int(mod(seg + 1.0, float(SHAPES)));

    // mixing two SDFs is what makes the morph work at all
    return mix(shape(p, i), shape(p, j), k);
  }

  vec3 calcNormal(vec3 p){
    vec2 e = vec2(1.0, -1.0) * 0.0015;
    return normalize(
      e.xyy * map(p + e.xyy) + e.yyx * map(p + e.yyx) +
      e.yxy * map(p + e.yxy) + e.xxx * map(p + e.xxx));
  }

  /* Iridescent ramp, looped through three explicit stops rather than a cosine
     palette. A cosine palette inevitably swings through yellow-green on its way
     round the wheel; the reference never goes there, so the stops are hard-coded
     magenta -> violet -> teal and back. */
  vec3 palette(float t){
    t = fract(t) * 3.0;
    const vec3 magenta = vec3(0.94, 0.32, 0.88);
    const vec3 violet  = vec3(0.44, 0.32, 0.96);
    const vec3 teal    = vec3(0.34, 0.86, 0.92);
    if(t < 1.0) return mix(magenta, violet, smoothstep(0.0, 1.0, t));
    if(t < 2.0) return mix(violet,  teal,   smoothstep(0.0, 1.0, t - 1.0));
    return             mix(teal,    magenta,smoothstep(0.0, 1.0, t - 2.0));
  }

  void main(){
    vec2 frag = gl_FragCoord.xy;
    vec2 uv   = frag / uRes;
    // aspect-corrected NDC for the ray, uv stays untouched for texture reads
    vec2 ndc  = (frag - 0.5 * uRes) / min(uRes.x, uRes.y);

    vec3 bgCol = texture(uBg, uv).rgb;

    /* Long lens, camera pulled back: a wide FOV at close range made the solid
       fill the frame and skewed the silhouette. Projected radius is
       r * FOCAL / dist, so 1.05 * 2.4 / 9.0 ~= 0.28 of the half-height. */
    const float FOCAL = 2.4;
    vec3 ro = vec3(0.0, 0.0, 9.0);
    vec3 rd = normalize(vec3(ndc, -FOCAL));

    // ── march to the surface ──
    float t = 0.0;
    bool  hit = false;
    for(int i = 0; i < 96; i++){
      vec3 p = ro + rd * t;
      float d = map(p);
      if(d < 0.0012){ hit = true; break; }
      t += d * 0.78;          // <1 because a mix() of SDFs can overshoot
      if(t > 15.0) break;
    }

    if(!hit){
      fragColor = vec4(bgCol, 1.0);
      return;
    }

    vec3 p = ro + rd * t;
    vec3 n = calcNormal(p);

    // ── march inside to find the exit, for thickness ──
    vec3 rin = refract(rd, n, 1.0 / 1.14);
    float ti = 0.03;
    for(int i = 0; i < 40; i++){
      float d = map(p + rin * ti);
      if(d > 0.0) break;
      ti += max(-d, 0.012) * 0.85;
      if(ti > 3.5) break;
    }
    float thick = clamp(ti / 2.6, 0.0, 1.0);

    float facing = 1.0 - clamp(dot(n, -rd), 0.0, 1.0);
    // broad exponent: the tint should wash across the body, not hug the outline
    float fres = pow(facing, 2.2);
    float rim  = pow(facing, 5.5);

    /* ── refraction + chromatic dispersion ──
       One sample per channel, each with its own IOR — that split is the fringe.
       The IORs sit close together on purpose: spreading them wide reads as an
       RGB glitch rather than glass. */
    float amp = 0.05 + 0.07 * thick;
    vec3 rR = refract(rd, n, 1.0 / 1.10);
    vec3 rG = refract(rd, n, 1.0 / 1.13);
    vec3 rB = refract(rd, n, 1.0 / 1.16);

    vec3 refr = vec3(
      texture(uBg, uv + rR.xy * amp).r,
      texture(uBg, uv + rG.xy * amp).g,
      texture(uBg, uv + rB.xy * amp).b);

    // ── iridescence ──
    vec3 irid = palette(fres * 0.40 + thick * 0.40 + uTime * 0.03);
    irid = mix(irid, vec3(dot(irid, vec3(0.299, 0.587, 0.114))), uMono);

    vec3 lig = normalize(vec3(0.6, 0.85, 0.5));
    float spec = pow(max(dot(reflect(rd, n), lig), 0.0), 60.0);

    /* ── DARK plate: additive ──
       Against black, the solid has to emit. Thickness darkens the interior and
       the iridescence is added on top, brightest at grazing angles. */
    vec3 tintD = mix(vec3(0.95, 0.97, 1.00), vec3(0.42, 0.38, 0.60), thick);
    vec3 colD  = refr * tintD;
    colD += irid * (0.15 + 1.05 * fres);
    colD += irid * 0.12 * (1.0 - thick);
    colD += mix(irid, vec3(1.0), 0.30) * rim * 0.95;   // glowing outline
    colD += vec3(spec) * 0.35;

    /* ── LIGHT plate: subtractive ──
       The same additive maths on white just clips to flat white, so here the
       glass MULTIPLIES the background instead: it tints and absorbs, the way
       real glass on a lightbox does. Edges darken rather than glow. */
    vec3 tintL = mix(vec3(1.0), irid, 0.55);           // coloured transmission
    vec3 colL  = refr * tintL;
    colL *= 1.0 - 0.42 * thick;                        // absorption
    colL = mix(colL, colL * 0.55 + irid * 0.22, fres); // saturate towards edges
    colL *= 1.0 - 0.30 * rim;                          // dark contact edge
    colL += vec3(spec) * 0.30;                         // highlight still adds

    fragColor = vec4(mix(colD, colL, uLight), 1.0);
  }`;

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(s) || 'shader compile failed');
    }
    return s;
  }

  let prog;
  try {
    prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(prog) || 'link failed');
    }
  } catch (err) {
    console.error('[shape-morph]', err);
    if (section) section.classList.add('is-unsupported');
    return;
  }

  gl.useProgram(prog);
  const uRes     = gl.getUniformLocation(prog, 'uRes');
  const uTime    = gl.getUniformLocation(prog, 'uTime');
  const uPointer = gl.getUniformLocation(prog, 'uPointer');
  const uMono    = gl.getUniformLocation(prog, 'uMono');
  const uLight   = gl.getUniformLocation(prog, 'uLight');
  gl.uniform1i(gl.getUniformLocation(prog, 'uBg'), 0);

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  /* ── sizing. Raymarching is per-pixel, so DPR is capped rather than
        honoured outright — 3x on a phone would quadruple the cost. ── */
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    const w = Math.max(1, Math.round(canvas.clientWidth  * dpr));
    const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width === w && canvas.height === h) return;
    canvas.width = w; canvas.height = h;
    gl.viewport(0, 0, w, h);
    paintBackground(w, h);
    uploadBackground();
  }

  /* ── interaction ──────────────────────────────────────────────────────
     Steering is pointer-fine only. On a touchscreen the hero fills the
     viewport, so a drag on the canvas is almost always someone trying to
     scroll the page — capturing it spins the solid instead of moving on.
     The matching CSS also drops pointer-events on coarse pointers so the
     gesture reaches the document. */
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  const canSteer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  let dragging = false;

  if (canSteer) {
    const setPointerFromEvent = (e) => {
      const r = canvas.getBoundingClientRect();
      pointer.tx = ((e.clientX - r.left) / r.width  - 0.5) * 2.0;
      pointer.ty = ((e.clientY - r.top)  / r.height - 0.5) * 2.0;
    };
    canvas.addEventListener('pointerdown', (e) => {
      dragging = true; canvas.setPointerCapture(e.pointerId); setPointerFromEvent(e);
    });
    canvas.addEventListener('pointermove', (e) => { if (dragging) setPointerFromEvent(e); });
    canvas.addEventListener('pointerup',     () => { dragging = false; });
    canvas.addEventListener('pointercancel', () => { dragging = false; });
  }

  /* ── clock ──────────────────────────────────────────────────────────── */
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let clock = reduced ? 1.3 : 0;   // park mid-shape rather than on a morph seam
  let last = performance.now();
  let running = true;
  let rafId = 0;

  /* A per-pixel shader has no business running while the hero is scrolled
     out of view — stop the loop entirely once the section leaves the
     viewport, and pick it up again on the way back. */
  if ('IntersectionObserver' in window && section) {
    new IntersectionObserver((entries) => {
      const visible = entries[0].isIntersecting;
      if (visible === running) return;
      running = visible;
      if (running) { last = performance.now(); rafId = requestAnimationFrame(frame); }
      else { cancelAnimationFrame(rafId); }
    }, { rootMargin: '80px' }).observe(section);
  }

  window.addEventListener('resize', resize);

  function frame(now) {
    if (!running) return;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (!reduced) clock += dt;

    resize();

    gl.useProgram(prog);
    gl.bindVertexArray(vao);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, bgTex);

    pointer.x += (pointer.tx - pointer.x) * 0.06;
    pointer.y += (pointer.ty - pointer.y) * 0.06;

    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, clock);
    gl.uniform2f(uPointer, pointer.x, pointer.y);
    gl.uniform1f(uMono, MONO);
    gl.uniform1f(uLight, LIGHT ? 1.0 : 0.0);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
    rafId = requestAnimationFrame(frame);
  }

  // wait for the webfont so the refracted headline isn't a fallback face
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      if (canvas.width) { paintBackground(canvas.width, canvas.height); uploadBackground(); }
    });
  }
  rafId = requestAnimationFrame(frame);
})();
