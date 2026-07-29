/* ══════════════════════════════════════════════════════════════════════
   Hero shader — reusable build of the morphing glass solid.

   Same renderer as JS/shape-morph.js, but parameterised so the hero
   variants can share it instead of each inlining ~400 lines of GLSL.

   initHeroShader({
     canvas,            // <canvas>
     section,           // element observed to pause when off-screen
     paint(ctx,w,h,u),  // draws the refracted backdrop. u = { gutter, scale,
                        //   cssW, isNarrow, face, fg, bg }
     steer,             // default true; forced off on coarse pointers
     mono, light,       // 0/1 and bool
     onShape(i, name),  // fires when the morph target changes
   })

   Technique notes live in JS/shape-morph.js — this is the same SDF
   raymarch, dispersion and fresnel, unchanged.
════════════════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  const SHAPE_NAMES = ['Sphere', 'Cube', 'Octahedron', 'Tetrahedron', 'Torus'];
  const SEG = 2.6;

  const VERT = `#version 300 es
  void main(){
    vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
    gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
  }`;

  const FRAG = `#version 300 es
  precision highp float;
  uniform vec2 uRes; uniform float uTime; uniform vec2 uPointer;
  uniform float uMono; uniform float uLight; uniform sampler2D uBg;
  out vec4 fragColor;
  const float SEG = 2.6;
  const int SHAPES = 5;

  mat3 rotX(float a){ float s=sin(a),c=cos(a); return mat3(1.,0.,0., 0.,c,-s, 0.,s,c); }
  mat3 rotY(float a){ float s=sin(a),c=cos(a); return mat3(c,0.,-s, 0.,1.,0., s,0.,c); }

  float sdSphere(vec3 p, float r){ return length(p) - r; }
  float sdBox(vec3 p, vec3 b){ vec3 q = abs(p) - b;
    return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0); }
  float sdOcta(vec3 p, float s){ p = abs(p); return (p.x+p.y+p.z-s)*0.57735027; }
  float sdTetra(vec3 p, float s){
    float d = max(max( p.x+p.y-p.z,  p.x-p.y+p.z),
                  max(-p.x+p.y+p.z, -p.x-p.y-p.z));
    return (d - s) * 0.57735027; }
  float sdTorus(vec3 p, vec2 t){ vec2 q = vec2(length(p.xz)-t.x, p.y); return length(q)-t.y; }

  float shape(vec3 p, int i){
    if(i == 0) return sdSphere(p, 1.02);
    if(i == 1) return sdBox(p, vec3(0.80));
    if(i == 2) return sdOcta(p, 1.30);
    if(i == 3) return sdTetra(p, 1.05);
    return sdTorus(p, vec2(0.70, 0.34));
  }

  float map(vec3 p){
    p = rotX(uTime * 0.17 + uPointer.y * 0.6)
      * rotY(uTime * 0.24 - uPointer.x * 0.9) * p;
    float t = uTime / SEG, seg = floor(t), f = fract(t);
    float k = smoothstep(0.42, 0.98, f);
    int i = int(mod(seg, float(SHAPES)));
    int j = int(mod(seg + 1.0, float(SHAPES)));
    return mix(shape(p, i), shape(p, j), k);
  }

  vec3 calcNormal(vec3 p){
    vec2 e = vec2(1.0, -1.0) * 0.0015;
    return normalize(
      e.xyy*map(p+e.xyy) + e.yyx*map(p+e.yyx) +
      e.yxy*map(p+e.yxy) + e.xxx*map(p+e.xxx));
  }

  vec3 palette(float t){
    t = fract(t) * 3.0;
    const vec3 magenta = vec3(0.94, 0.32, 0.88);
    const vec3 violet  = vec3(0.44, 0.32, 0.96);
    const vec3 teal    = vec3(0.34, 0.86, 0.92);
    if(t < 1.0) return mix(magenta, violet, smoothstep(0.0,1.0,t));
    if(t < 2.0) return mix(violet,  teal,   smoothstep(0.0,1.0,t-1.0));
    return             mix(teal,    magenta,smoothstep(0.0,1.0,t-2.0));
  }

  void main(){
    vec2 frag = gl_FragCoord.xy;
    vec2 uv = frag / uRes;
    vec2 ndc = (frag - 0.5*uRes) / min(uRes.x, uRes.y);
    vec3 bgCol = texture(uBg, uv).rgb;

    const float FOCAL = 2.4;
    vec3 ro = vec3(0.0, 0.0, 9.0);
    vec3 rd = normalize(vec3(ndc, -FOCAL));

    float t = 0.0; bool hit = false;
    for(int i = 0; i < 96; i++){
      vec3 p = ro + rd*t; float d = map(p);
      if(d < 0.0012){ hit = true; break; }
      t += d * 0.78; if(t > 15.0) break;
    }
    if(!hit){ fragColor = vec4(bgCol, 1.0); return; }

    vec3 p = ro + rd*t;
    vec3 n = calcNormal(p);

    vec3 rin = refract(rd, n, 1.0/1.14);
    float ti = 0.03;
    for(int i = 0; i < 40; i++){
      float d = map(p + rin*ti);
      if(d > 0.0) break;
      ti += max(-d, 0.012) * 0.85;
      if(ti > 3.5) break;
    }
    float thick = clamp(ti/2.6, 0.0, 1.0);

    float facing = 1.0 - clamp(dot(n, -rd), 0.0, 1.0);
    float fres = pow(facing, 2.2);
    float rim  = pow(facing, 5.5);

    float amp = 0.05 + 0.07*thick;
    vec3 rR = refract(rd, n, 1.0/1.10);
    vec3 rG = refract(rd, n, 1.0/1.13);
    vec3 rB = refract(rd, n, 1.0/1.16);
    vec3 refr = vec3(
      texture(uBg, uv + rR.xy*amp).r,
      texture(uBg, uv + rG.xy*amp).g,
      texture(uBg, uv + rB.xy*amp).b);

    vec3 irid = palette(fres*0.40 + thick*0.40 + uTime*0.03);
    irid = mix(irid, vec3(dot(irid, vec3(0.299,0.587,0.114))), uMono);

    vec3 lig = normalize(vec3(0.6, 0.85, 0.5));
    float spec = pow(max(dot(reflect(rd,n), lig), 0.0), 60.0);

    vec3 tintD = mix(vec3(0.95,0.97,1.00), vec3(0.42,0.38,0.60), thick);
    vec3 colD = refr * tintD;
    colD += irid * (0.15 + 1.05*fres);
    colD += irid * 0.12 * (1.0 - thick);
    colD += mix(irid, vec3(1.0), 0.30) * rim * 0.95;
    colD += vec3(spec) * 0.35;

    vec3 tintL = mix(vec3(1.0), irid, 0.55);
    vec3 colL = refr * tintL;
    colL *= 1.0 - 0.42*thick;
    colL = mix(colL, colL*0.55 + irid*0.22, fres);
    colL *= 1.0 - 0.30*rim;
    colL += vec3(spec) * 0.30;

    fragColor = vec4(mix(colD, colL, uLight), 1.0);
  }`;

  function initHeroShader(opts) {
    const canvas = opts.canvas;
    const section = opts.section || canvas.parentElement;
    if (!canvas) return null;

    const gl = canvas.getContext('webgl2', { antialias: false, alpha: false });
    if (!gl) { section && section.classList.add('is-unsupported'); return null; }

    const LIGHT = !!opts.light;
    const MONO = opts.mono ? 1 : 0;

    const bg = document.createElement('canvas');
    const bx = bg.getContext('2d');

    function paintBackground(w, h) {
      bg.width = w; bg.height = h;
      const fg = LIGHT ? '#000000' : '#ffffff';
      const bgc = LIGHT ? '#ffffff' : '#000000';
      bx.fillStyle = bgc; bx.fillRect(0, 0, w, h);
      bx.fillStyle = fg;
      bx.textBaseline = 'middle';
      const cssW = canvas.clientWidth || w;
      const scale = w / Math.max(cssW, 1);
      const isNarrow = cssW <= 768;
      opts.paint(bx, w, h, {
        gutter: (isNarrow ? 20 : 40) * scale,
        scale, cssW, isNarrow, fg, bg: bgc,
        face: '"Google Sans Flex","Manrope",system-ui,sans-serif',
      });
    }

    const bgTex = gl.createTexture();
    function uploadBackground() {
      gl.bindTexture(gl.TEXTURE_2D, bgTex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bg);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    }

    function compile(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
        throw new Error(gl.getShaderInfoLog(s) || 'compile failed');
      return s;
    }

    let prog;
    try {
      prog = gl.createProgram();
      gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS))
        throw new Error(gl.getProgramInfoLog(prog) || 'link failed');
    } catch (err) {
      console.error('[hero-shader]', err);
      section && section.classList.add('is-unsupported');
      return null;
    }

    gl.useProgram(prog);
    const uRes = gl.getUniformLocation(prog, 'uRes');
    const uTime = gl.getUniformLocation(prog, 'uTime');
    const uPointer = gl.getUniformLocation(prog, 'uPointer');
    const uMono = gl.getUniformLocation(prog, 'uMono');
    const uLight = gl.getUniformLocation(prog, 'uLight');
    gl.uniform1i(gl.getUniformLocation(prog, 'uBg'), 0);
    gl.bindVertexArray(gl.createVertexArray());

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width === w && canvas.height === h) return;
      canvas.width = w; canvas.height = h;
      gl.viewport(0, 0, w, h);
      paintBackground(w, h); uploadBackground();
    }

    // steering is pointer-fine only: on touch it would eat the scroll gesture
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const steer = opts.steer !== false && fine;
    let dragging = false;
    if (steer) {
      const set = (e) => {
        const r = canvas.getBoundingClientRect();
        pointer.tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
        pointer.ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
      };
      canvas.addEventListener('pointerdown', (e) => {
        dragging = true; canvas.setPointerCapture(e.pointerId); set(e);
      });
      canvas.addEventListener('pointermove', (e) => { if (dragging) set(e); });
      canvas.addEventListener('pointerup', () => { dragging = false; });
      canvas.addEventListener('pointercancel', () => { dragging = false; });
    }

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let clock = reduced ? 1.3 : 0;
    let last = performance.now();
    let running = true, rafId = 0, lastShape = -1;

    if ('IntersectionObserver' in window && section) {
      new IntersectionObserver((es) => {
        const vis = es[0].isIntersecting;
        if (vis === running) return;
        running = vis;
        if (running) { last = performance.now(); rafId = requestAnimationFrame(frame); }
        else cancelAnimationFrame(rafId);
      }, { rootMargin: '80px' }).observe(section);
    }
    window.addEventListener('resize', resize);

    function frame(now) {
      if (!running) return;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!reduced) clock += dt;
      resize();

      if (opts.onShape) {
        // the shader holds each shape then eases across; report the target it
        // is settling into so a caption can lead the morph slightly
        const tt = clock / SEG;
        const idx = Math.floor(tt + 0.42) % SHAPE_NAMES.length;
        if (idx !== lastShape) { lastShape = idx; opts.onShape(idx, SHAPE_NAMES[idx]); }
      }

      gl.useProgram(prog);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, bgTex);
      pointer.x += (pointer.tx - pointer.x) * 0.06;
      pointer.y += (pointer.ty - pointer.y) * 0.06;
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, clock);
      gl.uniform2f(uPointer, pointer.x, pointer.y);
      gl.uniform1f(uMono, MONO);
      gl.uniform1f(uLight, LIGHT ? 1 : 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      rafId = requestAnimationFrame(frame);
    }

    // repaint once the webfont lands, or the headline measures a fallback face
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        if (canvas.width) { paintBackground(canvas.width, canvas.height); uploadBackground(); }
      });
    }
    rafId = requestAnimationFrame(frame);
    return { repaint: () => { if (canvas.width) { paintBackground(canvas.width, canvas.height); uploadBackground(); } } };
  }

  global.initHeroShader = initHeroShader;
  global.HERO_SHAPE_NAMES = SHAPE_NAMES;
})(window);
