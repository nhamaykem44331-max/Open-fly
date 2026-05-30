// OpenFly — shared booking-flow parts (ported from screens-booking.jsx).
import { useNavigate } from 'react-router-dom'
import { T } from '../../theme/tokens'
import { Eyebrow, AirlineBadge, Ic } from '../../components/ui'
import { AIRLINES } from '../../data/mock'
import type { Flight } from '../../data/mock'

export function StepHeader({ label, step, total = 4 }: { label: string; step: number; total?: number }) {
  const navigate = useNavigate()
  return (
    <div style={{ padding: '14px 20px 8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate(-1)} aria-label="Quay lại" style={{ width: 36, height: 36, borderRadius: '50%', background: 'transparent', border: `1px solid ${T.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Ic.back size={16} stroke={T.ink} />
        </button>
        <div style={{ flex: 1 }}><Eyebrow dash={false}>{label}</Eyebrow></div>
        <div style={{ fontFamily: T.serif, fontSize: 12, color: T.ink3, fontStyle: 'italic', letterSpacing: 0.2 }}>
          Bước <em style={{ color: T.ink, fontStyle: 'normal', fontWeight: 500 }}>{step}</em>/{total}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < step ? T.ink : T.line2 }} />
        ))}
      </div>
    </div>
  )
}

export function MiniFlightCard({ flight }: { flight: Flight }) {
  const a = AIRLINES[flight.airline]
  return (
    <div style={{ background: T.paper2, border: `1px solid ${T.line}`, borderRadius: 6, padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <AirlineBadge code={flight.airline} size={28} color={a.color} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: T.sans, fontSize: 11, fontWeight: 500, color: T.ink2 }}>{a.short} · {flight.number}</div>
          <div style={{ fontFamily: T.sans, fontSize: 10, color: T.ink3, marginTop: 1 }}>CN, 15 thg 6 · {flight.aircraft}</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div>
          <div style={{ fontFamily: T.serif, fontSize: 18, fontWeight: 500, color: T.ink, letterSpacing: '-0.4px', lineHeight: 1 }}>{flight.depart}</div>
          <div style={{ fontFamily: T.sans, fontSize: 10, fontWeight: 600, color: T.ink3, marginTop: 3, letterSpacing: 0.5 }}>{flight.from}</div>
        </div>
        <div style={{ flex: 1, padding: '0 6px' }}>
          <div style={{ fontFamily: T.sans, fontSize: 9, color: T.ink3, textAlign: 'center', marginBottom: 3 }}>{flight.duration} · bay thẳng</div>
          <div style={{ height: 1, background: T.line2, position: 'relative', display: 'flex', justifyContent: 'center' }}><Ic.plane2 size={10} stroke={T.rust} sw={1.6} /></div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: T.serif, fontSize: 18, fontWeight: 500, color: T.ink, letterSpacing: '-0.4px', lineHeight: 1 }}>{flight.arrive}</div>
          <div style={{ fontFamily: T.sans, fontSize: 10, fontWeight: 600, color: T.ink3, marginTop: 3, letterSpacing: 0.5 }}>{flight.to}</div>
        </div>
      </div>
    </div>
  )
}

export function SummaryRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '6px 0' }}>
      <span style={{ fontFamily: T.serif, fontSize: 13, color: T.ink2 }}>{label}</span>
      <span style={{ fontFamily: T.serif, fontSize: 14, color: highlight ? T.green : T.ink, fontWeight: 500, letterSpacing: '-0.2px' }}>{value}</span>
    </div>
  )
}
