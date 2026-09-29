# daylightcomputer.com — Section-wise Breakdown

> Source: live production bundle (HTML + `_next/static/chunks/*.js`) analysis, 2026-09-29.
> সব তথ্য minified code পড়ে বের করা — class name, timing (%), id গুলো আসল। Variable name গুলো পড়ার সুবিধার জন্য নতুন করে দেওয়া।


---

## 0. Tech Stack

| Layer | Tool | নোট |
|---|---|---|
| Framework | **Next.js (App Router)** | route: `app/(home)/page`, heavy অংশ `next/dynamic` দিয়ে lazy |
| Hosting | **Vercel** | |
| Styling | **Tailwind CSS** + custom utilities | `text-scale-[40px]/[72px]`, `py-vw-32`, `gap-em-[72/72]` — fluid vw/em based custom plugin |
| Smooth scroll | **Lenis** `1.0.42` (`lenis/react`) | `lerp: 0.145`, `autoRaf: false` |
| Scroll animation | **GSAP 3 + ScrollTrigger** + `@gsap/react` (`useGSAP`) | সব কিছু `scrub: true` |
| Timeline helper | **`@bsmnt/scrollytelling`**-এর মতো internal helper | timeline কে 0–100% এ ভাগ করে |
| 3D / WebGL | **three.js + React Three Fiber** | tablet reveal, blinds scene; `tunnel-rat` দিয়ে একটা global canvas-এ portal |
| Debug | **Leva** | dev-এ animation value tweak করার panel |
| State | **Zustand** | `headerDarkMode`, `blinder`, `shadowSceneActive` ইত্যাদি global flag |
| Video | **Mux** (HLS) + `react-player` | |
| Commerce | **Shopify Storefront API** (headless) | cart drawer |
| Agency | **basement.studio** | |

---

## 1. Global Foundation (সব section এর আগে এটা লাগবে)

### 1.1 Lenis ↔ GSAP sync

Lenis নিজে RAF চালায় না (`autoRaf: false`); GSAP-এর ticker থেকে drive হয়, যাতে scroll আর animation একই frame-এ update হয়।

```tsx
// app/providers/smooth-scroll.tsx
"use client";
import { ReactLenis, type LenisRef } from "lenis/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<LenisRef>(null);

  useEffect(() => {
    const update = (time: number) => lenisRef.current?.lenis?.raf(time * 1000);
    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);
    lenisRef.current?.lenis?.on("scroll", ScrollTrigger.update);
    return () => gsap.ticker.remove(update);
  }, []);

  return (
    <ReactLenis root ref={lenisRef} options={{ lerp: 0.145, wheelMultiplier: 1, autoRaf: false }}>
      {children}
    </ReactLenis>
  );
}
```

- Blog route-এ `lerp: 1` (মানে smoothing off) — লম্বা text পড়ার সময় native scroll।
- Scrollable drawer (cart) এ `data-lenis-prevent` attribute দেওয়া, যাতে ভেতরের scroll Lenis না খেয়ে ফেলে।

### 1.2 GSAP global config + reusable effects

```ts
gsap.config({ autoSleep: Infinity, force3D: true });

// প্রতিটা character 3D তে উপর থেকে নেমে আসে
gsap.registerEffect({
  name: "textFadeIn",
  defaults: { duration: 0.5, stagger: 0.1 },
  extendTimeline: true,
  effect: (targets, { duration, stagger, ...rest }) =>
    gsap.fromTo(targets,
      { opacity: 0, y: -10, z: 25, rotationX: 10 },
      { opacity: 1, y: 0, z: 0, rotationX: 0, ease: "power3.out", duration, stagger, ...rest }),
});

// সব image-এর parallax
gsap.registerEffect({
  name: "imageParallax",
  effect: (el, { direction = "y", trigger, amount = 0.2, noScale = false, centered = true,
                 ease = "none", start = "top bottom", end = "bottom top" }) => {
    const total = amount * 100, half = total / 2;
    return gsap.fromTo(el,
      { scale: noScale ? 1 : 1 + amount, [direction]: `-${centered ? half : total}%` },
      { [direction]: `${centered ? half : 0}%`, ease, overwrite: "auto",
        scrollTrigger: { trigger: trigger ?? el, start, end, scrub: true } });
  },
});
```

