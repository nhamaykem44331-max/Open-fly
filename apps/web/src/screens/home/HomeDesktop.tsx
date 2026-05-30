// OpenFly — Home dashboard (desktop), ported from desktop-home.jsx HomePage.
import { useNavigate } from 'react-router-dom'
import { T } from '../../theme/tokens'
import { Eyebrow, Ic, Price, Card, Sparkline } from '../../components/ui'
import { Container } from '../../shell/Container'
import { AIRPORTS } from '../../data/mock'
import type { Hunt } from '../../data/mock'
import type { HomeData } from '../../data/useHomeData'

// Horizontal hero search bar.
function SearchBar({ onSearch }: { onSearch: () => void }) {
  const Field = ({ label, value, sub, flex = 1, align = 'left' }: { label: string; value: string; sub?: string; flex?: number; align?: 'left' | 'right' }) => (
    <div style={{ flex, padding: '14px 22px', textAlign: align, minWidth: 0 }}>
      <div style={{ fontFamily: T.sans, fontSize: 10.5, fontWeight: 600, letterSpacing: 1.6, textTransform: 'uppercase', color: T.ink3 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6, justifyContent: align === 'right' ? 'flex-end' : 'flex-start' }}>
        <span style={{ fontFamily: T.serif, fontSize: 24, fontWeight: 500, letterSpacing: '-0.6px', color: T.ink }}>{value}</span>
        {sub && <span style={{ fontFamily: T.sans, fontSize: 13, color: T.ink3 }}>{sub}</span>}
      </div>
    </div>
  )
  return (
    <div style={{ background: T.paper, border: `1px solid ${T.line2}`, borderRadius: 12, padding: 6, display: 'flex', alignItems: 'stretch', boxShadow: '0 18px 50px -34px rgba(26,26,25,0.4)' }}>
      <div style={{ display: 'flex', alignItems: 'center', flex: 1, position: 'relative' }}>
        <Field label="Từ" value="HAN" sub="Hà Nội" />
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: T.paper, border: `1px solid ${T.line2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1 }}>
          <Ic.swap size={15} stroke={T.ink2} />
        </div>
        <Field label="Đến" value="DAD" sub="Đà Nẵng" align="right" />
      </div>
      <div style={{ width: 1, background: T.line, margin: '10px 0' }} />
      <Field label="Ngày đi" value="CN, 15 thg 6" flex={1.1} />
      <div style={{ width: 1, background: T.line, margin: '10px 0' }} />
      <Field label="Hành khách" value="1" sub="· Phổ thông" flex={1} />
      <button onClick={onSearch} style={{ margin: 4, padding: '0 30px', background: T.ink, color: T.paper, border: 'none', borderRadius: 8, fontFamily: T.serif, fontSize: 16, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <Ic.search size={18} stroke={T.paper} /> Tìm
      </button>
    </div>
  )
}

function HuntCardSm({ hunt, onOpen }: { hunt: Hunt; onOpen: () => void }) {
  const a1 = AIRPORTS[hunt.from]
  const a2 = AIRPORTS[hunt.to]
  const found = hunt.status === 'found'
  return (
    <Card hover onClick={onOpen} style={{ padding: 20, borderRadius: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: found ? T.green : T.amber, animation: found ? 'none' : 'pulse 2s ease-in-out infinite' }} />
        <span style={{ fontFamily: T.sans, fontSize: 10.5, fontWeight: 600, letterSpacing: 1.6, textTransform: 'uppercase', color: found ? T.green : T.ink3, flex: 1 }}>{found ? 'Đã tìm thấy' : 'Đang săn'}</span>
        <span style={{ fontFamily: T.sans, fontSize: 11, color: T.ink3 }}>quét mỗi {hunt.frequency}g</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 9 }}>
        <span style={{ fontFamily: T.serif, fontSize: 28, fontWeight: 500, color: T.ink, letterSpacing: '-0.8px' }}>{hunt.from}</span>
        <Ic.arrow size={15} stroke={T.ink3} />
        <span style={{ fontFamily: T.serif, fontSize: 28, fontWeight: 500, color: T.ink, letterSpacing: '-0.8px' }}>{hunt.to}</span>
      </div>
      <div style={{ fontFamily: T.sans, fontSize: 12, color: T.ink3, marginTop: 4 }}>{a1.city} → {a2.city} · {hunt.windowShort}</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 16, paddingTop: 16, borderTop: `1px solid ${T.line}` }}>
        <div>
          <div style={{ fontFamily: T.sans, fontSize: 10, fontWeight: 500, letterSpacing: 1.4, textTransform: 'uppercase', color: T.ink3 }}>{found ? 'Giá tốt nhất' : 'Hiện tại'}</div>
          <div style={{ marginTop: 5 }}><Price value={hunt.best} size={26} /></div>
        </div>
        <Sparkline data={hunt.trend30.slice(-12)} w={96} h={34} color={found ? T.green : T.rust} />
      </div>
    </Card>
  )
}

export function HomeDesktop({ data }: { data: HomeData }) {
  const navigate = useNavigate()
  const { greeting, activeHunts, hunts, destinations, vouchers, todayTask } = data
  const homeHunts = activeHunts
    .map((h) => hunts.find((x) => x.id === h.id))
    .filter((h): h is Hunt => Boolean(h))

  return (
    <div style={{ background: T.canvas, minHeight: '100%', paddingBottom: 70 }}>
      {/* Hero */}
      <Container max={1320} style={{ paddingTop: 52 }}>
        <Eyebrow>{greeting}</Eyebrow>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 30, margin: '16px 0 28px' }}>
          <h1 style={{ fontFamily: T.serif, fontSize: 54, fontWeight: 300, letterSpacing: '-2.2px', lineHeight: 1.04, color: T.ink, margin: 0 }}>
            Bay đến đâu <em style={{ color: T.rust, fontWeight: 500 }}>hôm nay</em>?
          </h1>
          <p style={{ fontFamily: T.serif, fontSize: 16, color: T.ink3, fontStyle: 'italic', lineHeight: 1.5, margin: 0, maxWidth: 300, textAlign: 'right' }}>
            Sol đang theo dõi {activeHunts.length} chặng và giữ 1 việc cần bạn hoàn tất hôm nay.
          </p>
        </div>
        <SearchBar onSearch={() => navigate('/search')} />
      </Container>

      {/* Body grid */}
      <Container max={1320} style={{ paddingTop: 44 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 40, alignItems: 'start' }}>
          {/* MAIN */}
          <div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18 }}>
              <div>
                <Eyebrow>Săn vé tự động</Eyebrow>
                <div style={{ fontFamily: T.serif, fontSize: 26, fontWeight: 500, color: T.ink, letterSpacing: '-0.8px', marginTop: 8 }}>
                  Sol đang săn <em style={{ color: T.rust, fontWeight: 500 }}>{activeHunts.length} chặng</em> cho bạn
                </div>
              </div>
              <span onClick={() => navigate('/hunter')} style={{ fontFamily: T.sans, fontSize: 13, fontWeight: 500, color: T.ink2, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>Xem tất cả <Ic.chevron size={13} stroke={T.ink2} /></span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {homeHunts.map((h) => <HuntCardSm key={h.id} hunt={h} onOpen={() => navigate('/hunter')} />)}
            </div>
            <button onClick={() => navigate('/hunter')} style={{ width: '100%', marginTop: 16, padding: '18px', borderRadius: 10, cursor: 'pointer', background: 'transparent', border: `1px dashed ${T.line2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <span style={{ width: 30, height: 30, borderRadius: '50%', background: T.paper2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ic.plus size={16} stroke={T.rust} /></span>
              <span style={{ fontFamily: T.serif, fontSize: 15, color: T.ink2, fontStyle: 'italic' }}>Tạo Fare Hunt mới — cho Sol biết bạn muốn bay đâu</span>
            </button>

            {/* Destinations */}
            <div style={{ marginTop: 44, marginBottom: 18 }}>
              <Eyebrow>Có thể bạn đang nghĩ tới</Eyebrow>
              <div style={{ fontFamily: T.serif, fontSize: 26, fontWeight: 500, color: T.ink, letterSpacing: '-0.8px', marginTop: 8 }}>Điểm đến gợi ý</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {destinations.map((d) => (
                <Card key={d.code} hover onClick={() => navigate('/search')} style={{ overflow: 'hidden', borderRadius: 8, padding: 0 }}>
                  <div style={{ height: 120, background: T.paper2, position: 'relative', borderBottom: `1px solid ${T.line}`, display: 'flex', alignItems: 'flex-end', padding: 16 }}>
                    <div style={{ position: 'absolute', right: -22, top: -18, width: 110, height: 110, borderRadius: '50%', background: d.hue, opacity: 0.16 }} />
                    <div style={{ fontFamily: T.serif, fontSize: 32, fontWeight: 500, letterSpacing: '-1px', color: T.ink, lineHeight: 1 }}>{d.code}</div>
                  </div>
                  <div style={{ padding: 16 }}>
                    <div style={{ fontFamily: T.serif, fontSize: 16, fontWeight: 500, color: T.ink }}>{d.city}</div>
                    <div style={{ fontFamily: T.serif, fontSize: 12.5, color: T.ink3, fontStyle: 'italic', marginTop: 4, lineHeight: 1.35, minHeight: 34 }}>{d.reason}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginTop: 8 }}><span style={{ fontFamily: T.sans, fontSize: 11, color: T.ink3 }}>Từ</span><Price value={d.priceFrom} size={18} /></div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* RIGHT RAIL */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {todayTask && (
              <div onClick={() => navigate('/trips')} style={{ background: T.paper, border: `1px solid ${T.line2}`, borderRadius: 10, padding: '18px 20px', cursor: 'pointer', display: 'flex', gap: 14 }}>
                <div style={{ width: 5, alignSelf: 'stretch', borderRadius: 100, background: T.amber, animation: 'pulse 2s ease-in-out infinite' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: T.sans, fontSize: 10, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', color: T.amber }}>Hôm nay · 1 việc cần làm</div>
                  <div style={{ fontFamily: T.serif, fontSize: 16, fontWeight: 500, color: T.ink, marginTop: 6, lineHeight: 1.3 }}>Booking <em style={{ color: T.rust, fontStyle: 'normal' }}>{todayTask.code}</em> còn {todayTask.remain} để hoàn tất</div>
                  <div style={{ fontFamily: T.serif, fontSize: 13, color: T.ink3, fontStyle: 'italic', marginTop: 3 }}>{todayTask.route} · {todayTask.date} · {todayTask.pax} khách</div>
                </div>
              </div>
            )}

            {/* Sol quick ask */}
            <div style={{ background: T.inkBlock, color: T.onInk, borderRadius: 10, padding: 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <span style={{ width: 32, height: 32, borderRadius: '50%', background: T.rust, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.serif, fontSize: 16, color: '#F5F1EA', fontStyle: 'italic', fontWeight: 600 }}>S</span>
                <div>
                  <div style={{ fontFamily: T.sans, fontSize: 10, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(245,241,234,0.55)' }}>Sol · trợ lý</div>
                  <div style={{ fontFamily: T.sans, fontSize: 11, color: T.green, fontWeight: 500 }}>● đang trực tuyến</div>
                </div>
              </div>
              <div style={{ fontFamily: T.serif, fontSize: 17, fontStyle: 'italic', lineHeight: 1.45, color: 'rgba(245,241,234,0.92)' }}>"Tuần sau bay HAN-DAD dưới 1 triệu — có không Sol?"</div>
              <button onClick={() => navigate('/sol')} style={{ width: '100%', marginTop: 16, padding: '12px', borderRadius: 6, background: 'rgba(245,241,234,0.08)', border: '1px solid rgba(245,241,234,0.2)', color: T.onInk, fontFamily: T.serif, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Ic.chat size={15} stroke={T.onInk} /> Nhắn cho Sol
              </button>
            </div>

            {/* Vouchers */}
            <div>
              <Eyebrow style={{ marginBottom: 12 }}>Mã ưu đãi của bạn</Eyebrow>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {vouchers.map((v) => (
                  <div key={v.code} onClick={() => navigate('/deals')} style={{ background: T.paper, border: `1px solid ${T.line}`, borderRadius: 10, padding: '16px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: T.rustTint, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Ic.gift size={18} stroke={T.rust} /></div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: T.serif, fontSize: 14.5, fontWeight: 500, color: T.ink, lineHeight: 1.3 }}>{v.title}</div>
                      <div style={{ fontFamily: T.mono, fontSize: 11, color: T.rust, letterSpacing: 0.5, marginTop: 4 }}>{v.code} · HSD {v.expires}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
}
