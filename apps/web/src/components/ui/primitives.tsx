// OpenFly — shared UI primitives, ported from the Lần 6 prototype (ui.jsx).
// Values (sizes, weights, letter-spacing) are faithful to the design; colors read
// from the CSS-variable tokens so they retint with the theme automatically.
import { useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { T, fmtVnd, CURRENCY } from '../../theme/tokens'
import { Ic } from './icons'

// ─── Logo / Symbol ───────────────────────────────────────────
export function Sunmark({ size = 28, color }: { size?: number; color?: string }) {
  const c = color || T.rust
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" style={{ display: 'block' }}>
      <g stroke={c} strokeWidth="3" strokeLinecap="round" fill="none">
        <line x1="6" y1="44" x2="54" y2="44" />
        <path d="M 12 44 A 18 18 0 0 1 48 44" />
        <line x1="30" y1="14" x2="30" y2="22" />
        <line x1="20" y1="18" x2="22.5" y2="25" />
        <line x1="40" y1="18" x2="37.5" y2="25" />
        <line x1="9" y1="29" x2="14" y2="32" />
        <line x1="51" y1="29" x2="46" y2="32" />
      </g>
    </svg>
  )
}

export function Wordmark({ size = 22, onInk = false }: { size?: number; onInk?: boolean }) {
  // On a dark Ink bar the accent softens to rustSoft for contrast (desktop-ui.jsx).
  const accent = onInk ? T.rustSoft : T.rust
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Sunmark size={size + 4} color={accent} />
      <span style={{ fontFamily: T.serif, fontSize: size, letterSpacing: '-1.2px', lineHeight: 1, color: onInk ? T.onInk : T.ink, fontWeight: 300 }}>
        Open<span style={{ color: accent, fontWeight: 600 }}>Fly</span>
      </span>
    </div>
  )
}

// ─── Eyebrow label (Inter UPPERCASE) ─────────────────────────
export function Eyebrow({ children, color, dash = true, style = {} }: { children: ReactNode; color?: string; dash?: boolean; style?: CSSProperties }) {
  return (
    <div style={{ fontFamily: T.sans, fontSize: 11, fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', color: color || T.ink3, ...style }}>
      {dash && <span style={{ marginRight: 8 }}>—</span>}
      {children}
    </div>
  )
}

// ─── Chip (pill) ─────────────────────────────────────────────
export function Chip({ children, active, onClick, icon, color }: { children: ReactNode; active?: boolean; onClick?: () => void; icon?: ReactNode; color?: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '8px 14px', borderRadius: 100,
        border: `1px solid ${active ? T.ink : T.line2}`,
        background: active ? T.ink : 'transparent',
        color: active ? T.paper : color || T.ink2,
        fontFamily: T.sans, fontSize: 12, fontWeight: 500,
        letterSpacing: 0.1, cursor: 'pointer',
        whiteSpace: 'nowrap', transition: 'all 0.15s',
      }}
    >
      {icon}
      {children}
    </button>
  )
}

// ─── Price (Fraunces 500 + small đ unit) — renders FULL VND (value is in "k") ──
export function Price({ value, size = 28, color, italic = false, weight = 500 }: { value: number; size?: number; color?: string; italic?: boolean; weight?: number }) {
  return (
    <span style={{ fontFamily: T.serif, fontSize: size, fontWeight: weight, letterSpacing: '-1px', color: color || T.ink, lineHeight: 1, fontStyle: italic ? 'italic' : 'normal', whiteSpace: 'nowrap' }}>
      {fmtVnd(value)}
      <span style={{ fontSize: Math.round(size * 0.5), color: T.ink3, marginLeft: 2 }}>{CURRENCY}</span>
    </span>
  )
}

