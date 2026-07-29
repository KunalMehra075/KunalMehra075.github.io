# Archived — Experience section "area chart" design

This is the interactive **Experience & Education area chart** design that briefly
replaced the vertical timeline in `#experience`. It was rolled back in favour of
the original vertical timeline, but everything needed to bring it back is kept
here.

**Status:** not active on the site. The timeline (`.tl-vertical` / `.tl-v-*`) is live instead.

## What it looked like / did

Each role or degree is drawn as a smooth gradient "hill" on a shared, horizontally
scrollable time axis. Work spans are blue, education spans are cyan. Every hill has
a persistent pill label (logo + name + duration) anchored to its peak, connected by
a thin line. Hovering a hill or its pill highlights that span, fades the rest, and
opens a detail tooltip with role, company, dates and bullets.

## Files involved

| Piece | Where it lives now |
|---|---|
| Chart renderer + data | `JS/experience-chart.js` (still in the repo, just not loaded) |
| Section markup | Section 1 below |
| Styles | Section 2 below |
| Script tag | Section 3 below |
| Logos | `Images/journey/factual-logo.webp`, `chapter_logo.png`, `bizmorphic_research_logo.jpeg` (kept in repo) |

## How to restore

1. Replace the `<div class="tl-vertical"> … </div>` block inside `<section id="experience">`
   in `index.html` with the markup in **Section 1**.
2. Change the section heading back to `Experience & Education`.
3. In `style.css`, replace the `.tl-vertical` / `.tl-v-*` rule block (under
   `/* ── EXPERIENCE ── */`) with the CSS in **Section 2**. The mobile `@media` rules
   for `.tl-v-*` further down in `style.css` can be dropped at the same time — the chart
   does not use them.
4. Re-add the script tag from **Section 3** at the bottom of `index.html`, after `main.js`.
5. Edit the `XP` array at the top of `JS/experience-chart.js` to match the roles you
   want to show (see **Section 4** for the dataset as it was archived).

---

## Section 1 — Markup (`index.html`, inside `<section id="experience">`)

```html
<section id="experience">
  <div class="container">
    <span class="sec-label" data-aos="fade-up">Career</span>
    <h2 class="section-title" data-aos="fade-up" data-aos-delay="50">Experience &amp; Education</h2>
    <div class="accent-line" data-aos="fade-up" data-aos-delay="100"></div>

    <div class="xp-chart-wrap" data-aos="fade-up" data-aos-delay="120">
      <div class="xp-legend">
        <span class="xp-leg xp-leg-work"><i></i>Work Experience</span>
        <span class="xp-leg xp-leg-edu"><i></i>Education</span>
      </div>
      <div class="xp-scroll">
        <div class="xp-track" id="xp-track">
          <div id="xp-stage" class="xp-stage"></div>
        </div>
        <div id="xp-tooltip" class="xp-tooltip"></div>
      </div>
    </div>
  </div>
</section>
```

---

## Section 2 — Styles (`style.css`, replaces the `.tl-v-*` block)

