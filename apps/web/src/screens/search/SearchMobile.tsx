// OpenFly — Search (mobile), ported from screens-home.jsx SearchScreen.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { T, fmtCalPrice } from '../../theme/tokens'
import { Eyebrow, Chip, Ic } from '../../components/ui'
import { AIRPORTS, PRICE_CALENDAR_JUN } from '../../data/mock'
import { useSearchStore } from '../../stores/search'

function PriceCalendarGrid({ day, setDay }: { day: number; setDay: (d: number) => void }) {
  const daysInMonth = 30
  const firstDow = 1 // June 1 2026 is a Monday
  const headers = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
  const cells: (number | null)[] = []
  const pad = (firstDow + 6) % 7
  for (let i = 0; i < pad; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  const toneColor = (tone: string) => (tone === 'low' ? T.green : tone === 'mid' ? T.amber : T.red)

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 4, marginBottom: 8 }}>
        {headers.map((h) => (
          <div key={h} style={{ fontFamily: T.sans, fontSize: 10, fontWeight: 500, color: T.ink3, textAlign: 'center', letterSpacing: 0.5 }}>{h}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 4 }}>
        {cells.map((d, i) => {
          if (!d) return <div key={i} />
          const meta = PRICE_CALENDAR_JUN[d]
          const selected = d === day
          return (
            <button key={i} onClick={() => setDay(d)} style={{ padding: '6px 0 5px', borderRadius: 4, cursor: 'pointer', background: selected ? T.ink : 'transparent', border: selected ? 'none' : '1px solid transparent', transition: 'background 0.15s' }}>
              <div style={{ fontFamily: T.serif, fontSize: 14, fontWeight: 500, color: selected ? T.paper : T.ink, lineHeight: 1 }}>{d}</div>
              {meta ? (
                <div style={{ fontFamily: T.sans, fontSize: 9, fontWeight: 500, color: selected ? T.rustSoft : toneColor(meta.tone), marginTop: 3, letterSpacing: 0.2 }}>{fmtCalPrice(meta.price)}</div>
              ) : (
                <div style={{ height: 12, marginTop: 3 }}><div style={{ width: 4, height: 2, borderRadius: 1, background: T.line2, margin: '5px auto 0' }} /></div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function SearchMobile() {
  const navigate = useNavigate()
  const [tripType, setTripType] = useState('one')
  const [from, setFrom] = useState('HAN')
  const [to, setTo] = useState('DAD')
  const [day, setDay] = useState(15)
  const pax = 1
  const cabin = 'Phổ thông'
  const a1 = AIRPORTS[from]
  const a2 = AIRPORTS[to]

  return (
    <div style={{ background: T.paper, minHeight: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px 8px' }}>
        <button onClick={() => navigate('/')} aria-label="Quay lại" style={{ width: 36, height: 36, borderRadius: '50%', background: 'transparent', border: `1px solid ${T.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Ic.back size={16} stroke={T.ink} />
        </button>
        <div style={{ flex: 1 }}><Eyebrow dash={false}>Tìm chuyến bay</Eyebrow></div>
      </div>

      <div style={{ padding: '8px 20px 0' }}>
        <h1 style={{ fontFamily: T.serif, fontSize: 28, fontWeight: 400, letterSpacing: '-1px', lineHeight: 1.1, color: T.ink, margin: '8px 0 20px' }}>
          Hôm nay <em style={{ color: T.rust, fontWeight: 500 }}>bạn đi đâu</em>?
        </h1>

        {/* Trip type chips */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <Chip active={tripType === 'one'} onClick={() => setTripType('one')}>Một chiều</Chip>
          <Chip active={tripType === 'round'} onClick={() => setTripType('round')}>Khứ hồi</Chip>
          <Chip active={tripType === 'multi'} onClick={() => setTripType('multi')}>Nhiều chặng</Chip>
        </div>

        {/* From */}
        <div style={{ background: T.paper2, border: `1px solid ${T.line}`, borderRadius: 6, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
          <div style={{ width: 24, display: 'flex', justifyContent: 'center' }}><Ic.dot size={10} stroke={T.ink3} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: T.sans, fontSize: 10, fontWeight: 500, letterSpacing: 1.5, textTransform: 'uppercase', color: T.ink3 }}>Điểm khởi hành</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 2 }}>
              <span style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 500, letterSpacing: '-0.5px', color: T.ink }}>{from}</span>
              <span style={{ fontFamily: T.serif, fontSize: 14, color: T.ink3 }}>· {a1.city}</span>
            </div>
          </div>
          <Ic.chevron size={14} stroke={T.ink3} />
        </div>

        {/* To */}
        <div style={{ background: T.paper2, border: `1px solid ${T.line}`, borderRadius: 6, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <div style={{ width: 24, display: 'flex', justifyContent: 'center' }}><Ic.pin size={14} stroke={T.rust} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: T.sans, fontSize: 10, fontWeight: 500, letterSpacing: 1.5, textTransform: 'uppercase', color: T.ink3 }}>Điểm đến</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 2 }}>
              <span style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 500, letterSpacing: '-0.5px', color: T.ink }}>{to}</span>
              <span style={{ fontFamily: T.serif, fontSize: 14, color: T.ink3 }}>· {a2.city}</span>
            </div>
          </div>
          <button onClick={() => { setFrom(to); setTo(from) }} aria-label="Đổi chiều" style={{ width: 32, height: 32, borderRadius: '50%', background: T.paper, border: `1px solid ${T.line2}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Ic.swap size={14} stroke={T.ink2} />
          </button>
        </div>

        {/* Price calendar */}
        <div style={{ background: T.paper, border: `1px solid ${T.line}`, borderRadius: 6, padding: 18, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <Eyebrow dash={false}>Tháng 6, 2026</Eyebrow>
              <div style={{ fontFamily: T.serif, fontSize: 17, fontWeight: 500, color: T.ink, marginTop: 4 }}>Chọn ngày bay</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button aria-label="Tháng trước" style={{ width: 28, height: 28, borderRadius: '50%', background: T.paper2, border: `1px solid ${T.line}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ic.back size={12} stroke={T.ink2} /></button>
              <button aria-label="Tháng sau" style={{ width: 28, height: 28, borderRadius: '50%', background: T.paper2, border: `1px solid ${T.line}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ic.fwd size={12} stroke={T.ink2} /></button>
            </div>
          </div>
          <PriceCalendarGrid day={day} setDay={setDay} />
          <div style={{ display: 'flex', gap: 14, marginTop: 14, paddingTop: 12, borderTop: `1px solid ${T.line}` }}>
            {[['Giá thấp', T.green], ['Trung bình', T.amber], ['Giá cao', T.red]].map(([l, c]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
                <span style={{ fontFamily: T.sans, fontSize: 10, color: T.ink3, letterSpacing: 0.3 }}>{l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Passengers / cabin */}
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1, background: T.paper2, border: `1px solid ${T.line}`, borderRadius: 6, padding: '14px 16px' }}>
            <div style={{ fontFamily: T.sans, fontSize: 10, fontWeight: 500, letterSpacing: 1.5, textTransform: 'uppercase', color: T.ink3 }}>Hành khách</div>
            <div style={{ fontFamily: T.serif, fontSize: 15, color: T.ink, marginTop: 4 }}>{pax} người lớn</div>
          </div>
          <div style={{ flex: 1, background: T.paper2, border: `1px solid ${T.line}`, borderRadius: 6, padding: '14px 16px' }}>
            <div style={{ fontFamily: T.sans, fontSize: 10, fontWeight: 500, letterSpacing: 1.5, textTransform: 'uppercase', color: T.ink3 }}>Hạng ghế</div>
            <div style={{ fontFamily: T.serif, fontSize: 15, color: T.ink, marginTop: 4 }}>{cabin}</div>
          </div>
        </div>

        {/* Sol insight */}
        <div style={{ marginTop: 20, padding: 16, borderRadius: 6, background: T.paper2, border: `1px solid ${T.line}`, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: T.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontFamily: T.serif, fontSize: 14, color: T.rustSoft, fontStyle: 'italic', fontWeight: 500, marginTop: -1 }}>S</span>
          </div>
          <div style={{ flex: 1 }}>
            <Eyebrow dash={false} style={{ marginBottom: 4 }}>Sol gợi ý</Eyebrow>
            <div style={{ fontFamily: T.serif, fontSize: 13, color: T.ink2, lineHeight: 1.5, fontStyle: 'italic' }}>
              Bay ngày <em style={{ color: T.rust, fontStyle: 'normal', fontWeight: 500 }}>23 thg 6 (thứ Ba)</em> rẻ hơn khoảng 35% so với cuối tuần. Bạn có muốn xem không?
            </div>
          </div>
        </div>

        {/* Submit */}
        <button onClick={() => { useSearchStore.getState().setSearch({ origin: from, destination: to, date: `2026-06-${String(day).padStart(2, '0')}`, paxAdt: 1, paxChd: 0, paxInf: 0 }); navigate('/results') }} style={{ width: '100%', margin: '24px 0 8px', padding: '18px', background: T.ink, color: T.paper, border: 'none', borderRadius: 4, fontFamily: T.serif, fontSize: 16, fontWeight: 500, letterSpacing: '-0.2px', cursor: 'pointer' }}>
          Tìm 8 chuyến bay
        </button>
      </div>
    </div>
  )
}
