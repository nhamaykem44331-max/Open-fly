// OpenFly — Results (desktop), ported from desktop-search.jsx ResultsPage.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { T, fmtVnd } from '../../theme/tokens'
import { Eyebrow, Btn, Price, AirlineBadge, Card, Ic } from '../../components/ui'
import { Container } from '../../shell/Container'
import { AIRLINES, AIRPORTS } from '../../data/mock'
import type { Flight } from '../../data/mock'
import type { ResultsData } from '../../data/useResults'

function FlightCardD({ f, onOpen }: { f: Flight; onOpen: () => void }) {
  const a = AIRLINES[f.airline]
  const sol = f.solPick
  return (
    <Card hover featured={sol} onClick={onOpen} style={{ overflow: 'hidden', borderRadius: 8, padding: 0 }}>
      {sol && (
        // Ribbon uses ink/paper (both flip) so it stays readable in dark — not onInk (which would be cream-on-cream).
        <div style={{ background: T.ink, color: T.paper, padding: '9px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <span style={{ width: 18, height: 18, borderRadius: '50%', background: T.rust, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.serif, fontSize: 10, color: '#F5F1EA', fontStyle: 'italic', fontWeight: 600 }}>S</span>
            <span style={{ fontFamily: T.sans, fontSize: 10.5, fontWeight: 600, letterSpacing: 1.6, textTransform: 'uppercase', color: T.paper }}>Sol đề xuất</span>
          </div>
          <span style={{ fontFamily: T.sans, fontSize: 11, fontWeight: 500, color: T.rustSoft }}>Lựa chọn tốt nhất</span>
        </div>
      )}
      <div style={{ padding: '22px 26px', display: 'flex', alignItems: 'center', gap: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, width: 200, flexShrink: 0 }}>
          <AirlineBadge code={f.airline} size={40} color={T.ink2} />
          <div>
            <div style={{ fontFamily: T.sans, fontSize: 13, fontWeight: 500, color: T.ink2 }}>{a.short}</div>
            <div style={{ fontFamily: T.sans, fontSize: 11, color: T.ink3, marginTop: 2 }}>{f.number} · {f.aircraft}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, flex: 1 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: T.serif, fontSize: 26, fontWeight: 500, color: T.ink, letterSpacing: '-0.6px', lineHeight: 1 }}>{f.depart}</div>
            <div style={{ fontFamily: T.sans, fontSize: 12, fontWeight: 600, color: T.ink3, marginTop: 5, letterSpacing: 0.5 }}>{f.from}</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: T.sans, fontSize: 11, color: T.ink3, textAlign: 'center', marginBottom: 5 }}>{f.duration} · Bay thẳng</div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ flex: 1, height: 1, background: T.line2 }} />
              <Ic.plane2 size={14} stroke={T.rust} sw={1.6} />
              <div style={{ flex: 1, height: 1, background: T.line2 }} />
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: T.serif, fontSize: 26, fontWeight: 500, color: T.ink, letterSpacing: '-0.6px', lineHeight: 1 }}>{f.arrive}</div>
            <div style={{ fontFamily: T.sans, fontSize: 12, fontWeight: 600, color: T.ink3, marginTop: 5, letterSpacing: 0.5 }}>{f.to}</div>
          </div>
        </div>
        <div style={{ width: 180, flexShrink: 0, textAlign: 'right', borderLeft: `1px solid ${T.line}`, paddingLeft: 24 }}>
          <Price value={f.price} size={28} />
          <div style={{ fontFamily: T.sans, fontSize: 11, color: T.ink3, marginTop: 3 }}>/khách · gồm thuế</div>
          <Btn onClick={onOpen} size="sm" variant={sol ? 'primary' : 'secondary'} style={{ marginTop: 10 }}>Chọn vé</Btn>
        </div>
      </div>
      {(f.insight || sol) && (
        <div style={{ padding: '0 26px 18px', marginTop: -4 }}>
          <div style={{ paddingTop: 14, borderTop: `1px solid ${T.line}`, display: 'flex', alignItems: 'center', gap: 9 }}>
            {!sol && f.insight && <Ic.trend size={14} stroke={f.insight.tone === 'good' ? T.green : T.ink3} sw={1.6} />}
            <span style={{ fontFamily: T.serif, fontSize: 13.5, color: T.ink2, fontStyle: 'italic', lineHeight: 1.4 }}>{sol ? f.solReason : f.insight?.text}</span>
          </div>
        </div>
      )}
    </Card>
  )
}

const FILTERS: [string, string][] = [['sol', 'Sol đề xuất'], ['cheap', 'Giá thấp nhất'], ['morning', 'Bay buổi sáng'], ['evening', 'Bay buổi tối'], ['all', 'Tất cả chuyến']]
const SORTS: [string, string][] = [['price', 'Giá thấp → cao'], ['depart', 'Giờ khởi hành']]

