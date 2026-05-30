import { useSyncExternalStore } from 'react'

// Mobile/desktop chrome split. Tablets stay on the touch-friendly mobile layout;
// the editorial desktop shell (TopNav/Footer, multi-column) kicks in at ≥1024.
export const DESKTOP_MIN = 1024
// Within mobile, the design tweaks at these breakpoints (Q-55).
export const TIGHT_MAX = 380 // tight  = width < 380 (Android narrow, iPhone SE)
export const WIDE_MIN = 410 // wide   = width >= 410 (iPhone Pro Max)

function subscribe(cb: () => void): () => void {
  window.addEventListener('resize', cb)
  return () => window.removeEventListener('resize', cb)
}
function getWidth(): number {
  return typeof window !== 'undefined' ? window.innerWidth : 1280
}

export interface Viewport {
  width: number
  isDesktop: boolean
  tight: boolean
  wide: boolean
}

export function useViewport(): Viewport {
  const width = useSyncExternalStore(subscribe, getWidth, () => 1280)
  return {
    width,
    isDesktop: width >= DESKTOP_MIN,
    tight: width < TIGHT_MAX,
    wide: width >= WIDE_MIN,
  }
}
