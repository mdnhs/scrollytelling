import type { gsap } from "@/lib/gsap"

type Span = { start: number; end: number }

type Waypoint = {
  at: number
  onCall: () => void
  onReverseCall: () => void
}

// Timeline is normalized to 100 units so every tween is positioned by scroll percentage, not seconds.
export function createScrollytelling(tl: gsap.core.Timeline) {
  tl.to({}, { duration: 100 }, 0)

  const get = <T extends gsap.TweenVars>({ start, end, ...vars }: Span & T) =>
    [{ ...vars, duration: end - start }, start] as const

  const waypoint = ({ at, onCall, onReverseCall }: Waypoint) => {
    tl.call(() => ((tl.scrollTrigger?.direction ?? 1) > 0 ? onCall() : onReverseCall()), [], at)
  }

  return { get, waypoint }
}
