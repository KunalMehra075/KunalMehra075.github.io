// ─── LENIS SMOOTH SCROLL ────────────────────────────────────────────────
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
  /* Lenis preventDefault()s wheel events on the whole document, and stop()
     does not release that — so the fixed project overlay could never scroll
     natively. `prevent` makes Lenis ignore events originating inside it. */
  prevent: (node) =>
    node.id === "project-detail" ||
    (node.closest && !!node.closest("#project-detail")),
});

lenis.on("scroll", ScrollTrigger.update);

gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});

gsap.ticker.lagSmoothing(0);

// ─── AOS ───────────────────────────────────────────────────────────────
AOS.init({ duration: 700, easing: "ease-out-cubic", once: true, offset: 60 });

// NOTE: this used to read --blue, which was renamed to --ink during the
// monochrome pass — it had been resolving to "" ever since. The dots sit on
// the dark projects band, so they take the lifted violet.
const primaryColor =
  getComputedStyle(document.documentElement)
    .getPropertyValue("--violet-lift")
    .trim() || "#8f83e4";
const dotIdleColor = "rgba(255,255,255,.22)";

// ─── NAVBAR ────────────────────────────────────────────────────────────
document.getElementById("navToggle").addEventListener("click", () => {
  const open = document.getElementById("navLinks").classList.toggle("open");
  // The drawer overlay is white. While it is open the bar has to drop its
  // hero treatment (white brand + white hamburger) or both vanish into it.
  document.getElementById("navbar").classList.toggle("menu-open", open);
});
function closeNav() {
  document.getElementById("navLinks").classList.remove("open");
  document.getElementById("navbar").classList.remove("menu-open");
}
// ─── NAVBAR: flush ⇄ floating bar ──────────────────────────────────────
// At rest the header is transparent and full-width so it reads as part of
// the black hero; past the trip point it condenses into a glass pill. The
// styling all lives in CSS — this only owns the boolean. Shares its
// threshold with the top progressive blur so both arrive together.
const NAV_STICK_AT = 64;
(function () {
  const nav = document.getElementById("navbar");
  if (!nav) return;

  /* The glass takes its colour from whatever it is over. Above the black
     sections it settles to a mid grey, and the links — grey by default —
     lose their contrast against it. Over those stretches only, the links
     go to ink. Listed by element rather than by scroll offset so the trip
     points survive any section growing or being reordered. */
  const darkEls = ["#shape-hero", "#web-projects-wrapper", "footer"]
    .map((sel) => document.querySelector(sel))
    .filter(Boolean);

  const onScroll = () => {
    const past = window.scrollY > NAV_STICK_AT;
    nav.classList.toggle("is-stuck", past);
    // .scrolled also un-hides the scrollbar, which is sunk into the black
    // hero at rest — see the ::-webkit-scrollbar rules in style.css
    document.documentElement.classList.toggle("scrolled", past);

    // test the bar's own midline, so the swap lands when the bar is half
    // onto the dark block rather than when its first pixel touches
    let overDark = false;
    if (past) {
      const band = nav.getBoundingClientRect();
      const mid = band.top + band.height / 2;
      overDark = darkEls.some((el) => {
        const r = el.getBoundingClientRect();
        return r.top <= mid && r.bottom >= mid;
      });
    }
    nav.classList.toggle("over-dark", overDark);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
})();


// ─── PROJECT DATA ──────────────────────────────────────────────────────
/* Tech icons, same devicon source the skills grid uses. Anything not listed
   falls back to a text pill, so an unknown stack entry degrades instead of
   rendering a broken image. */
const DEVICON = "https://cdn.jsdelivr.net/gh/devicons/devicon/icons";
const TECH_ICONS = {
  "React": DEVICON + "/react/react-original.svg",
  "React Native": DEVICON + "/react/react-original.svg",
  "Node.js": DEVICON + "/nodejs/nodejs-original.svg",
  "Express": DEVICON + "/express/express-original.svg",
  "MongoDB": DEVICON + "/mongodb/mongodb-original.svg",
  "Bootstrap": DEVICON + "/bootstrap/bootstrap-original.svg",
  "HTML": DEVICON + "/html5/html5-original.svg",
  "CSS": DEVICON + "/css3/css3-original.svg",
  "JavaScript": DEVICON + "/javascript/javascript-original.svg",
  "TypeScript": DEVICON + "/typescript/typescript-original.svg",
  "Tailwind CSS": DEVICON + "/tailwindcss/tailwindcss-original.svg",
  "Go": DEVICON + "/go/go-original-wordmark.svg",
  "Vite": DEVICON + "/vitejs/vitejs-original.svg",
  "WebSocket": DEVICON + "/socketio/socketio-original.svg",
  "Redux": DEVICON + "/redux/redux-original.svg",
  "Firebase": DEVICON + "/firebase/firebase-plain.svg",
  "Ant Design": DEVICON + "/antdesign/antdesign-original.svg",
};

const ICON_EXTERNAL =
  '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>';
const ICON_ARROW =
  '<svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 6.5h11M6.5 1l5.5 5.5-5.5 5.5"/></svg>';
const ICON_GITHUB =
  '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58v-2.23c-3.34.73-4.04-1.42-4.04-1.42-.55-1.39-1.33-1.76-1.33-1.76-1.09-.75.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6.01 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.25 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.49 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58A12 12 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>';

/* withLabel=false gives an icon-only chip. Cards use that: a six-item stack
   would otherwise wrap to two rows and overflow their fixed height. The
   detail view has the room, so it shows icon + name. */
/* Devicon ships a few marks as solid black artwork. Both chip surfaces are
   dark, so these get inverted to white or they disappear entirely. */
const DARK_GLYPH_ICONS = new Set(["Express", "WebSocket"]);

function techChip(name, withLabel) {
  const icon = TECH_ICONS[name];
  if (!icon) return '<span class="tag tech-chip-text">' + name + "</span>";
  return (
    '<span class="tech-chip' + (withLabel ? "" : " tech-chip-icon") +
    '" title="' + name + '">' +
    '<img class="' + (DARK_GLYPH_ICONS.has(name) ? "tech-icon-invert" : "") +
    '" src="' + icon + '" alt="' + name + '" loading="lazy"/>' +
    (withLabel ? '<span class="tech-chip-name">' + name + "</span>" : "") +
    "</span>"
  );
}

const projectData = [
  {
    title: "Alpha Shorts",
    desc: "A dashboard that takes a short video from an idea all the way to a published YouTube upload. It helps write the script, make the voice over, time the captions, pick the clips, edit on a timeline, render the video and post it.",
    features: [
      "Writes a script from a topic, or you can paste your own",
      "Turns the script into a voice over and lets you tune the voice",
      "Times captions to every spoken word, then renders them as a styled overlay",
      "Search stock photos and clips, or generate an image for a scene",
      "Timeline editor for clips, images, sound effects and background music",
      "Uploads to YouTube with a title, description and tags",
      "Shows views, watch time, subscribers and retention after posting",
    ],
    stack: ["React", "Node.js", "Express", "Tailwind CSS", "Remotion", "FFmpeg"],
    meta: {
      Type: "Individual Project",
      Duration: "5 Days",
      Category: "Video Automation",
    },
    // runs locally against your own API keys, so there is no hosted demo
    site: null,
    github: "https://github.com/KunalMehra075/Alpha-shorts",
    img: "Images/projects/web/alpha-shorts/1.webp",
    gallery: [
      "Images/projects/web/alpha-shorts/1.webp",
      "Images/projects/web/alpha-shorts/2.webp",
      "Images/projects/web/alpha-shorts/3.webp",
      "Images/projects/web/alpha-shorts/4.webp",
      "Images/projects/web/alpha-shorts/5.webp",
      "Images/projects/web/alpha-shorts/6.webp",
      "Images/projects/web/alpha-shorts/7.webp",
      "Images/projects/web/alpha-shorts/8.webp",
      "Images/projects/web/alpha-shorts/9.webp",
      "Images/projects/web/alpha-shorts/10.webp",
      "Images/projects/web/alpha-shorts/11.webp",
      "Images/projects/web/alpha-shorts/12.webp",
    ],
  },
  {
    title: "MyCal.com",
    desc: "Calendly.com clone for scheduling appointments, meetings and events. Built in 5 days as a group project with full calendar integration.",
    features: [
      "Create and manage events on calendar",
      "Day, week, and month views",
      "Google Auth login",
      "Workflow automation with email reminders",
      "Shared scheduling links",
    ],
    stack: [
      "HTML",
      "CSS",
      "JavaScript",
      "Node.js",
      "MongoDB",
      "FullCalendar.js",
    ],
    meta: {
      Type: "Group Project",
      Duration: "5 Days",
      Category: "Scheduling App",
    },
    site: "https://mycal-704.netlify.app/",
    github: "https://github.com/KunalMehra075/MyCal.com-Frontend",
    img: "Images/projects/web/mycal/cover.webp",
    gallery: [
      "Images/projects/web/mycal/home-page.webp",
      "Images/projects/web/mycal/home-page2.webp",
      "Images/projects/web/mycal/dashboard.webp",
      "Images/projects/web/mycal/calendar.webp",
      "Images/projects/web/mycal/calendarweekview.webp",
      "Images/projects/web/mycal/fullcalendar.webp",
      "Images/projects/web/mycal/createevent1.webp",
      "Images/projects/web/mycal/createevent2.webp",
      "Images/projects/web/mycal/workfflow.webp",
      "Images/projects/web/mycal/googleauth.webp",
    ],
  },
  {
    title: "TokensPoker",
    desc: "Planning poker built for the AI era. Teams estimate a task in tokens, cost, days or model choice, vote privately, then reveal together over WebSockets.",
    features: [
      "Four estimation modes: AI tokens, AI cost, engineering days, best model",
      "Private voting with a simultaneous owner-triggered reveal",
      "Rooms with a short shareable code and invite links",
      "Frictionless identity, no password and no OTP",
      "Live presence, votes and decisions pushed over WebSockets",
      "Final decision per task, archived to a per-room history",
    ],
    stack: ["React", "TypeScript", "Tailwind CSS", "Vite", "Go", "MongoDB", "WebSocket"],
    meta: {
      Type: "Individual Project",
      Category: "Realtime Team Tool",
      Status: "V1 MVP complete",
    },
    // not deployed yet, so the card and detail view fall back to the repo
    site: null,
    github: "https://github.com/KunalMehra075/TokensPoker",
    img: "Images/projects/web/tokenspoker/hero.webp",
    gallery: [
      "Images/projects/web/tokenspoker/hero.webp",
      "Images/projects/web/tokenspoker/2.webp",
    ],
  },
  {
    title: "Ace Legal Services",
    desc: "Legal appointment booking system connecting users with lawyers. Original project built in 6 days as a group of 5.",
    features: [
      "Lawyer search and filter by specialization",
      "Appointment booking for future dates",
      "Google Auth and OTP-based password reset",
      "Admin CRUD dashboard",
      "User and lawyer dashboards",
    ],
    stack: ["React", "Node.js", "Express", "MongoDB", "Ant Design"],
    meta: {
      Type: "Group Project (5)",
      Duration: "6 Days",
      Category: "Booking System",
    },
    site: "https://acelegalservices.vercel.app/",
    github: "https://github.com/Mr-Soni532/young-zinc-6102",
    img: "Images/projects/web/acelegal/cover.webp",
    gallery: [
      "Images/projects/web/acelegal/home1.webp",
      "Images/projects/web/acelegal/home2.webp",
      "Images/projects/web/acelegal/lawyers.webp",
      "Images/projects/web/acelegal/login.webp",
      "Images/projects/web/acelegal/signup.webp",
      "Images/projects/web/acelegal/adminpanel.webp",
      "Images/projects/web/acelegal/admin2.webp",
    ],
  },
  {
    title: "OrangeFry.com",
    desc: "An Indian online marketplace for furniture and home decor. Full CRUD, Google Auth, admin panel, user reviews and complete checkout flow.",
    features: [
      "Full CRUD for products, users and comments",
      "Google Auth & email/password signup",
      "Admin panel for product and order management",
      "User reviews and star ratings",
      "Responsive design with Bootstrap",
      "Order summary and checkout flow",
    ],
    stack: ["React", "Node.js", "Express", "MongoDB", "Bootstrap"],
    meta: {
      Type: "Individual Project",
      Duration: "6 Days",
      Category: "E-Commerce Clone",
    },
    site: "https://orangefry.netlify.app/",
    github: "https://github.com/KunalMehra075/tame-ink-7589",
    img: "Images/projects/web/orangefry/cover.webp",
    gallery: [
      "Images/projects/web/orangefry/home1.webp",
      "Images/projects/web/orangefry/home2.webp",
      "Images/projects/web/orangefry/home3.webp",
      "Images/projects/web/orangefry/allproducts2.webp",
      "Images/projects/web/orangefry/oneproduct2.webp",
      "Images/projects/web/orangefry/review-and-feedback.webp",
      "Images/projects/web/orangefry/adress.webp",
      "Images/projects/web/orangefry/checkout.webp",
      "Images/projects/web/orangefry/order-summary.webp",
      "Images/projects/web/orangefry/admin-page.webp",
      "Images/projects/web/orangefry/edit-product.webp",
    ],
  },
];


// Card tech rows are rendered from projectData so the icons and the detail
// view can never drift apart. Cards are in DOM order, matching the array.
(function () {
  document.querySelectorAll("#web-projects-track .proj-card").forEach((card, i) => {
    const slot = card.querySelector(".proj-stack");
    const p = projectData[i];
    if (slot && p) slot.innerHTML = p.stack.map((t) => techChip(t, false)).join("");
  });
})();

(function () {
  gsap.registerPlugin(ScrollTrigger);

  const WRAPPER = document.getElementById("web-projects-wrapper");
  const TRACK = document.getElementById("web-projects-track");
  const DOTS = document.getElementById("projDots");
  const TOTAL = TRACK.querySelectorAll(".proj-card").length;

  // ── Build pill dots ────────────────────────────────────────────────
  const dots = Array.from({ length: TOTAL }, (_, i) => {
    const d = document.createElement("span");
    d.className = "proj-dot";
    DOTS.appendChild(d);
    return d;
  });

  let lastDot = 0;
  function setDot(i) {
    if (i === lastDot) return;
    gsap.to(dots[lastDot], {
      width: 6,
      backgroundColor: dotIdleColor,
      duration: 0.35,
      ease: "power2.out",
    });
    gsap.to(dots[i], {
      width: 28,
      backgroundColor: primaryColor,
      duration: 0.35,
      ease: "power2.out",
    });
    lastDot = i;
  }
  // Set first dot immediately
  gsap.set(dots[0], { width: 28, backgroundColor: primaryColor });

  // ── ScrollTrigger pins #web-projects-sticky via the wrapper ────────
  // The wrapper needs enough height for the full pan range
  const SCROLL_PER_CARD = 600;
  const PAN_RANGE = SCROLL_PER_CARD * (TOTAL - 1);

  // GSAP pin adds the spacer automatically — we just set wrapper min-height
  // so the pin has room to scroll through all cards
  // WRAPPER.style.paddingBottom = PAN_RANGE + "px";

  // On mobile we skip the scroll-hijack entirely — cards stack vertically
  // (see the max-width:768px rules in style.css). The pin/pan only runs on
  // larger screens, and rebuilds itself on resize via gsap.matchMedia.
  const mm = gsap.matchMedia();
  mm.add("(min-width: 769px)", () => {
    const st = ScrollTrigger.create({
      trigger: "#web-projects-sticky",
      start: "top top",
      end: `+=${PAN_RANGE}`,
      pin: true, // GSAP pins the sticky panel and adds spacer automatically
      pinSpacing: true,
      scrub: 1, // smooth 1s lag behind scroll — feels natural
      onUpdate(self) {
        const pannable =
          TRACK.scrollWidth - TRACK.parentElement.offsetWidth + 160;
        gsap.set(TRACK, { x: -(self.progress * pannable) });

        const activeIdx = Math.min(
          TOTAL - 1,
          Math.round(self.progress * (TOTAL - 1)),
        );
        setDot(activeIdx);
      },
    });

    // cleanup when leaving the desktop breakpoint: kill the trigger and
    // clear the inline transform so the vertical stack lays out cleanly
    return () => {
      st.kill();
      gsap.set(TRACK, { clearProps: "transform" });
    };
  });
})();
// ─── PROJECT DETAIL ────────────────────────────────────────────────────
/* ── PROJECT DETAIL ──────────────────────────────────────────────────── */
let pdGallery = [];
let pdSlide = 0;

function pdRender() {
  const track = document.getElementById("pdTrack");
  const dots = document.getElementById("pdDots");
  if (!track) return;
  /* The track's own box is one slide wide (slides are flex:0 0 100% and
     overflow it), so a percentage translate steps by exactly one slide.
     Dividing by the slide count would move a fraction of one image. */
  track.style.transform = "translateX(-" + pdSlide * 100 + "%)";
  dots.innerHTML = pdGallery
    .map(
      (_, i) =>
        '<button class="pd-dot' + (i === pdSlide ? " active" : "") +
        '" onclick="pdGoTo(' + i + ')" aria-label="Screenshot ' + (i + 1) + '"></button>',
    )
    .join("");
  document.getElementById("pdCount").textContent =
    pdSlide + 1 + " / " + pdGallery.length;
}

function pdGoTo(i) {
  if (!pdGallery.length) return;
  pdSlide = (i + pdGallery.length) % pdGallery.length;
  pdRender();
}
function pdSlideDir(d) { pdGoTo(pdSlide + d); }

function openProject(idx) {
  const p = projectData[idx];
  document.getElementById("pdTitle").textContent = p.title;
  document.getElementById("pdDesc").textContent = p.desc;

  // carousel: fall back to the single hero image when a project has no gallery
  pdGallery = p.gallery && p.gallery.length ? p.gallery : [p.img];
  pdSlide = 0;
  document.getElementById("pdTrack").innerHTML = pdGallery
    .map(
      (src) =>
        '<div class="pd-slide"><img src="' + src + '" alt="' + p.title +
        ' screenshot" loading="lazy" onerror="this.closest(\'.pd-slide\').classList.add(\'is-missing\')"/></div>',
    )
    .join("");
  // a single-shot gallery has nothing to page through
  document.getElementById("pdCarousel").classList.toggle("is-single", pdGallery.length < 2);
  pdRender();

  document.getElementById("pdFeatures").innerHTML = p.features
    .map((f) => "<li>" + f + "</li>")
    .join("");
  document.getElementById("pdStack").innerHTML = p.stack
    .map((t) => techChip(t, true))
    .join("");
  document.getElementById("pdMeta").innerHTML = Object.entries(p.meta)
    .map(
      ([k, v]) =>
        '<div class="pd-meta-row"><span class="pd-meta-key">' + k +
        '</span><span class="pd-meta-val">' + v + "</span></div>",
    )
    .join("");

  /* The primary action always carries the violet gradient. With no live site
     (TokensPoker) GitHub is promoted into that slot rather than leaving the
     page with only a secondary button. */
  const live = p.site
    ? '<a href="' + p.site + '" target="_blank" rel="noopener" class="btn-primary" style="justify-content:center;">' +
      ICON_EXTERNAL + "Live Site</a>"
    : "";
  document.getElementById("pdLinks").innerHTML =
    live +
    '<a href="' + p.github + '" target="_blank" rel="noopener" class="' +
    (p.site ? "btn-outline" : "btn-primary") +
    '" style="justify-content:center;">' + ICON_GITHUB + "GitHub</a>";

  const pd = document.getElementById("project-detail");
  pd.classList.add("open");
  pd.scrollTop = 0;
  document.body.style.overflow = "hidden";
  lenis.stop();
}


function closeProject() {
  document.getElementById("project-detail").classList.remove("open");
  document.body.style.overflow = "";
  lenis.start();
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeProject();
});