### 1.3 Percentage-based timeline helper (এটাই আসল গোপন অস্ত্র)

প্রতিটা বড় section একটা লম্বা (`400vh`/`500vh`) container, যার একটাই scrubbed timeline। প্রতিটা animation কে timeline-এর **% start–end** দিয়ে বসানো হয় — seconds দিয়ে না। ফলে choreography পড়তে ও tweak করতে সহজ।

> নিচের helper টা আমার reconstruction — ওদের আসল implementation (`@bsmnt/scrollytelling`) এর API আর behaviour মিলিয়ে লেখা, হুবহু code না।

```ts
// timeline কে 100 unit লম্বা ধরে নেওয়া
function createScrollytelling(tl: gsap.core.Timeline) {
  tl.to({}, { duration: 100 }, 0); // "rest tween" — timeline এর length 100 fixed করে

  const get = ({ start, end, ...vars }: { start: number; end: number } & gsap.TweenVars) =>
    [{ ...vars, duration: end - start }, start] as const; // tl.to(target, ...get({...}))

  const waypoint = ({ at, onCall, onReverseCall }: { at: number; onCall: () => void; onReverseCall: () => void }) => {
    tl.call(() => (tl.scrollTrigger!.direction > 0 ? onCall() : onReverseCall()), [], at);
    return { waypoint };
  };

  return { get, waypoint };
}

// ব্যবহার
const tl = gsap.timeline({ scrollTrigger: { trigger: ref.current, start: "top top", end: "bottom bottom", scrub: true } });
const { get, waypoint } = createScrollytelling(tl);
tl.to(".title", ...get({ start: 41, end: 51, opacity: 0 }));
waypoint({ at: 62, onCall: () => setDark(true), onReverseCall: () => setDark(false) });
```

- **Waypoint** = scroll একটা নির্দিষ্ট % পার হলে একবার একটা JS callback (zustand state বদলানো, একটা আলাদা non-scrub timeline `play()`/`reverse()` করা)।
- প্রতিটা timeline `useGSAP(..., { revertOnUpdate: true })` এর ভেতরে — resize/deps বদলালে সব clean revert।

### 1.4 Split text

GSAP SplitText ব্যবহার করেনি — নিজের React component দিয়ে word → char `<span>` বানায়:

```tsx
function SplitChars({ text, className }: { text: string; className?: string }) {
  return text.split(" ").map((word, w) => (
    <span key={w} className={cn("inline-block whitespace-nowrap", className)}>
      {[...(word + " ")].map((ch, c) => (
        <span key={c} data-word={word} className="char inline-block whitespace-pre">{ch}</span>
      ))}
    </span>
  ));
}
```

Parent-এ `[perspective:900px]` — তাই `rotationX`/`z` animation গুলো সত্যিকারের 3D দেখায়। `data-word` দিয়ে নির্দিষ্ট শব্দ target করা যায় (e.g. `[data-word="distracting"]`, `[&_[data-word=Daylight]]:italic`)।

### 1.5 Accessibility / Reduced motion

প্রায় প্রতিটা section এ `motion-safe:` / `motion-reduce:` Tailwind variant। Reduced motion এ:
- লম্বা `h-[500vh]` container গুলো normal height হয়ে যায়
- absolute stacked heading গুলো `relative` হয়ে যায়
- horizontal scroll → vertical stack
- WebGL tablet reveal → static `#motion-reduced-tablet` image section

---

## 2. Header / Navigation

- `<header>` fixed, ভেতরে একটা **floating pill nav** (`rounded-em-[14/16] border border-black/10`), desktop only (`max-lg:hidden`)।
- Global zustand flag `headerDarkMode` — dark section-এ ঢুকলে (hero overlay, tablet reveal 35%, testimonials ইত্যাদির waypoint থেকে) nav এর রং উল্টে যায়।
- একটা floating CTA/"index" tooltip (Radix) আছে যেটা `dive-deeper-section` আর `footer` এর `getBoundingClientRect` দেখে hide/show হয়।
- প্রতিটা section এ `data-index-title="Magic paper"`, `"Night"` ইত্যাদি — nav এ current chapter দেখানোর জন্য।

