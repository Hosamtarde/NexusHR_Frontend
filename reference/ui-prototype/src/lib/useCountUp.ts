import { useEffect, useRef, useState } from 'react'

export function useCountUp(target: number, enabled = true, duration = 900) {
  const [value, setValue] = useState(enabled ? 0 : target)
  const frame = useRef(0)

  useEffect(() => {
    if (!enabled || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      frame.current = window.requestAnimationFrame(() => setValue(target))
      return () => window.cancelAnimationFrame(frame.current)
    }
    const start = performance.now()
    const tick = (now: number) => {
      const progress = Math.max(0, Math.min(1, (now - start) / duration))
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(target * eased)
      if (progress < 1) frame.current = window.requestAnimationFrame(tick)
    }
    frame.current = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frame.current)
  }, [target, enabled, duration])

  return value
}