// ─── MOBILE APPS ───────────────────────────────────────────────────────
// Full Android robot, drawn from primitives. The eyes are subpaths on the
// head with fill-rule:evenodd so they punch through as holes — a solid fill
// would only work against one specific background.
const ANDROID_SVG = `
<svg class="phone-wip-icon" viewBox="0 0 1200 1200" aria-hidden="true" focusable="false">
  <path d="M395 20 L465 116" stroke="currentColor" stroke-width="44" stroke-linecap="round" fill="none"/>
  <path d="M805 20 L735 116" stroke="currentColor" stroke-width="44" stroke-linecap="round" fill="none"/>
  <path fill-rule="evenodd" d="M270 312 a330 330 0 0 1 660 0 z
    M429 222 a36 36 0 1 0 72 0 a36 36 0 1 0 -72 0
    M699 222 a36 36 0 1 0 72 0 a36 36 0 1 0 -72 0"/>
  <path d="M265 358 h670 v545 a58 58 0 0 1 -58 58 h-554 a58 58 0 0 1 -58 -58 z"/>
  <rect x="120" y="358" width="96" height="480" rx="48"/>
  <rect x="984" y="358" width="96" height="480" rx="48"/>
  <path d="M360 1000 h195 v105 a97 97 0 0 1 -195 0 z"/>
  <path d="M645 1000 h195 v105 a97 97 0 0 1 -195 0 z"/>
</svg>`;

