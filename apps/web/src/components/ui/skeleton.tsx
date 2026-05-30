// OpenFly — skeleton primitives (ported from screens-states-loading.jsx).
// Editorial restraint: NO shimmer gradient — just a gentle opacity pulse on Paper-3.
import type { CSSProperties, ReactNode } from 'react'
import { T } from '../../theme/tokens'

const PULSE = 'skPulse 1.6s ease-in-out infinite'

export function SkBox({ w, h = 12, r = 4, style }: { w?: number | string; h?: number; r?: number; style?: CSSProperties }) {
  return <div style={{ width: w, height: h, borderRadius: r, background: T.paper3, opacity: 0.65, animation: PULSE, ...style }} />
}

export function SkLine({ w = '100%', h = 10 }: { w?: number | string; h?: number }) {
  return <SkBox w={w} h={h} r={3} />
}

export function SkCircle({ size = 32 }: { size?: number }) {
  return <div style={{ width: size, height: size, borderRadius: '50%', background: T.paper3, opacity: 0.65, animation: PULSE, flexShrink: 0 }} />
}

export function SkEyebrow() {
  return <div style={{ fontFamily: T.sans, fontSize: 10, fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', color: T.ink4, fontStyle: 'italic' }}>— Đang tải...</div>
}

export function SkCard({ children, p = 16, style }: { children?: ReactNode; p?: number; style?: CSSProperties }) {
  return <div style={{ background: T.paper, border: `1px solid ${T.line}`, borderRadius: 6, padding: p, ...style }}>{children}</div>
}