export function ResultsDesktop({ data }: { data: ResultsData }) {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('sol')
  const [sort, setSort] = useState('price')
  const { flights, route, dateLabel, pax, cabin } = data

  let list = [...flights]
  if (filter === 'cheap') list.sort((a, b) => a.price - b.price)
  else if (filter === 'morning') list = list.filter((f) => parseInt(f.depart) < 12)
  else if (filter === 'evening') list = list.filter((f) => parseInt(f.depart) >= 18)
  if (sort === 'price') list.sort((a, b) => a.price - b.price)
  else if (sort === 'depart') list.sort((a, b) => a.depart.localeCompare(b.depart))
  const solIdx = list.findIndex((f) => f.solPick)
  if (filter === 'sol' && solIdx > 0) { const [s] = list.splice(solIdx, 1); list.unshift(s) }
  const minPrice = Math.min(...flights.map((f) => f.price))

  return (
    <div style={{ background: T.canvas, minHeight: '100%', paddingBottom: 80 }}>
      <Container max={1240} style={{ paddingTop: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <button onClick={() => navigate('/search')} aria-label="Quay lại" style={{ width: 42, height: 42, borderRadius: '50%', background: 'transparent', border: `1px solid ${T.line2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Ic.back size={17} stroke={T.ink} /></button>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span style={{ fontFamily: T.serif, fontSize: 30, fontWeight: 500, color: T.ink, letterSpacing: '-1px' }}>{AIRPORTS[route.from].city}</span>
              <Ic.arrow size={18} stroke={T.ink3} />
              <span style={{ fontFamily: T.serif, fontSize: 30, fontWeight: 500, color: T.ink, letterSpacing: '-1px' }}>{AIRPORTS[route.to].city}</span>
            </div>
            <div style={{ fontFamily: T.sans, fontSize: 13, color: T.ink3, marginTop: 4 }}>{dateLabel} · {pax} khách · {cabin} · <em style={{ color: T.ink2, fontStyle: 'normal', fontWeight: 500 }}>{flights.length} chuyến</em> · giá từ <em style={{ color: T.rust, fontStyle: 'normal', fontWeight: 500 }}>{fmtVnd(minPrice)}đ</em></div>
          </div>
          <Btn onClick={() => navigate('/hunter')} variant="ghost" size="sm" icon={<Ic.radar size={15} stroke={T.ink2} />}>Săn vé chặng này</Btn>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '256px 1fr', gap: 28, alignItems: 'start' }}>
          {/* filter sidebar */}
          <div style={{ position: 'sticky', top: 86 }}>
            <div style={{ background: T.paper, border: `1px solid ${T.line}`, borderRadius: 10, padding: 22 }}>
              <Eyebrow dash={false} style={{ marginBottom: 14 }}>Lọc nhanh</Eyebrow>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {FILTERS.map(([id, l]) => (
                  <button key={id} onClick={() => setFilter(id)} style={{ textAlign: 'left', padding: '10px 14px', borderRadius: 7, cursor: 'pointer', background: filter === id ? T.ink : 'transparent', border: `1px solid ${filter === id ? T.ink : T.line}`, color: filter === id ? T.paper : T.ink2, fontFamily: T.sans, fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {id === 'sol' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: filter === id ? T.rustSoft : T.rust }} />}{l}
                  </button>
                ))}
              </div>
              <div style={{ height: 1, background: T.line, margin: '20px 0' }} />
              <Eyebrow dash={false} style={{ marginBottom: 12 }}>Sắp xếp</Eyebrow>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {SORTS.map(([id, l]) => (
                  <button key={id} onClick={() => setSort(id)} style={{ textAlign: 'left', padding: '9px 14px', borderRadius: 7, cursor: 'pointer', background: 'transparent', border: `1px solid ${sort === id ? T.ink2 : T.line}`, color: sort === id ? T.ink : T.ink3, fontFamily: T.sans, fontSize: 13, fontWeight: 500 }}>{l}</button>
                ))}
              </div>
            </div>
            <div style={{ marginTop: 16, background: T.inkBlock, color: T.onInk, borderRadius: 10, padding: 20 }}>
              <Eyebrow dash={false} color={T.rustSoft} style={{ marginBottom: 8 }}>Sol nhắc nhẹ</Eyebrow>
              <div style={{ fontFamily: T.serif, fontSize: 14, lineHeight: 1.5, fontStyle: 'italic', color: 'rgba(245,241,234,0.9)' }}>Chưa ưng giá nào? Để Sol săn HAN-DAD dưới <em style={{ color: T.rustSoft, fontStyle: 'normal' }}>900.000đ</em> — báo bạn ngay khi có.</div>
              <Btn onClick={() => navigate('/hunter')} variant="rust" size="sm" full style={{ marginTop: 14 }} icon={<Ic.radar size={14} stroke="#F5F1EA" />}>Tạo Fare Hunt</Btn>
            </div>
          </div>

          {/* results */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {list.map((f) => <FlightCardD key={f.id} f={f} onOpen={() => navigate(`/detail/${f.id}`)} />)}
          </div>
        </div>
      </Container>
    </div>
  )
}