const appData = [
  {
    stack: ["React Native", "WebSocket"],
    live: "https://bucketick.com",
    screens: [
      "Images/projects/mobile/bucketick/1.webp",
      "Images/projects/mobile/bucketick/2.webp",
      "Images/projects/mobile/bucketick/3.webp",
      "Images/projects/mobile/bucketick/4.webp",
      "Images/projects/mobile/bucketick/5.webp",
      "Images/projects/mobile/bucketick/6.webp",
      "Images/projects/mobile/bucketick/7.webp",
    ],
  },
  // no screens to show yet — these render the Android placeholder instead
  { wip: true, stack: ["React Native", "MongoDB"] },
  { wip: true, stack: ["React Native", "REST API"] },
  { wip: true, stack: ["React Native", "Firebase"] },
];


/* Tech rows are rendered from appData so they cannot drift from it. Apps with
   a shipped site also get a live link, which must stopPropagation or clicking
   it would just select the card underneath. */
(function () {
  const ICON_OPEN =
    '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>';
  document.querySelectorAll(".app-item").forEach((card, i) => {
    const app = appData[i];
    if (!app) return;
    const slot = card.querySelector(".app-item-stack");
    if (slot && app.stack) {
      slot.innerHTML = app.stack.map((t) => techChip(t, false)).join("");
    }
    if (app.live) {
      const a = document.createElement("a");
      a.className = "app-live";
      a.href = app.live;
      a.target = "_blank";
      a.rel = "noopener";
      a.innerHTML = ICON_OPEN + "Live";
      a.addEventListener("click", (e) => e.stopPropagation());
      card.appendChild(a);
    }
  });
})();

