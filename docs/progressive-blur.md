# Home page — Progressive blur & the color-shifting header

How the bottom-of-screen **progressive blur** works, how to reuse the same
technique for the **header**, and how the marketing **header changes color between
sections**.

Files referenced:

- `src/components/ProgressiveBlur.tsx` — the reusable blur overlay
- `src/components/DeferredEffects.tsx` — where the bottom blur is mounted
- `src/pages/marketing/Home.tsx` / `WeightLoss.tsx` — pages that mount it
- `src/components/home/Nav.tsx` — the header
- `src/components/home/AnnouncementBar.tsx` — the bar the header sits under

---

## 1. The bottom progressive blur

### What "progressive blur" means

A normal `backdrop-blur` is uniform — everything behind it is blurred by the same
amount, with a hard edge where the blur stops. **Progressive** blur ramps the blur
from strong (at the screen edge) to zero (toward the content), so there is no visible
seam. Content appears to gradually come into focus as it scrolls away from the edge.
This is the same effect as Framer's "Progressive Blur" layer.

The trick: you can't animate a single blur radius across a gradient, so instead you
**stack several full-size blur layers**, each with a *different* blur radius, and use a
**gradient mask** to reveal each layer only over a band. Strong-blur layers are masked
to a thin band right at the edge; weak-blur layers extend further into the content.
Where they overlap, the eye reads a smooth blur ramp.

### The component

`ProgressiveBlur.tsx` is a fixed, `pointer-events-none`, `aria-hidden` overlay pinned
to the `bottom` (or `top`) of the viewport.

```tsx
export function ProgressiveBlur({
  side = "bottom",
  height = 140,
  layers = 5,
  maxBlur = 12,
  activateAfter = 0,
  className = "",
}: Props) { ... }
```

| Prop | Meaning |
|---|---|
| `side` | `"bottom"` (default) or `"top"` — which edge to pin to, and which way the mask ramps. |
| `height` | Height of the blur band in px. |
| `layers` | How many stacked blur layers (more = smoother ramp, slightly more GPU). |
| `maxBlur` | Blur radius (px) of the strongest layer, at the very edge. |
| `activateAfter` | Scroll-Y (px) before the overlay fades in. `0` = always visible. |

**How each layer is built** (the core loop):

```tsx
{Array.from({ length: layers }).map((_, i) => {
  const t = (i + 1) / layers;                 // 0..1, this layer's "strength"
  const blur = +(maxBlur * t).toFixed(1);     // strongest layer = maxBlur

  // Strong layers occupy a SMALLER band near the edge.
  const opaqueTo = Math.round((1 - t) * 100);          // fully visible edge -> this %
  const fadeTo   = Math.min(opaqueTo + Math.round(100 / layers), 100);
  const mask = `linear-gradient(${gradientDir}, #000 ${opaqueTo}%, transparent ${fadeTo}%)`;

  return (
    <div
      className="absolute inset-0"
      style={{
        backdropFilter: `blur(${blur}px)`,
        WebkitMaskImage: mask,   // Safari
        maskImage: mask,
      }}
    />
  );
})}
```

Two ideas do all the work:

1. **`backdropFilter: blur(N)`** blurs whatever is *behind* the layer (the page), not
   the layer's own content (it has none). Each layer gets a different `N`.
2. **`maskImage: linear-gradient(...)`** controls *where* that layer is painted. The
   mask is opaque (`#000`) from the edge up to `opaqueTo%`, then fades to `transparent`
   by `fadeTo%`. So the `maxBlur` layer (`t = 1`) is masked to `0%…~20%` — a thin band
   at the very edge — while the lightest layer (`t = 1/layers`) covers almost the whole
   height. Stacked, the radius appears to ramp from `maxBlur` at the edge to `0` at the
   far side.

`gradientDir` flips with `side`: `to top` for bottom (0% = the bottom edge), `to bottom`
for top (0% = the top edge). That single flip is all that's needed to re-point the ramp.

### Where it's mounted (bottom)

It is **not** rendered directly in the page — it's loaded lazily *after the browser is
idle*, so it never blocks LCP/TTI. `DeferredEffects.tsx`:

```tsx
export function DeferredEffects() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const trigger = () => setReady(true);
    if (requestIdleCallback) requestIdleCallback(trigger, { timeout: 1500 });
    else { const id = setTimeout(trigger, 800); return () => clearTimeout(id); }
  }, []);
  if (!ready) return null;
  return <ProgressiveBlur side="bottom" height={140} layers={5} maxBlur={12} activateAfter={0} />;
}
```