// ─── Airline badge (initials in tinted square) ───────────────
export function AirlineBadge({ code, size = 36, color }: { code: string; size?: number; color?: string }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: 6,
      background: T.paper, border: `1px solid ${T.line}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: T.sans, fontSize: Math.round(size * 0.36),
      fontWeight: 600, color: color || T.ink, letterSpacing: 0.5,
    }}>{code}</div>
  )
}

// ─── Route line — airport · dot · plane · dot · airport ─────
export function RouteLine({ from, to, color, dim = false, w = '100%' }: { from: string; to: string; duration?: string; stops?: number; color?: string; dim?: boolean; w?: number | string }) {
  const c = color || (dim ? T.ink3 : T.ink2)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: w }}>
      <div style={{ fontFamily: T.sans, fontSize: 11, fontWeight: 600, color: c, letterSpacing: 0.5 }}>{from}</div>
      <div style={{ flex: 1, position: 'relative', height: 12, display: 'flex', alignItems: 'center' }}>
        <div style={{ flex: 1, height: 1, background: T.line2 }} />
        <Ic.plane2 size={12} stroke={T.rust} sw={1.6} />
        <div style={{ flex: 1, height: 1, background: T.line2 }} />
      </div>
      <div style={{ fontFamily: T.sans, fontSize: 11, fontWeight: 600, color: c, letterSpacing: 0.5 }}>{to}</div>
    </div>
  )
}

// ─── Sparkline (price trend in fare hunt cards) ──────────────
export function Sparkline({ data, color, w = 80, h = 22 }: { data: number[]; color?: string; w?: number; h?: number }) {
  if (!data || data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const span = Math.max(1, max - min)
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / span) * h
    return [x, y] as const
  })
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')
  const last = pts[pts.length - 1]
  return (
    <svg width={w} height={h} style={{ display: 'block', overflow: 'visible' }}>
      <path d={path} fill="none" stroke={color || T.rust} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="2.5" fill={color || T.rust} />
    </svg>
  )
}

// ─── Section divider with optional text ─────────────────────
export function Divider({ label, style = {} }: { label?: string; style?: CSSProperties }) {
  if (!label) return <div style={{ height: 1, background: T.line, ...style }} />
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, ...style }}>
      <div style={{ flex: 1, height: 1, background: T.line }} />
      <div style={{ fontFamily: T.sans, fontSize: 11, fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', color: T.ink3 }}>{label}</div>
      <div style={{ flex: 1, height: 1, background: T.line }} />
    </div>
  )
}

// ─── Card primitive ─────────────────────────────────────────
// `hover` adds the desktop lift (translateY + soft shadow) via JS state, since
// inline styles can't express :hover.
export function Card({ children, featured, onClick, hover, style = {} }: { children: ReactNode; featured?: boolean; onClick?: () => void; hover?: boolean; style?: CSSProperties }) {
  const [over, setOver] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={hover ? () => setOver(true) : undefined}
      onMouseLeave={hover ? () => setOver(false) : undefined}
      style={{
        background: T.paper,
        border: `1px solid ${featured ? T.ink : T.line}`,
        borderRadius: 6,
        padding: 18,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease',
        transform: over ? 'translateY(-2px)' : 'none',
        boxShadow: over ? '0 14px 40px -18px rgba(26,26,25,0.30)' : 'none',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// ─── Button (primary / rust / secondary / ghost) ────────────
export function Btn({ children, onClick, variant = 'primary', size = 'md', icon, full, style = {} }: { children: ReactNode; onClick?: () => void; variant?: 'primary' | 'rust' | 'secondary' | 'ghost'; size?: 'lg' | 'md' | 'sm'; icon?: ReactNode; full?: boolean; style?: CSSProperties }) {
  const pad = size === 'lg' ? '16px 30px' : size === 'sm' ? '9px 16px' : '13px 24px'
  const fs = size === 'lg' ? 16 : size === 'sm' ? 13 : 15
  const base: CSSProperties = {
    primary: { background: T.ink, color: T.paper, border: '1px solid transparent' },
    rust: { background: T.rust, color: '#F5F1EA', border: '1px solid transparent' },
    secondary: { background: 'transparent', color: T.ink, border: `1px solid ${T.ink}` },
    ghost: { background: 'transparent', color: T.ink2, border: `1px solid ${T.line2}` },
  }[variant]
  return (
    <button onClick={onClick} style={{ ...base, padding: pad, borderRadius: 4, cursor: 'pointer', fontFamily: T.serif, fontSize: fs, fontWeight: 500, letterSpacing: '-0.2px', display: full ? 'flex' : 'inline-flex', width: full ? '100%' : 'auto', alignItems: 'center', justifyContent: 'center', gap: 9, transition: 'all 0.15s', ...style }}>
      {icon}{children}
    </button>
  )
}

// ─── Toggle switch ──────────────────────────────────────────
export function Toggle({ on, onClick }: { on?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} role="switch" aria-checked={!!on} style={{ width: 42, height: 24, borderRadius: 100, position: 'relative', background: on ? T.ink : T.paper3, border: `1px solid ${on ? T.ink : T.line2}`, cursor: 'pointer', transition: 'all 0.18s', padding: 0, flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 2, left: on ? 20 : 2, width: 18, height: 18, borderRadius: '50%', background: T.paper, transition: 'left 0.18s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
    </button>
  )
}

// ─── Numbered section label (rust italic № + uppercase title + rule) ────
export function SectionLabel({ num, title, style = {} }: { num: string; title: string; style?: CSSProperties }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, ...style }}>
      <span style={{ fontFamily: T.serif, fontSize: 14, fontWeight: 500, color: T.rust, fontStyle: 'italic' }}>{num}</span>
      <span style={{ fontFamily: T.sans, fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', color: T.ink2 }}>{title}</span>
      <div style={{ flex: 1, height: 1, background: T.line }} />
    </div>
  )
}