---

## 3. Hero — "The computer, de-invented"

**Layout**
```html
<section class="relative lg:h-[200vh]">           <!-- 100vh extra = scrub space -->
  <div class="sticky top-0 hero-container">       <!-- screen এ আটকে থাকে -->
    <div class="relative size-full overflow-hidden rounded-2xl lg:rounded-3xl">
      <canvas id="hero-canvas" />                  <!-- desktop: frame sequence -->
      <Image src=Comp_00000.webp priority />       <!-- poster / LCP -->
      <Image src=hero-mobile.png class="lg:hidden" />
      <MuxVideo class="mix-blend-multiply" />      <!-- screen এর ফুল -->
      <h1>The computer, de-invented</h1> + CTA
```

**Animation: Canvas image sequence**
1. `/home-hero/Comp_00000.webp` … `Comp_00169.webp` — **170 frame**, 1920×940।
2. **2-pass preload:** প্রথমে প্রতি ৪র্থ frame (`i % 4 === 0`, ~43টা) → প্রথম frame আঁকা → বাকি ~127টা background এ।
3. Draw = "object-fit: cover" হিসাব:
   ```ts
   function draw(i: number) {
     const img = frames[i]; if (!img) return;
     const { width: cw, height: ch } = ctx.canvas;
     const ir = img.width / img.height, cr = cw / ch;
     let w = cw, h = ch, x = 0, y = 0;
     if (ir < cr) { h = cw / ir; y = (ch - h) / 2; } else { w = ch * ir; x = (cw - w) / 2; }
     ctx.clearRect(0, 0, cw, ch);
     ctx.drawImage(img, x, y, w, h);
   }
   ```
4. Scroll binding:
   ```ts
   const state = { frame: 0 };
   gsap.timeline({ scrollTrigger: { trigger: section, start: "top top", end: "bottom bottom", scrub: true } })
     .to(state, { frame: 169, onUpdate: () => draw(Math.floor(state.frame)) });
   ```
5. Canvas context: `{ alpha: false }` (দ্রুত), resize এ RAF দিয়ে current frame আবার আঁকা, `visibilitychange` এ redraw।

**Overlay video:** Mux HLS, `muted loop`, `mix-blend-multiply`। চলে শুধু যখন (a) viewport এ ≥10% visible (IntersectionObserver) **এবং** (b) user প্রথম click/scroll/keydown করেছে। Tab hidden হলে pause।

**Mobile (<1024px):** canvas mount-ই হয় না — static image + আলাদা mobile Mux stream।

**Performance:** প্রথম frame `<link rel="preload" as="image" fetchpriority="high">`; canvas component `next/dynamic` দিয়ে lazy।

---

## 4. Introduction — "We refuse to accept…" → "Introducing Daylight"

**Layout:** `#introduction-section` — `motion-safe:h-[500vh] motion-safe:mt-[-100vh]` (hero এর উপর overlap করে শুরু), ভেতরে `sticky h-screen`, দুটো `<h2>` একই জায়গায় `absolute` stacked।

**Timeline choreography (0–100%)**

| % | কী হয় |
|---|---|
| 0 | section `visibility: visible` |
| 15 → 35 | Title A: "We refuse to accept a future where our devices are exhausting, addictive, and distracting" — char by char `textFadeIn` (3D drop) |
| **35** (waypoint) | আলাদা mini timeline `play()`: `distracting` শব্দ `#FF6F6F` লাল হয়, পাশে একটা লাল notification badge **"1"** pop করে (y -5 → 0 bounce) |
| 41 → 51 | Title A fade out |
| 50 → 70 | Title B: "Introducing *Daylight* — a healthier, more human-friendly computer" char fade in |
| **62** (waypoint) | background 3D **blinds** scene এর `blinder` value বদলায় → খড়খড়ি (venetian blinds) খুলে/ঘুরে যায় |
| 76 → 86 | Title B fade out |
| 78 → 99 | CSS variable `--swipe-out-factor: 100% → -10%` — container swipe out (clip/mask CSS দিয়ে) |
| 99.9 | section opacity 0 (পরের section কে জায়গা দেয়) |

