"use client"

import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"

type TextFadeInConfig = gsap.TweenVars

type ImageParallaxConfig = {
  direction?: "x" | "y"
  trigger?: gsap.DOMTarget
  amount?: number
  noScale?: boolean
  centered?: boolean
  ease?: string
  start?: string
  end?: string
}

declare module "gsap" {
  interface GSAPTimeline {
    textFadeIn(targets: gsap.TweenTarget, config?: TextFadeInConfig, position?: gsap.Position): this
  }
}

let registered = false

function registerGSAP() {
  if (registered || typeof window === "undefined") return
  registered = true

  gsap.registerPlugin(ScrollTrigger, useGSAP)
  gsap.config({ autoSleep: Infinity, force3D: true })

  gsap.registerEffect({
    name: "textFadeIn",
    defaults: { duration: 0.5, stagger: 0.1 },
    extendTimeline: true,
    effect: (targets: gsap.TweenTarget, { duration, stagger, ...rest }: TextFadeInConfig) =>
      gsap.fromTo(
        targets,
        { opacity: 0, y: -10, z: 25, rotationX: 10 },
        { opacity: 1, y: 0, z: 0, rotationX: 0, ease: "power3.out", duration, stagger, ...rest }
      ),
  })

  gsap.registerEffect({
    name: "imageParallax",
    effect: (
      el: gsap.DOMTarget,
      {
        direction = "y",
        trigger,
        amount = 0.2,
        noScale = false,
        centered = true,
        ease = "none",
        start = "top bottom",
        end = "bottom top",
      }: ImageParallaxConfig
    ) => {
      const total = amount * 100
      const half = total / 2
      return gsap.fromTo(
        el,
        { scale: noScale ? 1 : 1 + amount, [direction]: `-${centered ? half : total}%` },
        {
          [direction]: `${centered ? half : 0}%`,
          ease,
          overwrite: "auto",
          scrollTrigger: { trigger: trigger ?? el, start, end, scrub: true },
        }
      )
    },
  })
}

registerGSAP()

export { gsap, ScrollTrigger, useGSAP }
export type { ImageParallaxConfig, TextFadeInConfig }
