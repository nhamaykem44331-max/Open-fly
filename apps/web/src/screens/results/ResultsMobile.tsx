// OpenFly — Results (mobile), ported from screens-results.jsx ResultsScreen.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { T, fmtVnd } from '../../theme/tokens'
import { Eyebrow, Chip, Price, AirlineBadge, Ic } from '../../components/ui'
import { AIRLINES } from '../../data/mock'
import type { Flight } from '../../data/mock'
import type { ResultsData } from '../../data/useResults'
import { useSelectedFlight } from '../../stores/selectedFlight'

function FlightCard({ f, onTap }: { f: Flight; onTap: () => void }) {
  const a = AIRLINES[f.airline]
  const sol = f.solPick
  return (
    <div onClick={onTap} style={{ background: T.paper, border: `1px solid ${sol ? T.ink : T.line}`, borderRadius: 6, cursor: 'pointer', overflow: 'hidden', transition: 'all 0.15s' }}>
      {sol && (
        <div style={{ background: T.ink, color: T.paper, padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 18, height: 18, borderRadius: '50%', background: T.rust, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.serif, fontSize: 10, color: T.paper, fontStyle: 'italic', fontWeight: 600 }}>S</span>
            <span style={{ fontFamily: T.sans, fontSize: 10, fontWeight: 500, letterSpacing: 1.5, textTransform: 'uppercase', color: T.paper }}>Sol đề xuất</span>
          </div>
          <span style={{ fontFamily: T.sans, fontSize: 10, fontWeight: 500, color: T.rustSoft, letterSpacing: 0.5 }}>Lựa chọn tốt nhất</span>
        </div>
      )}
      <div style={{ padding: '16px 18px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <AirlineBadge code={f.airline} size={28} color={a.color} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: T.sans, fontSize: 12, fontWeight: 500, color: T.ink2 }}>{a.short}</div>
            <div style={{ fontFamily: T.sans, fontSize: 10, color: T.ink3, marginTop: 1 }}>{f.number} · {f.aircraft}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <Price value={f.price} size={22} />
            <div style={{ fontFamily: T.sans, fontSize: 9, color: T.ink3, marginTop: 2, letterSpacing: 0.3 }}>/khách · đã bao gồm thuế</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0' }}>
          <div>
            <div style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 500, color: T.ink, letterSpacing: '-0.5px', lineHeight: 1 }}>{f.depart}</div>
            <div style={{ fontFamily: T.sans, fontSize: 11, color: T.ink3, marginTop: 4, letterSpacing: 0.5, fontWeight: 600 }}>{f.from}</div>
          </div>
          <div style={{ flex: 1, padding: '0 2px' }}>
            <div style={{ fontFamily: T.sans, fontSize: 10, color: T.ink3, textAlign: 'center', marginBottom: 4, letterSpacing: 0.3 }}>
              {f.duration} {f.stops === 0 ? '· Bay thẳng' : `· ${f.stops} điểm dừng`}
            </div>
            <div style={{ position: 'relative', height: 10, display: 'flex', alignItems: 'center' }}>
              <div style={{ flex: 1, height: 1, backgroundImage: `linear-gradient(to right, ${T.line2} 50%, transparent 50%)`, backgroundSize: '4px 1px' }} />
              <div style={{ margin: '0 4px' }}><Ic.plane2 size={12} stroke={T.rust} sw={1.6} /></div>
              <div style={{ flex: 1, height: 1, backgroundImage: `linear-gradient(to right, ${T.line2} 50%, transparent 50%)`, backgroundSize: '4px 1px' }} />
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 500, color: T.ink, letterSpacing: '-0.5px', lineHeight: 1 }}>{f.arrive}</div>
            <div style={{ fontFamily: T.sans, fontSize: 11, color: T.ink3, marginTop: 4, letterSpacing: 0.5, fontWeight: 600 }}>{f.to}</div>
          </div>
        </div>
        {(f.insight || sol) && (
          <div style={{ marginTop: 10, paddingTop: 12, borderTop: `1px solid ${T.line}`, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            {sol ? (
              <span style={{ fontFamily: T.serif, fontSize: 12, color: T.ink2, fontStyle: 'italic', lineHeight: 1.4, flex: 1 }}>{f.solReason}</span>
            ) : f.insight ? (
              <>
                <Ic.trend size={13} stroke={f.insight.tone === 'good' ? T.green : T.ink3} sw={1.6} />
                <span style={{ fontFamily: T.serif, fontSize: 12, color: T.ink2, fontStyle: 'italic', lineHeight: 1.4, flex: 1 }}>{f.insight.text}</span>
              </>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}

export function ResultsMobile({ data }: { data: ResultsData }) {
  const navigate = useNavigate()
  const select = useSelectedFlight((s) => s.select)
  const [filter, setFilter] = useState('sol')
  const { flights, route, dateLabel, pax, cabin } = data

  let list = [...flights]
  if (filter === 'cheap') list.sort((a, b) => a.price - b.price)
  else if (filter === 'fast') list.sort((a, b) => a.depart.localeCompare(b.depart))
  else if (filter === 'morning') list = list.filter((f) => parseInt(f.depart) < 12)
  else if (filter === 'evening') list = list.filter((f) => parseInt(f.depart) >= 18)
  const solIdx = list.findIndex((f) => f.solPick)
  if (solIdx > 0) { const [s] = list.splice(solIdx, 1); list.unshift(s) }
  const minPrice = Math.min(...flights.map((f) => f.price))

  return (
    <div style={{ background: T.paper, minHeight: '100%' }}>
      {/* Header */}
      <div style={{ padding: '12px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/')} aria-label="Quay lại" style={{ width: 36, height: 36, borderRadius: '50%', background: 'transparent', border: `1px solid ${T.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <Ic.back size={16} stroke={T.ink} />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontFamily: T.serif, fontSize: 18, fontWeight: 500, color: T.ink, letterSpacing: '-0.4px' }}>{route.from}</span>
              <Ic.arrow size={12} stroke={T.ink3} />
              <span style={{ fontFamily: T.serif, fontSize: 18, fontWeight: 500, color: T.ink, letterSpacing: '-0.4px' }}>{route.to}</span>
            </div>
            <div style={{ fontFamily: T.sans, fontSize: 11, color: T.ink3, marginTop: 2 }}>{dateLabel} · {pax} khách · {cabin}</div>
          </div>
          <button aria-label="Bộ lọc" style={{ width: 36, height: 36, borderRadius: '50%', background: 'transparent', border: `1px solid ${T.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <Ic.filter size={16} stroke={T.ink2} />
          </button>
        </div>
        <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 4, background: T.paper2, border: `1px solid ${T.line}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Ic.trend size={14} stroke={T.green} sw={1.6} />
          <div style={{ flex: 1, fontFamily: T.serif, fontSize: 12, color: T.ink2, lineHeight: 1.4, fontStyle: 'italic' }}>
            Tìm thấy <em style={{ color: T.ink, fontStyle: 'normal', fontWeight: 500 }}>{flights.length} chuyến</em> · giá từ <em style={{ color: T.rust, fontStyle: 'normal', fontWeight: 500 }}>{fmtVnd(minPrice)}đ</em>
          </div>
          <button onClick={() => navigate('/hunter')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: T.sans, fontSize: 10, fontWeight: 500, color: T.rust, letterSpacing: 1.2, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Ic.radar size={12} stroke={T.rust} sw={1.6} />Săn vé
          </button>
        </div>
      </div>

      {/* Filter chips */}
      <div className="of-scroll-x" style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '16px 20px 4px' }}>
        <Chip active={filter === 'sol'} onClick={() => setFilter('sol')} icon={<span style={{ width: 6, height: 6, borderRadius: '50%', background: filter === 'sol' ? T.rustSoft : T.rust }} />}>Sol đề xuất</Chip>
        <Chip active={filter === 'cheap'} onClick={() => setFilter('cheap')}>Giá thấp</Chip>
        <Chip active={filter === 'fast'} onClick={() => setFilter('fast')}>Bay sớm</Chip>
        <Chip active={filter === 'morning'} onClick={() => setFilter('morning')}>Sáng</Chip>
        <Chip active={filter === 'evening'} onClick={() => setFilter('evening')}>Đêm</Chip>
      </div>

      {/* Result list */}
      <div style={{ padding: '12px 20px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {list.map((f) => <FlightCard key={f.id} f={f} onTap={() => { select(f); navigate(`/detail/${f.id}`) }} />)}

        {/* Sol nudge */}
        <div style={{ marginTop: 8, padding: 16, borderRadius: 6, background: T.inkBlock, color: T.onInk, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: T.rust, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontFamily: T.serif, fontSize: 14, color: '#F5F1EA', fontStyle: 'italic', fontWeight: 600, marginTop: -1 }}>S</span>
          </div>
          <div style={{ flex: 1 }}>
            <Eyebrow dash={false} color={T.rustSoft} style={{ marginBottom: 4 }}>Sol nhắc nhẹ</Eyebrow>
            <div style={{ fontFamily: T.serif, fontSize: 13, color: T.onInk, lineHeight: 1.45, fontStyle: 'italic' }}>
              Chưa ưng giá nào? Để Sol săn vé HAN-DAD dưới <em style={{ color: T.rustSoft, fontStyle: 'normal', fontWeight: 500 }}>900.000đ</em> trong 2 tuần tới — sẽ báo bạn ngay khi có.
            </div>
            <button onClick={() => navigate('/hunter')} style={{ marginTop: 10, padding: '8px 14px', borderRadius: 4, background: T.rust, color: '#F5F1EA', border: 'none', fontFamily: T.serif, fontSize: 12, fontWeight: 500, letterSpacing: '-0.1px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Ic.radar size={12} stroke="#F5F1EA" sw={1.6} /> Tạo Fare Hunt
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
