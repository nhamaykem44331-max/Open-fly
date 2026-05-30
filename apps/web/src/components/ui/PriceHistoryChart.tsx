// OpenFly — 30-day price history chart (Fare Hunter detail showpiece).
// Ported from desktop-shell.jsx. SVG colors go through CSS-var tokens so they retint with theme.
import { T, fmtVnd } from '../../theme/tokens'

export function PriceHistoryChart({ data, target, w = 720, h = 300 }: { data: number[]; target: number; w?: number; h?: number }) {
  if (!data || data.length < 2) return null
  const pad = { l: 64, r: 24, t: 26, b: 38 }
  const inner = { w: w - pad.l - pad.r, h: h - pad.t - pad.b }
  const all = [...data, target]
  const min = Math.floor(Math.min(...all) / 100) * 100 - 50
  const max = Math.ceil(Math.max(...all) / 100) * 100 + 50
  const span = max - min
  const xAt = (i: number) => pad.l + (i / (data.length - 1)) * inner.w
  const yAt = (v: number) => pad.t + inner.h - ((v - min) / span) * inner.h
  const line = data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i).toFixed(1)} ${yAt(v).toFixed(1)}`).join(' ')
  const area = `${line} L ${xAt(data.length - 1).toFixed(1)} ${(pad.t + inner.h).toFixed(1)} L ${xAt(0).toFixed(1)} ${(pad.t + inner.h).toFixed(1)} Z`
  const ticks = [0, 1, 2, 3].map((i) => { const v = min + (span / 3) * i; return { y: yAt(v), v: Math.round(v) } })
  const bestIdx = data.indexOf(Math.min(...data))
  const bestVal = data[bestIdx]
  const last = data[data.length - 1]
  const xLabels = [{ i: 0, l: '30 ngày trước' }, { i: Math.floor(data.length * 0.5), l: '15 ngày' }, { i: data.length - 1, l: 'Hôm nay' }]
  const targetY = yAt(target)
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} style={{ display: 'block', overflow: 'visible' }}>
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={pad.l} x2={pad.l + inner.w} y1={t.y} y2={t.y} style={{ stroke: T.line }} strokeWidth="0.7" strokeDasharray={i === 0 ? '0' : '2 5'} />
          <text x={pad.l - 10} y={t.y + 3} textAnchor="end" style={{ fontFamily: T.sans, fontSize: 9.5, fontWeight: 500, fill: T.ink3 }}>{fmtVnd(t.v)}</text>
        </g>
      ))}
      <line x1={pad.l} x2={pad.l + inner.w} y1={targetY} y2={targetY} style={{ stroke: T.ink2 }} strokeWidth="1" strokeDasharray="4 4" opacity="0.55" />
      <text x={pad.l + inner.w} y={targetY - 7} textAnchor="end" style={{ fontFamily: T.sans, fontSize: 10, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', fill: T.ink2 }}>Mục tiêu {fmtVnd(target)}đ</text>
      <path d={area} style={{ fill: T.rust }} opacity="0.07" />
      <path d={line} fill="none" style={{ stroke: T.rust }} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <g>
        <circle cx={xAt(bestIdx)} cy={yAt(bestVal)} r="5" style={{ fill: T.paper, stroke: T.green }} strokeWidth="2" />
        <text x={xAt(bestIdx)} y={yAt(bestVal) - 13} textAnchor="middle" style={{ fontFamily: T.sans, fontSize: 11, fontWeight: 600, fill: T.green }}>{fmtVnd(bestVal)}đ</text>
      </g>
      <circle cx={xAt(data.length - 1)} cy={yAt(last)} r="6" style={{ fill: T.rust }} />
      <circle cx={xAt(data.length - 1)} cy={yAt(last)} r="12" style={{ fill: T.rust }} opacity="0.18" />
      {xLabels.map((l, i) => (
        <text key={i} x={xAt(l.i)} y={h - 10} textAnchor={i === 0 ? 'start' : i === xLabels.length - 1 ? 'end' : 'middle'} style={{ fontFamily: T.sans, fontSize: 10, fontWeight: 500, fill: T.ink3 }}>{l.l}</text>
      ))}
    </svg>
  )
}