**Blinds scene (WebGL):** R3F এ ২২টা slat (`y: -10 → 10`), প্রতি frame এ `lerp(current, target, 0.03)` দিয়ে rotation smooth হয়। Scroll শুধু target value সেট করে (zustand), smoothing হয় `useFrame` এ — তাই scroll থামালেও blinds নরমভাবে settle হয়।

---

## 5. Horizontal Scroll Gallery — "Magic paper" … "use it outside"

**এটা GSAP pin না — custom implementation।**

```tsx
const sections = [
  { width: 100, magnet: false, Component: Spacer },
  { width: 100, magnet: true,  Component: WakeUp, props: { id: "h-scroll-wake-up" } },
  { width: 100, magnet: true,  Component: DistractionFree },
  { width: 50,                 Component: Apps },
  { width: 50,                 Component: BagImage },
  { width: 40,  magnet: true,  Component: Vision },
  { width: 120, magnet: true,  Component: Routine },
  { width: 100, magnet: false, Component: OutsideFeatures },
  { width: 100, magnet: false, Component: Spacer },
];
const totalVh = sections.reduce((sum, s, i) => sum + s.width + (i === 0 ? 0 : 20), 0); // gap = 20vw

<div style={{ "--h": `${totalVh}vh` }} className="relative motion-safe:lg:h-[var(--h)]">   {/* vertical scroll length */}
  <div className="absolute inset-0 pointer-events-none">
    {sections.map(s => <div id={s.props?.id} style={{ "--h": `${s.width}vh` }} className="h-[var(--h)] mb-[20vh]" />)}
  </div>                                                               {/* invisible anchor — nav/snap এর জন্য */}
  <div className="sticky top-0 lg:h-screen overflow-hidden">
    <div ref={track} className="lg:absolute flex lg:flex-row flex-col lg:gap-x-[20vw] will-change-transform">
      {children}
    </div>
  </div>
</div>
```

```ts
useLenis((lenis) => {
  if (!inView) return;
  const outer = container.getBoundingClientRect();
  const progress = clamp(0, 1, -outer.top / (outer.height - lenis.dimensions.height));
  const x = Math.round((track.getBoundingClientRect().width - lenis.dimensions.width) * progress);
  track.style.transform = `translate3d(-${x}px,0,0)`;
});
```

- Vertical scroll height = সব panel এর width (vh এ) যোগফল → scroll speed horizontally ও vertically সমান লাগে।
- `magnet: true` = ওই panel এ snap করার জন্য anchor।
- Container এর `mt-[calc(-200vh-30vh)]` — আগের section এর নিচে overlap করে ঢুকে যায় (seamless transition)।
- Mobile এ সাধারণ vertical stack (`flex-col gap-y-[25vh]`)।

**Panels**
1. **Wake-up / "Magic paper"** — full-bleed rounded image, "The world's first full-speed paper-like display"; ৩টা feature: Smooth interactions · A calm experience · For your health (list টা ২ বার render — marquee/loop)।
2. **Distraction-free** — "A distraction-free space for learning & creativity" + ৩টা figure card: Reading · Note-taking · Writing (`fig 1/2/3` caption style)।
3. **Apps (50vw)** — "With all the apps you need"।
4. **Bag image (50vw)** — `imageParallax` effect।
5. **Vision (40vw)** — illustration + "The vision for Daylight is to build a whole ecosystem of healthier, more humane computers…"
6. **Routine (120vw)** — wide shadow-container, "it's a computer you can use outside"; "Read in broad daylight with a screen that uses the sun as its backlight…"
7. **Outside features** — No eye-strain · Extended battery · Backlight optional + grass image।

Image গুলোতে `shadow-container` — gradient/shadow overlay; আর `MultiplyPortal` দিয়ে কিছু element `mix-blend-multiply` layer এ render।

---

## 6. Tablet Reveal (WebGL) — "Night" / "Goodbye, blue light"

