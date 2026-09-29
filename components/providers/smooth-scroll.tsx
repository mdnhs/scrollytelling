"use client"

import { ReactLenis, type LenisRef } from "lenis/react"
import { useEffect, useRef } from "react"

import { gsap, ScrollTrigger } from "@/lib/gsap"

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<LenisRef>(null)

  useEffect(() => {
    // Lenis is driven by GSAP's ticker so scroll position and scrubbed tweens update in the same frame.
    const update = (time: number) => lenisRef.current?.lenis?.raf(time * 1000)
    gsap.ticker.add(update)
    gsap.ticker.lagSmoothing(0)
    const lenis = lenisRef.current?.lenis
    lenis?.on("scroll", ScrollTrigger.update)

    return () => {
      gsap.ticker.remove(update)
      lenis?.off("scroll", ScrollTrigger.update)
    }
  }, [])

  return (
    <ReactLenis root ref={lenisRef} options={{ lerp: 0.145, wheelMultiplier: 1, autoRaf: false }}>
      {children}
    </ReactLenis>
  )
}
