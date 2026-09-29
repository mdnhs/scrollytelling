# Plan — Vertical Phases

প্রতিটা phase end-to-end working। প্রতিটার শেষে: review → lint → typecheck → build → browser-এ scroll test। কোনো known issue থাকলে পরের phase-এ যাওয়া যাবে না।

Reference: [brief.md](brief.md), [research breakdown](research/daylight-computer-breakdown.md)।

## Phase 1 — Foundation ✅ done

- [x] `gsap`, `@gsap/react`, `lenis`, `zustand` install
- [x] Design tokens (`ink`, `mist`, `paper`, `ember`) + serif display font
- [x] `SmoothScroll` provider — Lenis (`lerp 0.145`, `autoRaf: false`) GSAP ticker থেকে drive
- [x] `lib/gsap.ts` — plugin register, `gsap.config`, `textFadeIn` + `imageParallax` effect
- [x] `lib/scrollytelling.ts` — 0–100 timeline helper (`get`, `waypoint`)
- [x] `SplitChars` component (`data-word` সহ)
- [x] Demo: 300vh sticky section, chars scrub-এ 3D drop, waypoint-এ accent flip
- **Note:** badge এখন headline-এর কোণায় anchor করা; Phase 4-এ target word-এর সাথে anchor হবে
- **Test:** scroll down/up এ text in/out হয়, waypoint দুই দিকেই ঠিক fire হয়, reduced-motion এ static

## Phase 2 — Header

- [ ] Zustand store (`headerDark`)
- [ ] Floating pill nav (desktop), mobile compact bar
- [ ] `headerDark` অনুযায়ী color transition
- **Test:** store toggle করলে nav রং বদলায়

## Phase 3 — Hero

- [ ] Frame sequence generate script (নিজস্ব procedural frame → webp)
- [ ] `HeroSequence` canvas: 2-pass preload, cover draw, `alpha: false`, resize/visibility redraw
- [ ] 200vh sticky, mobile static fallback, poster preload
- **Test:** scrub এ frame মসৃণ, mobile এ canvas mount হয় না

## Phase 4 — Introduction

- [ ] 500vh, `-mt-[100vh]` overlap, stacked absolute headings
- [ ] % timeline (15→35, 41→51, 50→70, 76→86, 78→99 swipe-out)
- [ ] Waypoint 35: word ember রং + badge pop mini-timeline
- [ ] Blinds background (প্রথমে CSS, পরে Phase 5-এর R3F)
- **Test:** timing table মিলছে, reverse scroll এ badge reverse হয়

## Phase 5 — Horizontal gallery

- [ ] `HorizontalScroller` (sections config → total vh → Lenis callback এ `translate3d`)
- [ ] ৭টা panel, `imageParallax`, mobile vertical fallback
- **Test:** vertical/horizontal গতি সমান, overlap seamless

## Phase 6 — Slate reveal (WebGL)

- [ ] three.js + R3F global canvas + `tunnel-rat`
- [ ] Slate plane shader (`uAlpha`, `uOffset`, `uBackgroundAlpha`), halftone texture (নিজস্ব)
- [ ] 400vh timeline + mouse tilt + matchMedia horizontal/vertical, in-view render only
- [ ] Reduced-motion static fallback
- **Test:** GPU শুধু in-view এ render করে, dark header waypoint

## Phase 7 — Voices

- [ ] Sticky title, `data-factor` depth parallax cards
- [ ] Title rotateY door-fold exit (62.5→70), x split (55→90)
- **Test:** desktop animation, mobile static

## Phase 8 — Static sections

- [ ] Go further, Mission, Specs, Reserve (fade mask), Footer

## Phase 9 — Polish & full QA

- [ ] Reduced motion পুরো layout
- [ ] Lighthouse (LCP = hero poster), Safari (canvas + blend), resize/orientation
- [ ] Full regression scroll-through