And the page lazy-imports it inside a `Suspense` (`Home.tsx`, `WeightLoss.tsx`):

```tsx
const DeferredEffects = lazy(() =>
  import("@/components/DeferredEffects").then(m => ({ default: m.DeferredEffects })));
// ...
<Suspense fallback={null}><DeferredEffects /></Suspense>
```

Net effect: a soft, always-on 140px blur at the bottom of the viewport that fades the
page content into the browser chrome, loaded off the critical path.

---

## 2. Adding the same blur to the header (top)

The component already supports the top edge — the header blur is one line. You have two
options.

### Option A — a standalone top blur strip (simplest)

Mirror the bottom mount but flip `side` to `"top"`. Because the header should *only*
appear once the user scrolls into content (not over the dark hero), gate it with
`activateAfter`:

```tsx
// in DeferredEffects.tsx (or a HeaderBlur.tsx), alongside the bottom one:
return (
  <>
    <ProgressiveBlur side="top"    height={110} layers={5} maxBlur={10} activateAfter={120} />
    <ProgressiveBlur side="bottom" height={140} layers={5} maxBlur={12} activateAfter={0}   />
  </>
);
```

- `side="top"` pins it to the top and ramps the mask downward (strongest blur at the very
  top edge, fading into the page).
- `activateAfter={120}` fades the strip in only after ~120px of scroll, so it never sits
  over the transparent-hero state of the nav. It uses the component's built-in scroll
  listener + `opacity` transition — no extra code.
- Keep `maxBlur`/`height` a touch smaller than the bottom so it reads as a header wash,
  not a heavy band.

It renders `fixed top-0 z-40`, so it lives *behind* the header (the header is
`z-40` too but rendered later / sticky). If you want the blur strictly under the nav bar,
give the header a higher stacking context (e.g. wrap header content in `relative z-50`).

### Option B — bake the progressive ramp into the header itself

If you'd rather not add a separate overlay, replace the header's single uniform
`backdrop-blur-xl` with a masked ramp so the blur fades out at the *bottom* of the header
instead of ending in a hard line. Add this as an absolutely-positioned child inside
`<header>` (behind the nav content):

```tsx
<div
  aria-hidden
  className="pointer-events-none absolute inset-0 -z-10"
  style={{
    backdropFilter: "blur(14px)",
    WebkitMaskImage: "linear-gradient(to bottom, #000 55%, transparent 100%)",
    maskImage: "linear-gradient(to bottom, #000 55%, transparent 100%)",
  }}
/>
```

That is a one-layer version of the same mask trick (opaque for the top 55% of the header,
fading to transparent by the bottom). For a multi-layer ramp, just render
`<ProgressiveBlur side="top" height={headerHeight} .../>` as that child instead.

**Recommendation:** use **Option A**. It reuses the tested component, keeps the header
markup clean, stays off the critical path, and the `activateAfter` gate matches the
header's own scroll behavior (below).

---

## 3. The header design & how it changes color between sections

The header (`Nav.tsx`) is a **liquid-glass** bar with three regions: the logo (left), a
floating center pill of links, and the right actions (Login + Get Started). On mobile the
links collapse into a full-screen `bg-ink` drawer. It is **not** a per-section recolor
driven by scroll spy — it toggles between exactly **two visual states** based on one
boolean, `scrolled`.

### The layout

- `<header>` is `sticky top-[36px] z-40` — it sticks 36px down because the
  `AnnouncementBar` (`#announcement-bar`, ~36px) sits above it.
- On `lg+` the header background is *always* transparent (`lg:bg-transparent`); the glass
  lives in the **center pill** and the **buttons**, not the whole bar. Below `lg`, the
  whole bar gets a white glass background once scrolled.
- The center nav is an `absolute left-1/2 -translate-x-1/2` pill:
  `rounded-full ... backdrop-blur-xl backdrop-saturate-150` — a real frosted-glass pill
  floating over the hero.

### The two states

Everything keys off one piece of state:

```tsx
const [scrolled, setScrolled] = useState(solid);
```

