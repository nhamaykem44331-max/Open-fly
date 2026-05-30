// OpenFly — My Bookings list (desktop), ported from desktop-trips.jsx TripsPage.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { T } from '../../theme/tokens'
import { Eyebrow, AirlineBadge, Card, Ic } from '../../components/ui'
import { Container } from '../../shell/Container'
import { AIRPORTS } from '../../data/mock'
import type { Booking } from '../../data/mock'

const STATUS: Record<Booking['status'], { label: string; color: string }> = {
  confirmed: { label: 'Đã xác nhận', color: T.green },
  holding: { label: 'Đang giữ chỗ', color: T.amber },
  completed: { label: 'Đã hoàn thành', color: T.ink3 },
  cancelled: { label: 'Đã hủy', color: T.red },
}

function BookingCard({ b, onOpen }: { b: Booking; onOpen: () => void }) {
  const a1 = AIRPORTS[b.from]
  const a2 = AIRPORTS[b.to]
  const sm = STATUS[b.status]
  return (
    <Card hover onClick={onOpen} style={{ padding: 0, overflow: 'hidden', borderRadius: 8 }}>
      <div style={{ padding: '20px 26px', display: 'flex', alignItems: 'center', gap: 26 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, width: 220, flexShrink: 0 }}>
          <AirlineBadge code={b.airline} size={42} color={T.ink2} />
          <div>
            <div style={{ fontFamily: T.serif, fontSize: 17, fontWeight: 500, color: T.ink }}>{b.from} → {b.to}</div>
            <div style={{ fontFamily: T.sans, fontSize: 11.5, color: T.ink3, marginTop: 2 }}>{a1.city} → {a2.city}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
          <div style={{ textAlign: 'center' }}><div style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 500, color: T.ink, lineHeight: 1 }}>{b.depart}</div><div style={{ fontFamily: T.sans, fontSize: 11, fontWeight: 600, color: T.ink3, marginTop: 4 }}>{b.from}</div></div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}><div style={{ flex: 1, height: 1, background: T.line2 }} /><Ic.plane2 size={13} stroke={T.rust} sw={1.6} /><div style={{ flex: 1, height: 1, background: T.line2 }} /></div>
          <div style={{ textAlign: 'center' }}><div style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 500, color: T.ink, lineHeight: 1 }}>{b.arrive}</div><div style={{ fontFamily: T.sans, fontSize: 11, fontWeight: 600, color: T.ink3, marginTop: 4 }}>{b.to}</div></div>
        </div>
        <div style={{ width: 200, flexShrink: 0, textAlign: 'right', borderLeft: `1px solid ${T.line}`, paddingLeft: 24 }}>
          <div style={{ fontFamily: T.sans, fontSize: 12, color: T.ink3 }}>{b.dateLabel.split(' · ')[0]}</div>
          <div style={{ fontFamily: T.mono, fontSize: 13, color: T.ink2, letterSpacing: 0.5, marginTop: 4 }}>{b.pnr}</div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8, fontFamily: T.sans, fontSize: 11.5, fontWeight: 600, color: sm.color }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: sm.color }} />{sm.label}</span>
        </div>
      </div>
      {b.status === 'holding' && <div style={{ background: T.rustTint, padding: '10px 26px', fontFamily: T.serif, fontSize: 13.5, color: T.rust, fontStyle: 'italic', borderTop: `1px solid ${T.line}`, display: 'flex', alignItems: 'center', gap: 6 }}><Ic.clock size={14} stroke={T.rust} /> Còn 2g 14p để hoàn tất — {b.holdExpiresAt}</div>}
      {b.status === 'confirmed' && <div style={{ background: T.paper2, padding: '10px 26px', fontFamily: T.serif, fontSize: 13.5, color: T.ink2, fontStyle: 'italic', borderTop: `1px solid ${T.line}`, display: 'flex', alignItems: 'center', gap: 6 }}><Ic.info size={14} stroke={T.ink3} /> Check-in {b.checkinOpensAt}</div>}
    </Card>
  )
}

export function TripsListDesktop({ bookings }: { bookings: Booking[] }) {
  const navigate = useNavigate()
  const [tab, setTab] = useState<'upcoming' | 'history'>('upcoming')
  const upcoming = bookings.filter((b) => ['confirmed', 'holding'].includes(b.status))
  const history = bookings.filter((b) => ['completed', 'cancelled'].includes(b.status))
  const list = tab === 'upcoming' ? upcoming : history
  return (
    <div style={{ background: T.canvas, minHeight: '100%', paddingBottom: 70 }}>
      <Container max={1100} style={{ paddingTop: 48 }}>
        <Eyebrow>Quản lý chuyến bay</Eyebrow>
        <h1 style={{ fontFamily: T.serif, fontSize: 44, fontWeight: 300, letterSpacing: '-1.8px', color: T.ink, margin: '14px 0 24px' }}>Chuyến của tôi</h1>
        <div style={{ display: 'flex', gap: 8, marginBottom: 26, borderBottom: `1px solid ${T.line}` }}>
          {([['upcoming', `Sắp tới · ${upcoming.length}`], ['history', `Lịch sử · ${history.length}`]] as const).map(([id, l]) => (
            <button key={id} onClick={() => setTab(id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px 14px', position: 'relative', fontFamily: T.serif, fontSize: 17, fontWeight: 500, color: tab === id ? T.ink : T.ink3, marginRight: 18 }}>
              {l}{tab === id && <span style={{ position: 'absolute', left: 0, right: 18, bottom: -1, height: 2, background: T.rust }} />}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {list.map((b) => <BookingCard key={b.id} b={b} onOpen={() => navigate(`/trips/${b.id}`)} />)}
        </div>
      </Container>
    </div>
  )
}
