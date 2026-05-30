// OpenFly — outline icon set (stroke 1.5, round caps/joins).
// Ported verbatim from the Lần 6 prototype (ui.jsx). Usage: <Ic.bell size={16} stroke={T.ink2} />
import type { CSSProperties, ReactNode } from 'react'
import { T } from '../../theme/tokens'

export interface IconProps {
  size?: number
  stroke?: string
  sw?: number
  fill?: string
  style?: CSSProperties
}

function I({ size = 20, stroke = 'currentColor', sw = 1.5, fill = 'none', style, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={stroke}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: 'block', flexShrink: 0, ...style }}
    >
      {children}
    </svg>
  )
}

export const Ic = {
  bell: (p: IconProps) => <I {...p}><path d="M6 8a6 6 0 1 1 12 0c0 4 1.5 5 2 6H4c.5-1 2-2 2-6z" /><path d="M10 18a2 2 0 0 0 4 0" /></I>,
  back: (p: IconProps) => <I {...p}><path d="M15 6l-6 6 6 6" /></I>,
  fwd: (p: IconProps) => <I {...p}><path d="M9 6l6 6-6 6" /></I>,
  search: (p: IconProps) => <I {...p}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></I>,
  swap: (p: IconProps) => <I {...p}><path d="M7 7h13M16 3l4 4-4 4M17 17H4m4 4-4-4 4-4" /></I>,
  cal: (p: IconProps) => <I {...p}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18M8 3v4M16 3v4" /></I>,
  user: (p: IconProps) => <I {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-7 8-7s8 3 8 7" /></I>,
  plane: (p: IconProps) => <I {...p}><path d="M21 12 3 19l3-7-3-7 18 7z" /></I>,
  plane2: (p: IconProps) => <I {...p}><path d="M17.8 19.2 16 11l3.5-3.5a1.5 1.5 0 0 0-2.1-2.1L13.9 9 5.7 7.2l-1.4 1.4L11 12l-3.4 3.4-3-1-1.2 1.2 4 2 2 4 1.2-1.2-1-3L13 14l3.4 6.6z" /></I>,
  filter: (p: IconProps) => <I {...p}><path d="M4 6h16M7 12h10M10 18h4" /></I>,
  sparkle: (p: IconProps) => <I {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" /></I>,
  spark: (p: IconProps) => <I {...p}><path d="M12 2 13.6 8.4 20 10l-6.4 1.6L12 18l-1.6-6.4L4 10l6.4-1.6L12 2z" /></I>,
  bolt: (p: IconProps) => <I {...p}><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" /></I>,
  bag: (p: IconProps) => <I {...p}><rect x="5" y="7" width="14" height="14" rx="2" /><path d="M9 7V5a3 3 0 0 1 6 0v2" /></I>,
  home: (p: IconProps) => <I {...p}><path d="M3 11 12 3l9 8v9a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z" /></I>,
  radar: (p: IconProps) => <I {...p}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" fill="currentColor" /></I>,
  ticket: (p: IconProps) => <I {...p}><path d="M3 9V7a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v2a2 2 0 0 0 0 4v2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-2a2 2 0 0 0 0-4z" /><path d="M14 6v12" /></I>,
  chat: (p: IconProps) => <I {...p}><path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-8l-5 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" /></I>,
  check: (p: IconProps) => <I {...p}><path d="m5 12 5 5 9-11" /></I>,
  send: (p: IconProps) => <I {...p}><path d="m4 20 18-8L4 4l4 8-4 8z" /></I>,
  mic: (p: IconProps) => <I {...p}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></I>,
  arrow: (p: IconProps) => <I {...p}><path d="M5 12h14M13 6l6 6-6 6" /></I>,
  dot: (p: IconProps) => <I {...p}><circle cx="12" cy="12" r="3" fill="currentColor" /></I>,
  info: (p: IconProps) => <I {...p}><circle cx="12" cy="12" r="9" /><path d="M12 8h.01M11 12h1v5h1" /></I>,
  trend: (p: IconProps) => <I {...p}><path d="M3 17 9 11l4 4 8-9M14 6h7v7" /></I>,
  chevron: (p: IconProps) => <I {...p}><path d="m9 6 6 6-6 6" /></I>,
  pin: (p: IconProps) => <I {...p}><path d="M12 22s-7-6-7-12a7 7 0 1 1 14 0c0 6-7 12-7 12z" /><circle cx="12" cy="10" r="2.5" /></I>,
  close: (p: IconProps) => <I {...p}><path d="m6 6 12 12M18 6 6 18" /></I>,
  options: (p: IconProps) => <I {...p}><circle cx="5" cy="12" r="1.5" fill="currentColor" /><circle cx="12" cy="12" r="1.5" fill="currentColor" /><circle cx="19" cy="12" r="1.5" fill="currentColor" /></I>,
  moon: (p: IconProps) => <I {...p}><path d="M20 14A8 8 0 1 1 10 4a7 7 0 0 0 10 10z" /></I>,
  sun: (p: IconProps) => <I {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5" /></I>,
  plus: (p: IconProps) => <I {...p}><path d="M12 5v14M5 12h14" /></I>,
  gift: (p: IconProps) => <I {...p}><rect x="4" y="9" width="16" height="11" rx="1" /><path d="M2 9h20v3H2zM12 9v11M12 9S9 4 6.5 6 9 9 12 9zM12 9s3-5 5.5-3S15 9 12 9z" /></I>,
  shield: (p: IconProps) => <I {...p}><path d="M12 3 5 6v5c0 4 3 7 7 9 4-2 7-5 7-9V6l-7-3z" /><path d="m9 12 2 2 4-4" /></I>,
  clock: (p: IconProps) => <I {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></I>,
  qr: (p: IconProps) => <I {...p}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3M21 14v7h-7" /></I>,
  download: (p: IconProps) => <I {...p}><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14" /></I>,
  edit: (p: IconProps) => <I {...p}><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" /></I>,
}

// Notification-channel glyphs (telegram / email / zalo / push).
export function ChannelIcon({ kind, size = 14, active = true, color }: { kind: string; size?: number; active?: boolean; color?: string }) {
  const p: IconProps = { size, stroke: color || (active ? T.ink2 : T.ink4), sw: 1.5 }
  if (kind === 'telegram') return <I {...p}><path d="m22 3-9.5 9.5L9 14l-6-2 19-9zM10 14l3 8 9-19" /></I>
  if (kind === 'email') return <I {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 7 9-7" /></I>
  if (kind === 'zalo') return <I {...p}><path d="M4 6h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-9l-5 4v-4H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z" /></I>
  if (kind === 'push') return <I {...p}><path d="M6 8a6 6 0 1 1 12 0c0 4 1.5 5 2 6H4c.5-1 2-2 2-6z" /><path d="M10 18a2 2 0 0 0 4 0" /></I>
  return null
}