**Layout:** `#tablet-reveal-3d-text-container`, `height: 400vh`, `-mt-[100vh]`, শুরুতে `invisible`। 3D scene টা একটা **global fixed canvas** এ `tunnel-rat` portal দিয়ে inject হয় (প্রতি section এ নতুন WebGL context না খুলে একটাই context)।

**Scene:** three.js tablet plane + 3D title text + custom shader (`uAlpha`, `uOffset`, `uBackgroundAlpha` uniforms) + একটা OffscreenCanvas 2D texture (`noise-2.png`, `halftone.png`) যেটা rotating color fill + halftone pattern আঁকে।

**Mouse tilt:** `mousemove` → normalized (-0.5..0.5) → `rotation.set(0.025π·y·tilt, 0.025π·x·tilt)`; shader এ `uOffset` দিয়ে parallax। `tilt` নিজেই scroll-animated (0→1→0)।

**Timeline (C = 5/6 scale factor)**

| % | কী হয় |
|---|---|
| 0.01 (waypoint) | 3D render চালু (বাইরে থাকলে render বন্ধ — GPU বাঁচায়) |
| শুরু → 20 | "lights" title A chars 3D fade in |
| 20 → 40 | Title B chars fade in (`y:-10, z:25, rotationX:10` → 0) |
| 40 → 50 | shader `uAlpha 0→1` (tablet দেখা দেয়), title color → `#000`, halftone `mix 0→1` |
| ~35 (42·C, waypoint) | `headerDarkMode = true` |
| 50 | `uBackgroundAlpha = 1` |
| 50 → 65 | tablet plane `z → 0` (সামনে আসে), title `z: 100 → 0`, tilt factor `0 → 1` |
| 65 → 72.5 | center title fade out |
| 70 → 92.5 | tablet সরে যায় বাঁদিকে (`x: -asideWidth`) — mobile এ উপরে (`y`), tilt → 0 |
| 70 → 95 | Aside text ("Goodbye, blue light", description, ৩ column) `x: 120 → 0` stagger |
| 85 → 100 | Aside text opacity 0 → 1 |
| 99.99 (waypoint) | render বন্ধ |

Aside content: Better sleep · Flicker-free · Pure amber (icon + title + text)।

`gsap.matchMedia()` দিয়ে `horizontal` (lg+) আর `vertical` (max-lg) দুই রকম timeline।

---

## 7. Dive Deeper

- `#dive-deeper-section` — `bg-night text-white font-serif title-md py-vw-32 lg:py-vw-56`।
- "Dive deeper into Daylight" + link list (arrow SVG icon), `grid lg:grid-cols-[max-content_auto]`।
- এখান থেকে dark (`bg-night`) zone শুরু — বাকি page একই background, তাই section গুলো জোড়া লাগানো মনে হয়।

---

## 8. Testimonials — "What people are saying"

- Title `lg:sticky` — card গুলো এর উপর দিয়ে scroll করে যায়।
- **Depth parallax:** প্রতিটা card এ `data-factor` (e.g. 0.6, 1, 1.4):
  ```ts
  tl.fromTo(".testimonials > div",
    { y: (i, el) => `${100 * +el.dataset.factor}%`, z: (i, el) => `${100 * (+el.dataset.factor - 1)}px` },
    { y: (i, el) => `-${100 * +el.dataset.factor}%`, ease: "none", ...get({ start: 0, end: 100 }) });
  ```
  বিভিন্ন speed এ চলায় 3D গভীরতা মনে হয়।
- **Title exit (62.5 → 70%)**: "What people" chars `rotationY: -90, z: -250, blur(8px)` (origin ডানে), "are saying" chars `rotationY: 90` (origin বাঁয়ে, stagger from end) — মাঝখান থেকে দুদিকে দরজার মতো ভাঁজ হয়ে যায়। 55 → 90% এ দুই অংশ `x: ∓600` সরে যায়।
- Press logo: WIRED, The Verge, TechRadar, Daring Fireball।
- Desktop only animation (`matchMedia(lg)`), mobile এ static wrapper।

---

## 9. Public Benefit Co.

"Daylight is a Public Benefit Co." — `bg-night`, `title-md text-balance`, সাধারণ text section (কোনো heavy animation না — আগের ভারী section এর পরে চোখের বিশ্রাম)।