| Element | `scrolled === false` (over the dark hero) | `scrolled === true` (scrolled into light content) |
|---|---|---|
| Logo `<img>` | `brightness-0 invert` → **white** logo | no filter → **dark** logo |
| Mobile bar bg | `bg-transparent` | `bg-white/80 backdrop-blur-xl backdrop-saturate-150` |
| Center pill | `border-white/25 bg-white/[0.08]` (dark glass) | `border-black/10 bg-white/60` (light glass) |
| Link text | `text-white/90 hover:text-white` | `text-ink/80 hover:text-ink` |
| Dropdown panel | `border-white/20 bg-white/[0.12]` | `border-black/10 bg-white/85` |
| Login button | white-on-glass | dark text on light glass |
| Get Started (desktop) | solid `bg-ink` (unchanged in both) | solid `bg-ink` |

So the "color change" is really a **white-on-transparent (for a dark hero) → dark-on-white-glass
(for light page body)** crossfade, wired through `transition-colors duration-300` /
`transition-[filter] duration-300` on each element. Because the hero has a dark image behind
it, the header starts white/ghosted; once you pass the hero the page turns light, so the header
flips to dark ink so it stays legible.

### What flips `scrolled` — the section boundary

The header watches the **hero section's height**, not arbitrary section markers. It flips
to the scrolled state right before the hero ends:

```tsx
useEffect(() => {
  if (solid) return;                                  // pages with no dark hero: stay solid
  const hero = document.getElementById("hero");
  const header = document.querySelector("header");
  const announcement = document.getElementById("announcement-bar");

  const compute = () => {
    if (!hero) return 80;
    const headerHeight = header?.getBoundingClientRect().height ?? 76;
    const announcementHeight = announcement?.getBoundingClientRect().height ?? 36;
    // Trip point ~40px before the hero's bottom edge reaches the header.
    const offset = hero.offsetHeight - (headerHeight + announcementHeight + 40);
    return hero.offsetTop + offset;
  };

  const onScroll = () => setScrolled(window.scrollY > compute());
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  return () => { /* cleanup */ };
}, [solid]);
```

- The threshold is computed from `hero.offsetTop + hero.offsetHeight` minus the header +
  announcement + a 40px lead, so the flip happens just as the dark hero scrolls out from
  under the bar.
- It recomputes on `resize` so the boundary stays correct across breakpoints.
- If there's no `#hero` on the page, it falls back to a plain `scrollY > 80`.

### The `solid` prop — pages with no dark hero

Pages without a dark hero behind the nav (e.g. legal pages) render `<Nav solid />`. That:

1. **initializes** `scrolled` to `true` (`useState(solid)`), and
2. **short-circuits** the scroll effect (`if (solid) return;`),

so the header is permanently in its dark-on-light state. Without this, the default
white-on-transparent logo/links would be invisible on a white page.

- Marketing pages: `<Nav />` (Home, WeightLoss) — two-state, hero-driven.
- `<Nav solid />` (LegalPage) — locked to the light/dark-ink state.

### Mobile drawer (separate from the two states)

The hamburger opens a full-screen `bg-ink` panel (`z-[100]`), independent of `scrolled`:
ambient coral (`#ee7273`) glow blobs behind frosted glass, large white links that stagger
in via framer-motion, and `Start Assessment` / `Login` CTAs at the bottom. Body scroll is
locked while open (`document.body.style.overflow = "hidden"`).

### To add a genuine per-section color (if ever needed)

The current design intentionally has only two states. If you later want the header to take
on a *different* tint per section (e.g. green over one band, navy over another), swap the
single `scrolled` boolean for a small **scroll-spy**: give each `<section>` a
`data-nav-theme` attribute, observe them with an `IntersectionObserver`
(`rootMargin: "-76px 0px 0px 0px"` so a section counts once it's under the bar), and store
the active theme in state. Then drive the same class blocks off that theme string instead
of the boolean. Keep the `solid` fallback for hero-less pages.

---

## Quick reference

- **Progressive blur = stacked `backdrop-filter` layers + gradient `mask-image`.** Strong
  blur is masked to a thin band at the edge; weak blur extends inward; overlap = smooth ramp.
- **Bottom blur:** `<ProgressiveBlur side="bottom" .../>`, mounted via `DeferredEffects`
  after idle, always on.
- **Header blur:** add `<ProgressiveBlur side="top" activateAfter={120} .../>` (Option A) —
  the component already handles the top edge and the scroll-in fade.
- **Header color:** one `scrolled` boolean → two states (white-on-transparent over the dark
  hero ↔ ink-on-white-glass over the light body), tripped just before the `#hero` scrolls
  out. `<Nav solid />` locks it to the light state for hero-less pages.