let currentApp = 0;
let currentSlide = 0;
let slideTimer = null;

function selectApp(idx) {
  currentApp = idx;
  currentSlide = 0;
  document
    .querySelectorAll(".app-item")
    .forEach((el, i) => el.classList.toggle("active", i === idx));
  updatePhone();
}

function goToSlide(idx) {
  currentSlide = idx;
  updatePhone();
}

function phoneSlideDir(dir) {
  const screens = appData[currentApp].screens;
  if (!screens || !screens.length) return;   // placeholder app: nothing to page
  const total = screens.length;
  currentSlide = (currentSlide + dir + total) % total;
  updatePhone();
}

function updatePhone() {
  const pt = document.getElementById("phoneTrack");
  const pd = document.getElementById("phoneDots");
  const app = appData[currentApp];

  // apps without screenshots yet show the Android mark + a status line, and
  // lose their dots/autoplay since there is nothing to page through
  if (app.wip) {
    pt.innerHTML =
      '<div class="phone-screen-slide phone-wip">' +
      ANDROID_SVG +
      '<span class="phone-wip-text">development in progress</span></div>';
    pt.style.transform = "translateX(0)";
    pd.innerHTML = "";
    clearInterval(slideTimer);
    return;
  }

  const screens = app.screens;

  pt.innerHTML = screens
    .map(
      (src) =>
        `<div class="phone-screen-slide"><img src="${src}" alt="App Screen"/></div>`,
    )
    .join("");
  pt.style.transform = `translateX(${-currentSlide * 100}%)`;

  pd.innerHTML = screens
    .map(
      (_, i) =>
        `<div class="phone-dot${i === currentSlide ? " active" : ""}" onclick="goToSlide(${i})"></div>`,
    )
    .join("");

  clearInterval(slideTimer);
  slideTimer = setInterval(() => phoneSlideDir(1), 2800);
}

