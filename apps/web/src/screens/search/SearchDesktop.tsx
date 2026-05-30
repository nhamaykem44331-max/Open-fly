// OpenFly — Search (desktop), ported from desktop-search.jsx SearchPage.
import { useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { T, fmtCalPrice } from '../../theme/tokens'
import { Eyebrow, Chip, Btn, Ic } from '../../components/ui'
import { Container } from '../../shell/Container'
import { AIRPORTS, PRICE_CALENDAR_JUN } from '../../data/mock'
import { useSearchStore } from '../../stores/search'

function PriceCalendar({ day, setDay }: { day: number; setDay: (d: number) => void }) {
  const headers = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
  const cells: number[] = []
  for (let d = 1; d <= 30; d++) cells.push(d)
  const tone = (t: string) => (t === 'low' ? T.green : t === 'mid' ? T.amber : T.red)
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 6, marginBottom: 10 }}>
        {headers.map((h) => <div key={h} style={{ fontFamily: T.sans, fontSize: 11, fontWeight: 600, color: T.ink3, textAlign: 'center', letterSpacing: 0.5 }}>{h}</div>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 6 }}>
        {cells.map((d) => {
          const meta = PRICE_CALENDAR_JUN[d]
          const sel = d === day
          return (
            <button key={d} onClick={() => setDay(d)} style={{ padding: '10px 0 8px', borderRadius: 6, cursor: 'pointer', background: sel ? T.ink : 'transparent', border: `1px solid ${sel ? T.ink : 'transparent'}`, transition: 'background 0.15s' }}>
              <div style={{ fontFamily: T.serif, fontSize: 16, fontWeight: 500, color: sel ? T.paper : T.ink, lineHeight: 1 }}>{d}</div>
              {meta
                ? <div style={{ fontFamily: T.sans, fontSize: 10, fontWeight: 500, color: sel ? T.rustSoft : tone(meta.tone), marginTop: 4 }}>{fmtCalPrice(meta.price)}</div>
                : <div style={{ height: 14, marginTop: 4 }}><div style={{ width: 4, height: 2, borderRadius: 1, background: T.line2, margin: '6px auto 0' }} /></div>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function PlaceField({ label, code, city, icon, align = 'left' }: { label: string; code: string; city: string; icon: ReactNode; align?: 'left' | 'right' }) {
  return (
    <div style={{ flex: 1, padding: '18px 22px', textAlign: align }}>
      <div style={{ fontFamily: T.sans, fontSize: 10.5, fontWeight: 600, letterSpacing: 1.6, textTransform: 'uppercase', color: T.ink3, display: 'flex', alignItems: 'center', gap: 8, justifyContent: align === 'right' ? 'flex-end' : 'flex-start' }}>
        {align === 'left' && icon}{label}{align === 'right' && icon}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 6, justifyContent: align === 'right' ? 'flex-end' : 'flex-start' }}>
        <span style={{ fontFamily: T.serif, fontSize: 30, fontWeight: 500, letterSpacing: '-1px', color: T.ink }}>{code}</span>
        <span style={{ fontFamily: T.serif, fontSize: 15, color: T.ink3 }}>· {city}</span>
      </div>
    </div>
  )
}

export function SearchDesktop() {
  const navigate = useNavigate()
  const [tripType, setTripType] = useState('one')
  const [from, setFrom] = useState('HAN')
  const [to, setTo] = useState('DAD')
  const [day, setDay] = useState(15)
  const a1 = AIRPORTS[from]
  const a2 = AIRPORTS[to]

  return (
    <div style={{ background: T.canvas, minHeight: '100%', paddingBottom: 80 }}>
      <Container max={1100} style={{ paddingTop: 48 }}>
        <Eyebrow>Tìm chuyến bay</Eyebrow>
        <h1 style={{ fontFamily: T.serif, fontSize: 44, fontWeight: 300, letterSpacing: '-1.8px', color: T.ink, margin: '14px 0 26px' }}>
          Hôm nay <em style={{ color: T.rust, fontWeight: 500 }}>bạn đi đâu</em>?
        </h1>
        <div style={{ display: 'flex', gap: 10, marginBottom: 22 }}>
          <Chip active={tripType === 'one'} onClick={() => setTripType('one')}>Một chiều</Chip>
          <Chip active={tripType === 'round'} onClick={() => setTripType('round')}>Khứ hồi</Chip>
          <Chip active={tripType === 'multi'} onClick={() => setTripType('multi')}>Nhiều chặng</Chip>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 22, alignItems: 'start' }}>
          {/* left: route + pax */}
          <div>
            <div style={{ background: T.paper, border: `1px solid ${T.line2}`, borderRadius: 12, display: 'flex', alignItems: 'center', position: 'relative' }}>
              <PlaceField label="Điểm khởi hành" code={from} city={a1.city} icon={<Ic.dot size={9} stroke={T.ink3} />} />
              <button onClick={() => { setFrom(to); setTo(from) }} aria-label="Đổi chiều" style={{ width: 40, height: 40, borderRadius: '50%', background: T.paper, border: `1px solid ${T.line2}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1 }}>
                <Ic.swap size={16} stroke={T.ink2} />
              </button>
              <PlaceField label="Điểm đến" code={to} city={a2.city} icon={<Ic.pin size={13} stroke={T.rust} />} align="right" />
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
              <div style={{ flex: 1, background: T.paper, border: `1px solid ${T.line}`, borderRadius: 10, padding: '16px 20px' }}>
                <div style={{ fontFamily: T.sans, fontSize: 10.5, fontWeight: 600, letterSpacing: 1.6, textTransform: 'uppercase', color: T.ink3 }}>Hành khách</div>
                <div style={{ fontFamily: T.serif, fontSize: 18, color: T.ink, marginTop: 6 }}>1 người lớn</div>
              </div>
              <div style={{ flex: 1, background: T.paper, border: `1px solid ${T.line}`, borderRadius: 10, padding: '16px 20px' }}>
                <div style={{ fontFamily: T.sans, fontSize: 10.5, fontWeight: 600, letterSpacing: 1.6, textTransform: 'uppercase', color: T.ink3 }}>Hạng ghế</div>
                <div style={{ fontFamily: T.serif, fontSize: 18, color: T.ink, marginTop: 6 }}>Phổ thông</div>
              </div>
            </div>
            <div style={{ marginTop: 16, padding: 20, borderRadius: 10, background: T.paper, border: `1px solid ${T.line}`, display: 'flex', gap: 14 }}>
              <span style={{ width: 32, height: 32, borderRadius: '50%', background: T.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: T.serif, fontSize: 16, color: T.rustSoft, fontStyle: 'italic', fontWeight: 600 }}>S</span>
              <div>
                <Eyebrow dash={false} style={{ marginBottom: 6 }}>Sol gợi ý</Eyebrow>
                <div style={{ fontFamily: T.serif, fontSize: 15, color: T.ink2, lineHeight: 1.5, fontStyle: 'italic' }}>
                  Bay ngày <em style={{ color: T.rust, fontStyle: 'normal', fontWeight: 500 }}>23 thg 6 (thứ Ba)</em> rẻ hơn ~35% so với cuối tuần. Bạn có muốn xem không?
                </div>
              </div>
            </div>
          </div>
          {/* right: price calendar */}
          <div style={{ background: T.paper, border: `1px solid ${T.line}`, borderRadius: 12, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <Eyebrow dash={false}>Tháng 6, 2026</Eyebrow>
                <div style={{ fontFamily: T.serif, fontSize: 18, fontWeight: 500, color: T.ink, marginTop: 4 }}>Chọn ngày bay</div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button aria-label="Tháng trước" style={{ width: 30, height: 30, borderRadius: '50%', background: T.paper2, border: `1px solid ${T.line}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ic.back size={13} stroke={T.ink2} /></button>
                <button aria-label="Tháng sau" style={{ width: 30, height: 30, borderRadius: '50%', background: T.paper2, border: `1px solid ${T.line}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ic.fwd size={13} stroke={T.ink2} /></button>
              </div>
            </div>
            <PriceCalendar day={day} setDay={setDay} />
            <div style={{ display: 'flex', gap: 16, marginTop: 16, paddingTop: 14, borderTop: `1px solid ${T.line}` }}>
              {([['Thấp', T.green], ['Trung bình', T.amber], ['Cao', T.red]] as const).map(([l, c]) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
                  <span style={{ fontFamily: T.sans, fontSize: 11, color: T.ink3 }}>{l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
          <Btn onClick={() => { useSearchStore.getState().setSearch({ origin: from, destination: to, date: `2026-06-${String(day).padStart(2, '0')}`, paxAdt: 1, paxChd: 0, paxInf: 0 }); navigate('/results') }} size="lg" icon={<Ic.search size={18} stroke={T.paper} />}>Tìm chuyến bay</Btn>
        </div>
      </Container>
    </div>
  )
}
