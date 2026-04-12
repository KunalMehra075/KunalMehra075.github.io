// ─── AOS ───────────────────────────────────────────────────────────────
AOS.init({ duration: 700, easing: "ease-out-cubic", once: true, offset: 60 });

const primaryColor = getComputedStyle(document.documentElement)
  .getPropertyValue("--blue")
  .trim();

// ─── NAVBAR ────────────────────────────────────────────────────────────
document.getElementById("navToggle").addEventListener("click", () => {
  document.getElementById("navLinks").classList.toggle("open");
});
function closeNav() {
  document.getElementById("navLinks").classList.remove("open");
}
window.addEventListener(
  "scroll",
  () => {
    document.getElementById("navbar").style.boxShadow =
      window.scrollY > 60
        ? "0 6px 32px rgba(13,66,242,.12)"
        : "0 4px 24px rgba(13,66,242,.08)";
  },
  { passive: true },
);


// ─── PROJECT DATA ──────────────────────────────────────────────────────
const projectData = [
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
    img: "Images/ProjectsImgs/orangefry.jpg",
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
    img: "Images/ProjectsImgs/acelegal.png",
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
    img: "Images/ProjectsImgs/mycal.jpg",
  },
  {
    title: "StyleZilla.com",
    desc: "E-commerce fashion store clone of LifestyleStores.com. 800+ brands, megamenu navigation and admin dashboard. Built in 6 days by a group of 5.",
    features: [
      "800+ brands across categories",
      "Complete checkout experience",
      "Admin product and order management",
      "Megamenu navigation and carousels",
      "Login and signup",
    ],
    stack: ["HTML", "CSS", "JavaScript"],
    meta: {
      Type: "Group Project (5)",
      Duration: "6 Days",
      Category: "E-Commerce",
    },
    site: "https://stylezillajs201.netlify.app/",
    github: "https://github.com/SagarN21/urbane-look-6820",
    img: "Images/ProjectsImgs/stylezilla.jpg",
  },
  {
    title: "PlaceMe.com",
    desc: "Naukri.com clone — online job hunting platform for applicants and hirers. Individual project built in 5 days.",
    features: [
      "Job search and filter by category",
      "Favorite/bookmark jobs",
      "Apply for job flow",
      "Login and signup with localStorage",
      "Responsive design with animations",
    ],
    stack: ["HTML", "CSS", "JavaScript"],
    meta: {
      Type: "Individual Project",
      Duration: "5 Days",
      Category: "Job Portal",
    },
    site: "https://placeme750.netlify.app/",
    github: "https://github.com/KunalMehra075/obscene-icicle-4134",
    img: "Images/ProjectsImgs/placeme.png",
  },
];

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
      backgroundColor: "#888",
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

  ScrollTrigger.create({
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
})();
// ─── PROJECT DETAIL ────────────────────────────────────────────────────
function openProject(idx) {
  const p = projectData[idx];
  document.getElementById("pdTitle").textContent = p.title;
  document.getElementById("pdDesc").textContent = p.desc;

  const img = document.getElementById("pdHeroImg");
  img.src = p.img;
  img.onerror = function () {
    this.src =
      "https://placehold.co/1100x360/eef1f8/0d42f2?text=" +
      encodeURIComponent(p.title);
  };

  document.getElementById("pdFeatures").innerHTML = p.features
    .map((f) => `<li>${f}</li>`)
    .join("");
  document.getElementById("pdStack").innerHTML = p.stack
    .map((s) => `<span class="tag tag-blue">${s}</span>`)
    .join("");
  document.getElementById("pdMeta").innerHTML = Object.entries(p.meta)
    .map(
      ([k, v]) =>
        `<div class="pd-meta-row"><span class="pd-meta-key">${k}</span><span class="pd-meta-val">${v}</span></div>`,
    )
    .join("");
  document.getElementById("pdLinks").innerHTML =
    `<a href="${p.site}" target="_blank" class="btn-primary" style="justify-content:center;">Live Site <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 6.5h11M6.5 1l5.5 5.5-5.5 5.5"/></svg></a>` +
    `<a href="${p.github}" target="_blank" class="btn-outline" style="justify-content:center;">GitHub <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 6.5h11M6.5 1l5.5 5.5-5.5 5.5"/></svg></a>`;

  const pd = document.getElementById("project-detail");
  pd.classList.add("open");
  pd.scrollTop = 0;
  document.body.style.overflow = "hidden";
}

function closeProject() {
  document.getElementById("project-detail").classList.remove("open");
  document.body.style.overflow = "";
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeProject();
});

// ─── MOBILE APPS ───────────────────────────────────────────────────────
const appData = [
  {
    screens: [
      "https://placehold.co/244x500/0d42f2/ffffff?text=Video+1",
      "https://placehold.co/244x500/4b0df2/ffffff?text=Video+2",
      "https://placehold.co/244x500/0db4f2/0c0c1e?text=Video+3",
    ],
  },
  {
    screens: [
      "https://placehold.co/244x500/0d42f2/ffffff?text=Hospital+1",
      "https://placehold.co/244x500/4b0df2/ffffff?text=Hospital+2",
      "https://placehold.co/244x500/0db4f2/0c0c1e?text=Hospital+3",
    ],
  },
  {
    screens: [
      "https://placehold.co/244x500/0d42f2/ffffff?text=IoT+1",
      "https://placehold.co/244x500/4b0df2/ffffff?text=IoT+2",
      "https://placehold.co/244x500/0db4f2/0c0c1e?text=IoT+3",
    ],
  },
  {
    screens: [
      "https://placehold.co/244x500/0d42f2/ffffff?text=Event+1",
      "https://placehold.co/244x500/4b0df2/ffffff?text=Event+2",
      "https://placehold.co/244x500/0db4f2/0c0c1e?text=Event+3",
    ],
  },
];

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
  const total = appData[currentApp].screens.length;
  currentSlide = (currentSlide + dir + total) % total;
  updatePhone();
}

function updatePhone() {
  const pt = document.getElementById("phoneTrack");
  const pd = document.getElementById("phoneDots");
  const screens = appData[currentApp].screens;

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
         Replace any icon with your own local path e.g. "Images/techstack/Smolicons/react-svgrepo-com.svg"
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
    }
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
      name: 'VS Code',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vscode/vscode-original.svg',
      color: 'sk-c-blue',
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
      name: 'Netlify',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/netlify/netlify-original.svg',
      color: 'sk-c-teal',
    },
    {
      name: 'ChatGPT',
       icon:"Images/toolset/chatgpt logo.webp",
      color: 'sk-c-green',
    },
    {
      name: 'Claude',
      icon: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/anthropic.svg',
      color: 'sk-c-orange',
    },
    {
      name: 'Gemini',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg',
      color: 'sk-c-blue',
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
       icon:"Images/toolset/draw-io.webp",
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