updatePhone();

// ─── TESTIMONIALS ──────────────────────────────────────────────────────
(function () {
  const inner = document.getElementById("testiInner");
  if (!inner) return; // section commented out / not present
  let idx = 0;

  function getCards() {
    return inner.querySelectorAll(".testi-card");
  }
  function update() {
    const cards = getCards();
    if (!cards.length) return;
    inner.style.transform = `translateX(${-idx * (cards[0].offsetWidth + 20)}px)`;
  }

  document.getElementById("testiBtnNext").addEventListener("click", () => {
    const c = getCards().length;
    idx = idx < c - 1 ? idx + 1 : 0;
    update();
  });
  document.getElementById("testiBtnPrev").addEventListener("click", () => {
    const c = getCards().length;
    idx = idx > 0 ? idx - 1 : c - 1;
    update();
  });
  window.addEventListener("resize", update);
})();

// ─── CONTACT FORM ──────────────────────────────────────────────────────
document
  .getElementById("contactForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();
    const btn = document.getElementById("cfSubmit");
    btn.textContent = "Sending…";
    btn.disabled = true;

    const payload = {
      UserName:
        document.getElementById("cfFirst").value +
        " " +
        document.getElementById("cfLast").value,
      UserEmail: document.getElementById("cfEmail").value,
      EmailBody: document.getElementById("cfMsg").value,
    };

    try {
      const res = await fetch(
        "https://my-portfolio-backend-eight.vercel.app/sendmail",
        {
          method: "POST",
          headers: { "Content-type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();
      btn.textContent = data.success
        ? "Sent!"
        : "Failed — try emailing directly";
      if (data.success) e.target.reset();
    } catch (err) {
      btn.textContent = "Error — please email directly";
    }

    setTimeout(() => {
      btn.textContent = "Send Message";
      btn.disabled = false;
    }, 3000);
  });



document.querySelectorAll(".threecard").forEach((main) => {
  gsap.set(main, { perspective: 650 });

  const outerRX = gsap.quickTo(main.querySelector(".threecard-outer"), "rotationX", { ease: "power3" });
  const outerRY = gsap.quickTo(main.querySelector(".threecard-outer"), "rotationY", { ease: "power3" });
  const innerX = gsap.quickTo(main.querySelectorAll(".threecard-inner"), "x", { ease: "power3" });
  const innerY = gsap.quickTo(main.querySelectorAll(".threecard-inner"), "y", { ease: "power3" });

  main.addEventListener("pointermove", (e) => {
    outerRX(gsap.utils.interpolate(30, -30, e.y / window.innerHeight));
    outerRY(gsap.utils.interpolate(-30, 30, e.x / window.innerWidth));
    innerX(gsap.utils.interpolate(-30, 30, e.x / window.innerWidth));
    innerY(gsap.utils.interpolate(-30, 30, e.y / window.innerHeight));
  });

  main.addEventListener("pointerleave", () => {
    outerRX(0);
    outerRY(0);
    innerX(0);
    innerY(0);
  });
});


/* ═══════════════════════════════════════════════════════════════
   SKILLS SECTION  —  skills.js
   Requires: GSAP 3 (loaded before this file)
   ═══════════════════════════════════════════════════════════════ */

/* ── Skill definitions ───────────────────────────────────────── */
/*
   icon: URL to SVG/PNG. Using devicons CDN for accuracy.
         Replace any icon with your own local path e.g. "Images/skills/stack/icons/react-svgrepo-com.svg"
   color: one of sk-c-blue | sk-c-green | sk-c-amber | sk-c-red |
          sk-c-orange | sk-c-purple | sk-c-teal | sk-c-pink |
          sk-c-indigo | sk-c-cyan
*/

const SKILLS = {

  frontend: [
    {
      name: 'React.js',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg',
      color: 'sk-c-blue',
    },
    {
      name: 'Next.js',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg',
      color: 'sk-c-teal',
    },
    {
      name: 'TypeScript',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg',
      color: 'sk-c-blue',
    },
    {
      name: 'JavaScript',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg',
      color: 'sk-c-amber',
    },
    {
      name: 'HTML5',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg',
      color: 'sk-c-red',
    },
    {
      name: 'CSS3',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg',
      color: 'sk-c-blue',
    },
    {
      name: 'Tailwind CSS',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-original.svg',
      color: 'sk-c-cyan',
    },
    {
      name: 'React Native',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg',
      color: 'sk-c-purple',
    },
    {
      name: 'Redux',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/redux/redux-original.svg',
      color: 'sk-c-purple',
    },
    // {
    //   name: 'Electron',
    //   icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/electron/electron-original.svg',
    //   color: 'sk-c-teal',
    // },
    // {
    //   name: 'ShadCN',
    //   icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg',
    //   color: 'sk-c-indigo',
    // },
  ],

  backend: [
    {
      name: 'Node.js',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg',
      color: 'sk-c-green',
    },
    {
      name: 'NestJS',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nestjs/nestjs-original.svg',
      color: 'sk-c-red',
    },
    {
      name: 'Express',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/express/express-original.svg',
      color: 'sk-c-teal',
    },
    {
      name: 'Python',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg',
      color: 'sk-c-amber',
    },
    {
      name: 'Django',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/django/django-plain.svg',
      color: 'sk-c-green',
    },
    {
      name: 'GraphQL',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/graphql/graphql-plain.svg',
      color: 'sk-c-pink',
    },
    {
      name: 'Spring Boot',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/spring/spring-original.svg',
      color: 'sk-c-green',
    },
    {
      name: 'Java',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg',
      color: 'sk-c-orange',
    },
    {
      name: 'Golang',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/go/go-original.svg',
      color: 'sk-c-cyan',
    },
  ],

  data: [
    {
      name: 'MongoDB',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg',
      color: 'sk-c-green',
    },
    {
      name: 'MySQL',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg',
      color: 'sk-c-blue',
    },
    {
      name: 'CassandraDB',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cassandra/cassandra-original.svg',
      color: 'sk-c-indigo',
    },
    {
      name: 'Redis',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/redis/redis-original.svg',
      color: 'sk-c-red',
    },
    {
      name: 'AWS',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-plain-wordmark.svg',
      color: 'sk-c-orange',
    },
    {
      name: 'Firebase',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/firebase/firebase-plain.svg',
      color: 'sk-c-amber',
    },
    {
      name: 'Docker',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg',
      color: 'sk-c-blue',
    },
    {
      name: 'Jenkins',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/jenkins/jenkins-original.svg',
      color: 'sk-c-red',
    },
    {
      name: 'Serverless',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-plain-wordmark.svg',
      color: 'sk-c-cyan',
    },
  ],

  soft: [
    {
      name: 'Remote Collaboration',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/slack/slack-original.svg',
      color: 'sk-c-purple',
    },
    {
      name: 'Teamwork',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg',
      color: 'sk-c-teal',
    },
    {
      name: 'Leadership',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/confluence/confluence-original.svg',
      color: 'sk-c-amber',
    },
    {
      name: 'Problem Solving',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/stackoverflow/stackoverflow-original.svg',
      color: 'sk-c-orange',
    },
    {
      name: 'Time Management',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/jira/jira-original.svg',
      color: 'sk-c-blue',
    },
  ],

 tools: [
    {
      name: 'GitHub',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg',
      color: 'sk-c-teal',
    },
 
    {
      name: 'Figma',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/figma/figma-original.svg',
      color: 'sk-c-pink',
    },
    {
      name: 'Firebase',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/firebase/firebase-plain.svg',
      color: 'sk-c-amber',
    },
 
    {
      name: 'ChatGPT',
       icon:"Images/skills/tools/chatgpt-logo.webp",
      color: 'sk-c-green',
    },
    {
      name: 'Claude.ai',
      icon: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/claude.svg',
      color: 'sk-c-orange',
    },

    {
      name: 'IntelliJ',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/intellij/intellij-original.svg',
      color: 'sk-c-purple',
    },
    {
      name: 'Cursor',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vscode/vscode-original.svg',
      color: 'sk-c-indigo',
    },
    {
      name: 'Android Studio',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/androidstudio/androidstudio-original.svg',
      color: 'sk-c-green',
    },
    {
      name: 'Draw.io',
       icon:"Images/skills/tools/draw-io.webp",
      color: 'sk-c-amber',
    },
  ],
};

/* ── Card factory ────────────────────────────────────────────── */
function makeCard(skill) {
  const card = document.createElement('div');
  card.className = `sk-card ${skill.color}`;

  card.innerHTML = `
    <div class="sk-card-inner">
      <div class="sk-card-face">
        <img class="sk-icon" src="${skill.icon}" alt="${skill.name}" loading="lazy" />
        <span class="sk-name">${skill.name}</span>
      </div>
    </div>
  `;

  return card;
}

/* ── Populate a grid element with skill cards ────────────────── */
function populateGrid(elementId, skills) {
  const el = document.getElementById(elementId);
  if (!el) return;
  skills.forEach(skill => el.appendChild(makeCard(skill)));
}

/* ── Build all grids ─────────────────────────────────────────── */
function buildGrids() {
  // "All" panel — one grid per category
  populateGrid('grid-all-fe',    SKILLS.frontend);
  populateGrid('grid-all-be',    SKILLS.backend);
  populateGrid('grid-all-db',    SKILLS.data);
  populateGrid('grid-all-soft',  SKILLS.soft);
  populateGrid('grid-all-tools', SKILLS.tools);

  // Individual panels
  populateGrid('grid-fe',    SKILLS.frontend);
  populateGrid('grid-be',    SKILLS.backend);
  populateGrid('grid-db',    SKILLS.data);
  populateGrid('grid-soft',  SKILLS.soft);
  populateGrid('grid-tools', SKILLS.tools);
}

/* ── GSAP 3D tilt ────────────────────────────────────────────── */
function attachTilt(card) {
  const inner = card.querySelector('.sk-card-inner');
  const icon  = card.querySelector('.sk-icon');

  // Quick-to tweens for smooth tracking
  const rx = gsap.quickTo(inner, 'rotationX', { duration: 0.35, ease: 'power2.out' });
  const ry = gsap.quickTo(inner, 'rotationY', { duration: 0.35, ease: 'power2.out' });
  const ix = gsap.quickTo(icon,  'x',         { duration: 0.35, ease: 'power2.out' });
  const iy = gsap.quickTo(icon,  'y',         { duration: 0.35, ease: 'power2.out' });

  gsap.set(inner, { transformPerspective: 700 });

  card.addEventListener('pointermove', e => {
    const rect = card.getBoundingClientRect();
    const nx   = (e.clientX - rect.left)  / rect.width  - 0.5; // -0.5 → +0.5
    const ny   = (e.clientY - rect.top)   / rect.height - 0.5;

    rx(-ny * 26);   // tilt up/down
    ry( nx * 26);   // tilt left/right
    ix( nx * 9);    // icon parallax x
    iy( ny * 9);    // icon parallax y
  });

  card.addEventListener('pointerenter', () => {
    gsap.to(inner, { scale: 1.06, duration: 0.22, ease: 'power2.out' });
  });

  card.addEventListener('pointerleave', () => {
    // Elastic snap-back
    gsap.to(inner, {
      rotationX: 0, rotationY: 0, scale: 1,
      duration: 0.55, ease: 'elastic.out(1, 0.65)',
    });
    ix(0);
    iy(0);
  });
}

/* ── Tab switching ───────────────────────────────────────────── */
function initTabs() {
  const tabs = document.querySelectorAll('.sk-tab');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Deactivate all
      tabs.forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.sk-panel').forEach(p => p.classList.remove('active'));

      // Activate selected
      tab.classList.add('active');
      const panel = document.getElementById('panel-' + tab.dataset.panel);
      if (!panel) return;
      panel.classList.add('active');

      // Entrance animation for newly visible cards
      const cards = panel.querySelectorAll('.sk-card');
      gsap.fromTo(
        cards,
        { opacity: 0, y: 18, scale: 0.88 },
        { opacity: 1, y: 0,  scale: 1, stagger: 0.028, duration: 0.38, ease: 'power3.out' }
      );
    });
  });
}