```css
/* ── EXPERIENCE ──────────────────────────────────────────────── */
#experience{padding:100px 0;background:var(--bg);border-top:1px solid var(--border)}

/* ── Experience / Education area chart ── */
.xp-chart-wrap{margin:42px auto 0;max-width:1180px}
.xp-legend{display:flex;align-items:center;gap:24px;justify-content:center;flex-wrap:wrap;margin-bottom:18px}
.xp-leg{display:inline-flex;align-items:center;gap:8px;font-size:12.5px;font-weight:600;color:var(--text2)}
.xp-leg i{width:24px;height:11px;border-radius:3px;display:inline-block}
.xp-leg-work i{background:var(--blue)}
.xp-leg-edu i{background:#0db4f2}
.xp-leg-hint{font-size:11px;font-weight:500;color:var(--text2);opacity:.7;font-style:italic}

.xp-scroll{position:relative;width:100%;overflow:visible}
.xp-track{position:relative;width:100%;overflow-x:auto;overflow-y:hidden;
  height:clamp(228px,37vh,372px);border:1px solid var(--border);border-radius:var(--r2,20px);
  background:linear-gradient(180deg,var(--card),var(--bg));box-shadow:var(--shadow);
  scrollbar-width:thin;scrollbar-color:#c3c8d4 transparent;-webkit-overflow-scrolling:touch}
.xp-track::-webkit-scrollbar{height:9px}
.xp-track::-webkit-scrollbar-track{background:rgba(0,0,0,.04);border-radius:100px;margin:0 14px}
.xp-track::-webkit-scrollbar-thumb{background:#c3c8d4;border-radius:100px;border:2px solid transparent;background-clip:padding-box}
.xp-track::-webkit-scrollbar-thumb:hover{background:#a9b0c0}
.xp-stage{position:relative;height:100%;min-width:1360px}
.xp-chart-svg{display:block;width:100%}

/* axis */
.xp-baseline{stroke:var(--border);stroke-width:1.5}
.xp-grid{stroke:var(--border);stroke-width:1;stroke-dasharray:2 6;opacity:.6}
.xp-mtick{stroke:var(--border);stroke-width:1;opacity:.7}
.xp-tick{fill:var(--text2);font-family:'Manrope',sans-serif}
.xp-tick-year{font-size:12.5px;font-weight:800;fill:var(--text)}
.xp-tick-month{font-size:9.5px;font-weight:600;fill:var(--text2);opacity:.75}

/* hills */
.xp-hill{cursor:pointer}
.xp-hill .xp-area{transition:opacity .35s ease}
.xp-hill .xp-line{stroke-width:2;opacity:.85;transition:stroke-width .2s ease,opacity .35s ease}
.xp-guide{stroke-width:1.5;stroke-dasharray:3 4;opacity:0;transition:opacity .25s ease}
.xp-peakdot{opacity:0;transition:opacity .25s ease;filter:drop-shadow(0 2px 4px rgba(0,0,0,.18))}
.xp-hill.xp-active .xp-line{stroke-width:3.2;opacity:1}
.xp-hill.xp-active .xp-guide,.xp-hill.xp-active .xp-peakdot{opacity:.9}
.is-hovering .xp-hill:not(.xp-active) .xp-area{opacity:.12}
.is-hovering .xp-hill:not(.xp-active) .xp-line{opacity:.15}

/* connector: pill ←→ hill peak */
.xp-connect{opacity:.55;transition:opacity .3s ease}
.xp-connect-line{stroke-width:2;stroke-linecap:round}
.xp-connect.xp-c-active{opacity:1}
.xp-connect.xp-c-active .xp-connect-line{stroke-width:2.6}
.is-hovering .xp-connect:not(.xp-c-active){opacity:.1}

/* persistent peak labels */
.xp-peak{position:absolute;transform:translate(-50%,-100%);margin-top:-12px;
  display:flex;align-items:center;gap:7px;background:var(--card);border:1px solid var(--border);
  border-radius:100px;padding:4px 9px 4px 4px;box-shadow:0 5px 16px rgba(13,66,242,.12);
  font-size:11px;font-weight:700;color:var(--text);white-space:nowrap;pointer-events:auto;cursor:pointer;
  transition:opacity .35s ease,transform .25s ease;z-index:4}
.xp-peak img{width:22px;height:22px;border-radius:50%;object-fit:contain;background:#fff;border:1px solid var(--border);flex-shrink:0}
.xp-peak-init{width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;color:#fff;flex-shrink:0}
.xp-init-work{background:var(--blue)}
.xp-init-edu{background:#0098cc}
.xp-peak-dur{font-size:9px;font-weight:800;color:#4f4e4e;padding:2px 7px;border-radius:100px;letter-spacing:.02em}
.xp-peak-work .xp-peak-dur{background:#efefef}
.xp-peak-edu .xp-peak-dur{background:#efefef}
.xp-peak.xp-active{transform:translate(-50%,-100%) scale(1.06);box-shadow:0 8px 22px rgba(13,66,242,.2)}
.is-hovering .xp-peak:not(.xp-active){opacity:.18}

/* tooltip */
.xp-tooltip{position:absolute;left:0;top:0;width:300px;max-width:78vw;pointer-events:none;z-index:20;
  background:var(--card);border:1px solid var(--border);border-radius:16px;padding:15px 17px;
  box-shadow:0 20px 54px rgba(13,66,242,.20);opacity:0;
  transform:translate(-50%,-100%) translateY(-6px) scale(.96);transform-origin:bottom center;
  transition:opacity .2s ease,transform .2s ease}
.xp-tooltip.show{opacity:1;transform:translate(-50%,-100%) translateY(0) scale(1)}
.xp-tooltip.below{transform:translate(-50%,0) translateY(6px) scale(.96);transform-origin:top center}
.xp-tooltip.below.show{transform:translate(-50%,0) translateY(0) scale(1)}
.xp-tip-top{display:flex;align-items:center;gap:11px;margin-bottom:11px}
.xp-tip-logo{width:42px;height:42px;border-radius:12px;overflow:hidden;flex-shrink:0;border:1px solid var(--border);background:#fff;display:flex;align-items:center;justify-content:center}
.xp-tip-logo img{width:100%;height:100%;object-fit:contain;padding:3px}
.xp-tip-init{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;color:#fff}
.xp-tip-head{min-width:0}
.xp-tip-role{font-family:'Raleway',sans-serif;font-weight:700;font-size:.95rem;color:var(--text);line-height:1.2}
.xp-tip-co{font-size:11.5px;font-weight:600;color:var(--text2);margin-top:2px}
.xp-tip-now{margin-left:auto;align-self:flex-start;padding:3px 9px;background:rgba(13,180,242,.12);color:#0098cc;border:1px solid rgba(13,180,242,.35);border-radius:100px;font-size:9.5px;font-weight:700;white-space:nowrap}
.xp-tip-meta{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:11px}
.xp-tip-date{font-size:11px;font-weight:600;color:var(--text2)}
.xp-tip-badge{font-size:9.5px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;padding:3px 9px;border-radius:100px}
.xp-tip-work .xp-tip-badge{background:#0d42f212;color:var(--blue);border:1px solid #0d42f226}
.xp-tip-edu .xp-tip-badge{background:rgba(13,180,242,.10);color:#0098cc;border:1px solid rgba(13,180,242,.25)}
.xp-tip-work .xp-tip-role{color:var(--text)}
.xp-tip-bullets{list-style:none;display:grid;gap:5px;margin:0;padding:0}
.xp-tip-bullets li{font-size:11.5px;color:var(--text2);line-height:1.5;padding-left:14px;position:relative}
.xp-tip-bullets li::before{content:'';position:absolute;left:0;top:7px;width:5px;height:5px;border-radius:50%}
.xp-tip-work .xp-tip-bullets li::before{background:var(--blue)}
.xp-tip-edu .xp-tip-bullets li::before{background:#0db4f2}
```

