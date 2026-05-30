// OpenFly — My Bookings list (mobile), ported from screens-trips.jsx TripsListScreen.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { T } from '../../theme/tokens'
import { Eyebrow, AirlineBadge, Sunmark, Ic } from '../../components/ui'
import { AIRLINES, AIRPORTS } from '../../data/mock'
import type { Booking } from '../../data/mock'

const STATUS = {
  confirmed: { label: 'Đã xác nhận', color: T.green, dot: true, bg: 'rgba(74,138,111,0.08)' },
  holding: { label: 'Đang giữ chỗ', color: T.amber, dot: false, bg: 'rgba(201,154,44,0.08)' },
  completed: { label: 'Đã hoàn thành', color: T.ink3, dot: false, bg: 'transparent' },
  cancelled: { label: 'Đã hủy', color: T.red, dot: false, bg: 'rgba(181,58,58,0.08)' },
} as const

function BookingListCard({ b, onTap }: { b: Booking; onTap: () => void }) {
  const a = AIRLINES[b.airline]
  const a1 = AIRPORTS[b.from]
  const a2 = AIRPORTS[b.to]
  const isCompleted = b.status === 'completed'
  const sm = STATUS[b.status]
  return (
    <div onClick={onTap} style={{ background: isCompleted ? T.paper2 : T.paper, border: `1px solid ${b.status === 'confirmed' ? T.ink : T.line}`, borderRadius: 6, cursor: 'pointer', overflow: 'hidden', transition: 'all 0.15s', opacity: isCompleted ? 0.85 : 1 }}>
      {(b.status === 'confirmed' || b.status === 'holding') && (
        <div style={{ padding: '8px 18px', background: b.status === 'confirmed' ? T.ink : sm.bg, color: b.status === 'confirmed' ? T.paper : sm.color, display: 'flex', alignItems: 'center', gap: 8, borderBottom: `1px solid ${T.line}` }}>
          {sm.dot && <div style={{ width: 6, height: 6, borderRadius: '50%', background: b.status === 'confirmed' ? T.rustSoft : sm.color }} />}
          <span style={{ fontFamily: T.sans, fontSize: 10, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase' }}>{sm.label}</span>
          <div style={{ flex: 1 }} />
          {b.status === 'confirmed' && b.checkinOpensAt && <span style={{ fontFamily: T.serif, fontSize: 11, color: T.rustSoft, fontStyle: 'italic' }}>Check-in {b.checkinOpensAt}</span>}
          {b.status === 'holding' && <span style={{ fontFamily: T.serif, fontSize: 11, color: sm.color, fontStyle: 'italic' }}>{b.holdExpiresAt}</span>}
        </div>
      )}
      <div style={{ padding: '16px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <AirlineBadge code={b.airline} size={26} color={a.color} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: T.sans, fontSize: 11, fontWeight: 500, color: T.ink2 }}>{a.short}</div>
            <div style={{ fontFamily: T.sans, fontSize: 10, color: T.ink3, marginTop: 1 }}>{b.number}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: T.sans, fontSize: 9.5, color: T.ink3, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600 }}>PNR</div>
            <div style={{ fontFamily: T.mono, fontSize: 13, color: T.ink, fontWeight: 500, letterSpacing: 1.5, marginTop: 1 }}>{b.pnr}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
          <div>
            <div style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 500, color: T.ink, letterSpacing: '-0.6px', lineHeight: 1 }}>{b.depart}</div>
            <div style={{ fontFamily: T.sans, fontSize: 11, fontWeight: 600, color: T.ink3, marginTop: 4, letterSpacing: 0.5 }}>{b.from}</div>
            <div style={{ fontFamily: T.sans, fontSize: 9.5, color: T.ink4, marginTop: 1 }}>{a1.city}</div>
          </div>
          <div style={{ flex: 1, padding: '0 6px' }}>
            <div style={{ fontFamily: T.sans, fontSize: 10, color: T.ink3, textAlign: 'center', marginBottom: 4 }}>{b.duration}</div>
            <div style={{ position: 'relative', height: 10, display: 'flex', alignItems: 'center' }}>
              <div style={{ flex: 1, height: 1, background: T.line2 }} /><Ic.plane2 size={12} stroke={T.rust} sw={1.6} /><div style={{ flex: 1, height: 1, background: T.line2 }} />
            </div>
            <div style={{ fontFamily: T.sans, fontSize: 10, color: T.ink3, textAlign: 'center', marginTop: 4 }}>{b.dateLabel.split(' · ')[0]}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 500, color: T.ink, letterSpacing: '-0.6px', lineHeight: 1 }}>{b.arrive}</div>
            <div style={{ fontFamily: T.sans, fontSize: 11, fontWeight: 600, color: T.ink3, marginTop: 4, letterSpacing: 0.5 }}>{b.to}</div>
            <div style={{ fontFamily: T.sans, fontSize: 9.5, color: T.ink4, marginTop: 1 }}>{a2.city}</div>
          </div>
        </div>
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.line}`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontFamily: T.sans, fontSize: 11, color: T.ink3 }}>
            <em style={{ color: T.ink2, fontStyle: 'normal', fontWeight: 500 }}>{b.pax.length} khách</em> · ghế {b.seats.join(', ')}
          </div>
          <div style={{ flex: 1 }} />
          {b.status === 'confirmed' && <span style={{ fontFamily: T.sans, fontSize: 10, fontWeight: 600, color: T.rust, letterSpacing: 1, textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: 4 }}>Xem vé <Ic.arrow size={11} stroke={T.rust} /></span>}
          {b.status === 'holding' && <span style={{ fontFamily: T.sans, fontSize: 10, fontWeight: 600, color: T.amber, letterSpacing: 1, textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: 4 }}>Thanh toán <Ic.arrow size={11} stroke={T.amber} /></span>}
        </div>
      </div>
    </div>
  )
}

export function TripsListMobile({ bookings }: { bookings: Booking[] }) {
  const navigate = useNavigate()
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming')
  const upcoming = bookings.filter((b) => b.status === 'confirmed' || b.status === 'holding')
  const past = bookings.filter((b) => b.status === 'completed' || b.status === 'cancelled')
  const list = tab === 'upcoming' ? upcoming : past

  return (
    <div style={{ background: T.paper, minHeight: '100%' }}>
      <div style={{ padding: '14px 20px 0' }}>
        <Eyebrow>Chuyến của bạn</Eyebrow>
        <h1 style={{ fontFamily: T.serif, fontSize: 30, fontWeight: 400, letterSpacing: '-1.1px', lineHeight: 1.05, color: T.ink, margin: '12px 0 6px' }}>
          Mọi hành trình, <em style={{ color: T.rust, fontWeight: 500 }}>một nơi</em>.
        </h1>
        <p style={{ fontFamily: T.serif, fontSize: 13, color: T.ink3, fontStyle: 'italic', margin: 0, lineHeight: 1.5, marginBottom: 18 }}>
          Vé sắp tới, lịch sử, voucher PDF — tất cả tại đây.
        </p>
      </div>
      <div style={{ margin: '0 20px 18px', padding: 4, background: T.paper2, borderRadius: 100, border: `1px solid ${T.line}`, display: 'flex' }}>
        {([['upcoming', `Sắp tới · ${upcoming.length}`], ['past', `Lịch sử · ${past.length}`]] as const).map(([id, label]) => {
          const active = tab === id
          return (
            <button key={id} onClick={() => setTab(id)} style={{ flex: 1, padding: '10px', background: active ? T.ink : 'transparent', border: 'none', borderRadius: 100, cursor: 'pointer', fontFamily: T.serif, fontSize: 13, fontWeight: 500, color: active ? T.paper : T.ink2, letterSpacing: '-0.2px', transition: 'all 0.15s' }}>{label}</button>
          )
        })}
      </div>
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {list.map((b) => <BookingListCard key={b.id} b={b} onTap={() => navigate(`/trips/${b.id}`)} />)}
        {list.length === 0 && (
          <div style={{ padding: '40px 20px', textAlign: 'center', opacity: 0.6 }}>
            <Sunmark size={36} />
            <p style={{ fontFamily: T.serif, fontSize: 14, color: T.ink3, fontStyle: 'italic', marginTop: 12 }}>Chưa có chuyến nào ở đây.</p>
          </div>
        )}
      </div>
      <div style={{ padding: '24px 20px 8px' }}>
        <button onClick={() => navigate('/sol')} style={{ width: '100%', padding: '14px 18px', background: T.paper, border: `1px solid ${T.line}`, borderRadius: 6, display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', textAlign: 'left' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: T.ink, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: T.serif, fontSize: 17, color: T.rustSoft, fontStyle: 'italic', fontWeight: 600, marginTop: -1 }}>S</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: T.serif, fontSize: 14, color: T.ink, fontWeight: 500, letterSpacing: '-0.2px' }}>Cần đổi/hủy vé?</div>
            <div style={{ fontFamily: T.sans, fontSize: 11, color: T.ink3, marginTop: 1 }}>Chat với Sol · phản hồi trong 1 phút</div>
          </div>
          <Ic.chevron size={14} stroke={T.ink3} />
        </button>
      </div>
    </div>
  )
}