/* ── Entry animation (runs once on load / AOS substitute) ────── */
function runEntrance() {
  const activePanel = document.querySelector('.sk-panel.active');
  if (!activePanel) return;

  const cards = activePanel.querySelectorAll('.sk-card');
  gsap.fromTo(
    cards,
    { opacity: 0, y: 22, scale: 0.86 },
    { opacity: 1, y: 0,  scale: 1, stagger: 0.03, duration: 0.42, ease: 'power3.out', delay: 0.15 }
  );
}

/* ── Init ─────────────────────────────────────────────────────── */
(function init() {
  buildGrids();

  // Attach tilt to every card (including those in hidden panels — they'll
  // be tilt-ready when their panel is revealed)
  document.querySelectorAll('.sk-card').forEach(attachTilt);

  initTabs();
  runEntrance();
})();
// ─── PROGRESSIVE BLUR ──────────────────────────────────────────────────
// Arms the top/bottom blur strips once the browser is idle, so the
// backdrop-filter paint cost lands after first paint rather than during it.
// The top strip fades in only past ACTIVATE_AFTER px of scroll, so it never
// sits over the hero at rest. See docs/progressive-blur.md.
(function () {
  const topStrip = document.querySelector(".pblur-top");
  if (!topStrip) return;

  // same trip point as the navbar, so the bar and the wash arrive together
  const ACTIVATE_AFTER = NAV_STICK_AT;

  /* While the projects section is pinned for its horizontal scroll it fills
     the viewport, and the bottom wash lands directly on the carousel dots and
     the card actions. Drop the bottom strip for exactly that stretch, then
     bring it back once the section has been scrolled past. */
  const projects = document.getElementById("web-projects-wrapper");
  const root = document.documentElement;

  function syncProjectsPin() {
    if (!projects) return;
    const r = projects.getBoundingClientRect();
    // pinned == the sticky panel currently occupies the whole viewport
    const pinned = r.top <= 1 && r.bottom >= window.innerHeight - 1;
    root.classList.toggle("projects-pinned", pinned);
  }

  function arm() {
    root.classList.add("pb-ready");

    const onScroll = () => {
      topStrip.classList.toggle("is-on", window.scrollY > ACTIVATE_AFTER);
      syncProjectsPin();
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", syncProjectsPin);
  }

  if ("requestIdleCallback" in window) {
    requestIdleCallback(arm, { timeout: 1500 });
  } else {
    setTimeout(arm, 800);
  }
})();

// ─── CV demo clips: pause while off screen ────────────────────────────
// These were 93 MB of GIF, which the browser downloaded in full whether or not
// anyone scrolled that far. As video they are 6 MB, and preload="none" holds
// even that back until the card is near the viewport — the poster frame stands
// in meanwhile.
//
// autoplay stays on the elements so the baseline matches the old GIFs: they
// play on their own, with no script involved. This observer is only an
// optimisation on top — it stops six clips decoding behind the rest of the
// page — so if it never runs, nothing breaks.
(function () {
  const vids = document.querySelectorAll(".cv-video");
  if (!vids.length || !("IntersectionObserver" in window)) return;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        const v = e.target;
        // play() rejects when autoplay is blocked; the poster stays up
        if (e.isIntersecting) v.play().catch(() => {});
        else v.pause();
      });
    },
    { rootMargin: "200px" },
  );
  vids.forEach((v) => io.observe(v));
})();