---

## Section 3 — Script tag (`index.html`, bottom of `<body>`)

```html
<script src="main.js"></script>
<script src="JS/experience-chart.js"></script>
```

---

## Section 4 — Dataset as archived (`JS/experience-chart.js`, the `XP` array)

`start` / `end` are fractional years (e.g. `2025.42` ≈ June 2025).

> **Note:** this archived dataset still contains the **Bizmorphic Research** and
> **Chapter** entries, and lists **The Factual** as starting Jun 2026. The live
> timeline drops Bizmorphic and Chapter, ends OneIOT at Jan 2026, and starts
> The Factual at **Jan 2026 – Present**. Reconcile these before restoring.

```js
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
    loc: 'Bizmorphic Research', logo: 'Images/companies/bizmorphic_research_logo.jpeg',
    start: 2026.00, end: 2026.42, label: 'Jan 2026 – May 2026',
    dur: '5 mos', type: 'Work',
    bullets: ['Role details coming soon.']
  },
  {
    cat: 'work', name: 'Chapter', role: 'Software Engineer',
    logo: 'Images/companies/chapter_logo.png',
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
    bullets: [
      'Built telehealth infrastructure connecting a doctor network to B2B telehealth brands.',
      'Owned a project end-to-end — designed the backend on Redis, Kafka and Postgres.',
      'Developed a cross-platform affiliate system for brand sponsorships and influencer videos.',
      'Designed an AI image/video generation platform with multi-provider strategy and fallbacks.',
      'Implemented Grafana, Meta Pixel and PostHog with cross-domain tracking scripts.'
    ]
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
```
