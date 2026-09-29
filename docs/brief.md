# Brief — Stillwater Scrollytelling Landing

## উদ্দেশ্য

Educational / research project। [daylight-computer-breakdown.md](research/daylight-computer-breakdown.md)-এ যে scroll-driven motion system বিশ্লেষণ করা হয়েছে, সেটা **technique ও timing হুবহু** রেখে নিজে বানানো।

## Content boundary (কঠোর নিয়ম)

| নেব (technique) | নেব না (brand / copyrighted asset) |
|---|---|
| Lenis ↔ GSAP sync, `lerp: 0.145` | ওদের headline, body copy, testimonial text |
| 0–100% timeline + waypoint pattern | "Daylight" নাম, logo, DC-1 product name |
| Timeline % timing, sticky / negative-margin overlap | Hero frame sequence (`Comp_*.webp`), Mux video |
| Split-char 3D drop, parallax, depth parallax | Product photo, illustration, press logo |
| Horizontal scroller, R3F blinds / tablet shader | ওদের font file, exact color value |

সব copy, image, 3D asset এই repo-তেই নতুন বানানো (বা free-license) হবে।

## Fictional product

- **Brand:** Stillwater
- **Product:** S1, একটা শান্ত, glare-free reading slate
- **Tone:** ধীর, মনোযোগী, প্রকৃতি-ঘেঁষা। Serif display + clean sans।

## Section map (original copy)

| # | Section | Motion pattern (reference §) | Copy |
|---|---|---|---|
| 1 | Header | floating pill nav, dark-mode flip (§2) | Stillwater · Slate · Journal · Reserve |
| 2 | Hero | 200vh sticky canvas frame sequence (§3) | "Screens, slowed down." |
| 3 | Introduction | 500vh stacked split headings + waypoint badge (§4) | A: "Our screens were built to keep us restless, anxious, and endlessly *interrupted*" → B: "Meet *Stillwater* — a slate that lets you breathe again" |
| 4 | Horizontal gallery | custom Lenis-driven track (§5) | Still paper · Room to think · Only what you need · Carry-along · Horizon · Morning light · Out in the open |
| 5 | Slate reveal (WebGL) | 400vh R3F shader reveal (§6) | "After dusk" / "Warm light for late pages" — Restful nights · Steady glow · Ember tone |
| 6 | Go further | static link list (§7) | "Go further with Stillwater" |
| 7 | Voices | `data-factor` depth parallax + rotateY exit (§8) | "Notes from readers" — নিজের লেখা fictional quote |
| 8 | Mission | calm text (§9) | "Built to be put down." |
| 9 | Specs | spec grid (§10) | S1 at a glance |
| 10 | Reserve | masked image (§11) | "Reserve your S1" |
| 11 | Footer | (§12) | |

## Design tokens (নিজস্ব)

| Token | মান | ব্যবহার |
|---|---|---|
| `ink` | `oklch(0.18 0.02 250)` | dark background |
| `mist` | `oklch(0.93 0.01 90)` | dark bg-এ text |
| `paper` | `oklch(0.97 0.015 85)` | light surface |
| `ember` | `oklch(0.68 0.19 35)` | accent / notification |

## Tech

Next.js 16 App Router · Tailwind v4 · GSAP 3 + ScrollTrigger + `@gsap/react` · Lenis · Zustand · (Phase 5-এ) three.js + R3F।

## Non-goals

- Commerce / cart (শুধু static CTA)
- CMS / blog
- Production deploy