## 10. DC-1 at a glance

Spec grid — `uppercase font-sans-extended tracking-wide` label, product specs।

## 11. Pre-order

- `#pre-order-section` — hand holding tablet image, `mix-blend-screen`, এবং vertical fade mask:
  ```css
  mask: linear-gradient(180deg, transparent 0%, #000 15%, #000 50%, #000 95%, transparent 100%);
  ```
  ফলে image টা dark background এ মিশে যায়, কোনো কিনারা দেখা যায় না।
- Shopify cart drawer (`bg-moonlight/90`, `data-lenis-prevent`)।

## 12. Footer

`#footer` — `bg-night text-white flex items-end pb-vw-12`।

---

## 13. Design Tokens (যা দেখা গেছে)

| Token | ব্যবহার |
|---|---|
| `night` | dark background |
| `moonlight` | dark bg এর উপর text |
| `cream` | light surface |
| `#FF6F6F` | notification / accent red |
| Typography | Serif display (`font-serif`, `title-md/lg`) + Sans + Sans Extended (uppercase label) |
| Radius | `rounded-2xl lg:rounded-3xl` card/hero |
| Spacing | viewport-based (`py-vw-*`, `gap-vw-*`) + em-based (`gap-em-[72/72]`) — fluid scale |

---

## 14. Build Plan (Phase by phase)

প্রতিটা phase শেষে working ও testable।

1. **Foundation** — Next.js + Tailwind + fluid type/spacing utilities; `SmoothScroll` provider (Lenis ↔ GSAP ticker); `gsap.config` + `textFadeIn` / `imageParallax` effects; `createScrollytelling` helper; `SplitChars`। ✅ Test: একটা dummy 300vh section এ scrubbed text।
2. **Header** — floating pill nav + zustand `headerDarkMode`।
3. **Hero** — frame export (After Effects/Blender → PNG → `cwebp -q 80`), `HeroSequence` canvas component, 2-pass preload, sticky 200vh, mobile fallback, poster preload।
4. **Introduction** — 500vh sticky, stacked split headings, % timeline, waypoint-driven notification timeline। (Blinds WebGL optional — প্রথমে CSS gradient দিয়ে)।
5. **Horizontal gallery** — `HorizontalScroller` (sections config → height হিসাব → Lenis callback এ translate3d); mobile vertical fallback।
6. **3D reveal** — R3F global canvas + `tunnel-rat`; tablet plane + shader; scroll timeline + mouse tilt; reduced-motion static fallback।
7. **Testimonials** — `data-factor` depth parallax + title rotateY exit।
8. **Static sections** — Dive deeper, PBC, specs, pre-order (mask), footer।
9. **Polish & QA** — `prefers-reduced-motion`, Lighthouse (LCP = hero poster), GPU memory (render only in view), Safari test (canvas + mix-blend), resize/orientation (`revertOnUpdate`, `invalidateOnRefresh`)।

---

## 15. Key Takeaways / Pitfalls

- **সবকিছু scroll-scrubbed, কিছুই time-based না** (ব্যতিক্রম: waypoint দিয়ে trigger করা ছোট micro-animation)।
- **এক section = এক লম্বা container + sticky viewport + এক timeline (0–100%)** — এই pattern টাই পুরো সাইট।
- **Negative margin overlap** (`-mt-[100vh]`, `mt-[calc(-200vh-30vh)]`) দিয়ে section গুলো একে অপরের উপর দিয়ে ঢোকে — কোনো hard cut নেই।
- **Heavy জিনিস lazy + conditional:** canvas/WebGL শুধু desktop এ, শুধু in-view এ render; video শুধু user interaction এর পরে।
- **Global state bridge:** GSAP waypoint → zustand → React/R3F — scroll logic আর 3D render loop আলাদা থাকে, smoothing (`lerp`) হয় R3F `useFrame` এ।
- **Reduced motion পুরো আলাদা layout পায়** — শুধু animation বন্ধ না।
- `will-change-transform`, `translate3d`, `force3D: true`, `alpha: false` canvas — 60fps রাখার জন্য।
