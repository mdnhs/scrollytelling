"use client"

import { useRef } from "react"

import { SplitChars } from "@/components/split-chars"
import { gsap, useGSAP } from "@/lib/gsap"
import { createScrollytelling } from "@/lib/scrollytelling"

const HEADLINE = "Our screens were built to keep us restless, anxious, and endlessly interrupted"

export function FoundationDemo() {
  const root = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const badge = gsap
          .timeline({ paused: true })
          .to('[data-word="interrupted"]', { color: "var(--color-ember)", duration: 0.3 })
          .fromTo(
            "[data-badge]",
            { autoAlpha: 0, y: -5, scale: 0.6 },
            { autoAlpha: 1, y: 0, scale: 1, ease: "back.out(3)", duration: 0.4 },
            "<"
          )

        const tl = gsap.timeline({
          scrollTrigger: { trigger: root.current, start: "top top", end: "bottom bottom", scrub: true },
        })
        const { get, waypoint } = createScrollytelling(tl)

        tl.textFadeIn(".char", { duration: 10, stagger: { amount: 20 } }, 15)
        waypoint({ at: 50, onCall: () => badge.play(), onReverseCall: () => badge.reverse() })
        tl.to("[data-headline]", ...get({ start: 70, end: 85, opacity: 0 }))
      })

      return () => mm.revert()
    },
    { scope: root, revertOnUpdate: true }
  )

  return (
    <section ref={root} className="relative bg-paper text-ink motion-safe:h-[300vh]">
      <div className="flex h-screen items-center justify-center px-6 motion-safe:sticky motion-safe:top-0">
        <h2
          data-headline
          className="relative max-w-5xl text-center font-serif text-4xl leading-tight text-balance perspective-midrange md:text-6xl lg:text-7xl"
        >
          <SplitChars text={HEADLINE} />
          <span
            data-badge
            aria-hidden
            className="invisible absolute -top-2 -right-4 grid size-8 place-items-center rounded-full bg-ember font-sans text-sm font-semibold text-white md:size-10"
          >
            1
          </span>
        </h2>
      </div>
    </section>
  )
}
