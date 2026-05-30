// OpenFly — Home (mobile), ported from screens-home.jsx HomeScreen.
import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { T } from '../../theme/tokens'
import { Wordmark, Eyebrow, Ic, Price, Card, Sparkline } from '../../components/ui'
import { AIRPORTS } from '../../data/mock'
import type { ActiveHunt, Destination, Voucher } from '../../data/mock'
import type { HomeData } from '../../data/useHomeData'

// ─── Hero arc (monoline route visualization) ─────────────────
function HeroArc() {
  return (
    <div style={{ position: 'relative', height: 140, margin: '8px -4px 0', borderRadius: 4, overflow: 'hidden' }}>
      <svg viewBox="0 0 380 140" width="100%" height="140" style={{ display: 'block' }}>
        <g stroke={T.line2} strokeWidth="0.6" fill="none" strokeDasharray="2 4">
          <ellipse cx="190" cy="170" rx="220" ry="60" />
          <ellipse cx="190" cy="160" rx="200" ry="40" />
          <ellipse cx="190" cy="155" rx="180" ry="25" />
        </g>
        <path d="M 50 100 Q 190 10 330 100" stroke={T.ink2} strokeWidth="1.2" fill="none" strokeLinecap="round" />
        <circle cx="50" cy="100" r="3" fill={T.ink} />
        <text x="50" y="120" textAnchor="middle" style={{ fontFamily: T.sans, fontSize: 9, fontWeight: 600, letterSpacing: '1.5px', fill: T.ink3 }}>HAN</text>
        <circle cx="330" cy="100" r="3" fill={T.ink} />
        <text x="330" y="120" textAnchor="middle" style={{ fontFamily: T.sans, fontSize: 9, fontWeight: 600, letterSpacing: '1.5px', fill: T.ink3 }}>DAD</text>
        <g transform="translate(220 35) rotate(35)">
          <path d="M-5 0 L5 0 M3 -2 L5 0 L3 2" stroke={T.rust} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <circle r="2.5" fill={T.rust} />
        </g>
        <circle cx="160" cy="55" r="1.5" fill={T.ink4} />
        <circle cx="260" cy="50" r="1.5" fill={T.ink4} />
      </svg>
    </div>
  )
}

function SolQuickInput({ onTap }: { onTap: () => void }) {
  return (
    <button onClick={onTap} style={{ width: '100%', textAlign: 'left', background: T.paper2, border: `1px solid ${T.line}`, borderRadius: 6, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', transition: 'all 0.15s' }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', background: T.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ fontFamily: T.serif, fontSize: 14, color: T.rustSoft, fontStyle: 'italic', fontWeight: 500, marginTop: -1 }}>S</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: T.sans, fontSize: 10, fontWeight: 500, letterSpacing: 1.5, textTransform: 'uppercase', color: T.ink3 }}>Sol · trợ lý du lịch</div>
        <div style={{ fontFamily: T.serif, fontSize: 14, color: T.ink2, fontStyle: 'italic', marginTop: 2, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>"Tuần sau bay HAN-DAD dưới 1 triệu..."</div>
      </div>
      <Ic.arrow size={16} stroke={T.ink3} />
    </button>
  )
}

function QuickSearchForm({ onSubmit }: { onSubmit: () => void }) {
  return (
    <div style={{ background: T.paper, border: `1px solid ${T.line}`, borderRadius: 6, padding: 4 }}>
      <div style={{ display: 'flex', alignItems: 'stretch', position: 'relative' }}>
        <div style={{ flex: 1, padding: '14px 16px' }}>
          <div style={{ fontFamily: T.sans, fontSize: 10, fontWeight: 500, letterSpacing: 1.5, textTransform: 'uppercase', color: T.ink3 }}>Từ</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
            <span style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 500, letterSpacing: '-0.5px', color: T.ink }}>HAN</span>
            <span style={{ fontFamily: T.sans, fontSize: 12, color: T.ink3 }}>Hà Nội</span>
          </div>
        </div>
        <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: 32, height: 32, borderRadius: '50%', background: T.paper, border: `1px solid ${T.line2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
          <Ic.swap size={14} stroke={T.ink2} />
        </div>
        <div style={{ width: 1, background: T.line, margin: '8px 0' }} />
        <div style={{ flex: 1, padding: '14px 16px', textAlign: 'right' }}>
          <div style={{ fontFamily: T.sans, fontSize: 10, fontWeight: 500, letterSpacing: 1.5, textTransform: 'uppercase', color: T.ink3 }}>Đến</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4, justifyContent: 'flex-end' }}>
            <span style={{ fontFamily: T.sans, fontSize: 12, color: T.ink3 }}>Đà Nẵng</span>
            <span style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 500, letterSpacing: '-0.5px', color: T.ink }}>DAD</span>
          </div>
        </div>
      </div>
      <div style={{ height: 1, background: T.line, margin: '0 12px' }} />
      <div style={{ display: 'flex' }}>
        <div style={{ flex: 1, padding: '14px 16px' }}>
          <div style={{ fontFamily: T.sans, fontSize: 10, fontWeight: 500, letterSpacing: 1.5, textTransform: 'uppercase', color: T.ink3 }}>Ngày đi</div>
          <div style={{ fontFamily: T.serif, fontSize: 15, color: T.ink, marginTop: 4 }}>CN, 15 thg 6</div>
        </div>
        <div style={{ width: 1, background: T.line, margin: '8px 0' }} />
        <div style={{ flex: 1, padding: '14px 16px', textAlign: 'right' }}>
          <div style={{ fontFamily: T.sans, fontSize: 10, fontWeight: 500, letterSpacing: 1.5, textTransform: 'uppercase', color: T.ink3 }}>Hành khách</div>
          <div style={{ fontFamily: T.serif, fontSize: 15, color: T.ink, marginTop: 4 }}>1 · Phổ thông</div>
        </div>
      </div>
      <button onClick={onSubmit} style={{ width: '100%', margin: '4px 0 0', padding: '16px', background: T.ink, color: T.paper, border: 'none', borderRadius: 4, fontFamily: T.serif, fontSize: 15, fontWeight: 500, letterSpacing: '-0.2px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <Ic.search size={16} stroke={T.paper} />
        Tìm chuyến bay
      </button>
    </div>
  )
}

function HuntCardCompact({ hunt, onTap }: { hunt: ActiveHunt; onTap: () => void }) {
  const a1 = AIRPORTS[hunt.from]
  const a2 = AIRPORTS[hunt.to]
  const found = hunt.status === 'found'
  return (
    <Card onClick={onTap} style={{ minWidth: 246, padding: 16, marginRight: 12, flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: found ? T.green : T.amber, boxShadow: found ? 'none' : `0 0 0 4px ${T.amber}22`, animation: found ? 'none' : 'pulse 2s ease-in-out infinite' }} />
        <div style={{ fontFamily: T.sans, fontSize: 10, fontWeight: 500, letterSpacing: 1.5, textTransform: 'uppercase', color: found ? T.green : T.ink3 }}>{found ? 'Đã tìm thấy' : 'Đang săn'}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontFamily: T.serif, fontSize: 20, fontWeight: 500, color: T.ink, letterSpacing: '-0.5px' }}>{hunt.from}</span>
        <Ic.arrow size={12} stroke={T.ink3} />
        <span style={{ fontFamily: T.serif, fontSize: 20, fontWeight: 500, color: T.ink, letterSpacing: '-0.5px' }}>{hunt.to}</span>
      </div>
      <div style={{ fontFamily: T.sans, fontSize: 11, color: T.ink3, marginTop: 2 }}>{a1.city} → {a2.city} · {hunt.window}</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 14, paddingTop: 12, borderTop: `1px solid ${T.line}` }}>
        <div>
          <div style={{ fontFamily: T.sans, fontSize: 10, color: T.ink3, letterSpacing: 1, textTransform: 'uppercase' }}>Hiện tại</div>
          <Price value={hunt.current} size={22} />
        </div>
        <Sparkline data={hunt.trend} w={64} h={22} color={found ? T.green : T.rust} />
      </div>
      {found && (
        <div style={{ marginTop: 12, padding: '8px 10px', borderRadius: 4, background: T.paper2, fontFamily: T.serif, fontSize: 12, color: T.ink2 }}>
          <em style={{ color: T.green, fontStyle: 'normal', fontWeight: 500 }}>↓ 110.000đ</em> dưới mục tiêu · <em style={{ color: T.rust }}>{hunt.foundDate}</em>
        </div>
      )}
    </Card>
  )
}

function DestCard({ dest }: { dest: Destination }) {
  return (
    <Card style={{ minWidth: 168, padding: 0, marginRight: 12, flexShrink: 0, overflow: 'hidden' }}>
      <div style={{ height: 96, background: T.paper2, position: 'relative', borderBottom: `1px solid ${T.line}`, display: 'flex', alignItems: 'flex-end', padding: 14 }}>
        <div style={{ position: 'absolute', right: -20, top: -16, width: 90, height: 90, borderRadius: '50%', background: dest.hue, opacity: 0.18 }} />
        <div style={{ position: 'absolute', right: 12, top: 10 }}><Ic.pin size={14} stroke={T.ink3} /></div>
        <div style={{ fontFamily: T.serif, fontSize: 26, fontWeight: 500, letterSpacing: '-1px', color: T.ink, lineHeight: 1 }}>{dest.code}</div>
      </div>
      <div style={{ padding: 14 }}>
        <div style={{ fontFamily: T.serif, fontSize: 15, color: T.ink, fontWeight: 500 }}>{dest.city}</div>
        <div style={{ fontFamily: T.serif, fontSize: 12, color: T.ink3, fontStyle: 'italic', marginTop: 4, lineHeight: 1.35, minHeight: 32 }}>{dest.reason}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 8 }}>
          <span style={{ fontFamily: T.sans, fontSize: 10, color: T.ink3 }}>Từ</span>
          <Price value={dest.priceFrom} size={16} />
        </div>
      </div>
    </Card>
  )
}

function VoucherCard({ v }: { v: Voucher }) {
  return (
    <div style={{ minWidth: 240, marginRight: 12, flexShrink: 0, background: T.inkBlock, color: T.onInk, borderRadius: 6, padding: 16, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: -30, top: -30, width: 90, height: 90, borderRadius: '50%', border: `1px solid ${T.rust}`, opacity: 0.4 }} />
      <Eyebrow color={T.rustSoft} dash={false} style={{ marginBottom: 8 }}>Mã ưu đãi</Eyebrow>
      <div style={{ fontFamily: T.serif, fontSize: 17, fontWeight: 500, lineHeight: 1.25, color: T.onInk, marginBottom: 10 }}>{v.title}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px dashed rgba(245,241,234,0.2)' }}>
        <div style={{ fontFamily: T.mono, fontSize: 11, color: T.rustSoft, letterSpacing: 1, fontWeight: 500 }}>{v.code}</div>
        <div style={{ fontFamily: T.sans, fontSize: 10, color: 'rgba(245,241,234,0.5)' }}>HSD {v.expires}</div>
      </div>
    </div>
  )
}

const SCROLL: CSSProperties = { display: 'flex', overflowX: 'auto', padding: '0 20px' }

export function HomeMobile({ data }: { data: HomeData }) {
  const navigate = useNavigate()
  const { greeting, activeHunts, destinations, vouchers, todayTask } = data

  return (
    <div style={{ background: T.paper, minHeight: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px 0' }}>
        <Wordmark size={20} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => navigate('/inbox')} aria-label="Thông báo" style={{ width: 36, height: 36, borderRadius: '50%', background: 'transparent', border: `1px solid ${T.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', cursor: 'pointer' }}>
            <Ic.bell size={16} stroke={T.ink2} />
            <span style={{ position: 'absolute', top: -2, right: -2, minWidth: 16, height: 16, padding: '0 4px', borderRadius: 100, background: T.rust, color: T.paper, fontFamily: T.sans, fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${T.paper}`, lineHeight: 1 }}>2</span>
          </button>
          <button onClick={() => navigate('/profile')} aria-label="Tài khoản" style={{ width: 36, height: 36, borderRadius: '50%', background: T.paper2, border: `1px solid ${T.line}`, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.serif, fontSize: 14, color: T.ink2, fontWeight: 500, fontStyle: 'italic', cursor: 'pointer' }}>An</button>
        </div>
      </div>

      {/* Hero greeting */}
      <div style={{ padding: '28px 24px 0' }}>
        <Eyebrow>{greeting}</Eyebrow>
        <h1 style={{ fontFamily: T.serif, fontSize: 34, fontWeight: 400, letterSpacing: '-1.3px', lineHeight: 1.1, color: T.ink, margin: '14px 0 0' }}>
          Bay đến đâu <em style={{ color: T.rust, fontWeight: 500 }}>hôm nay</em>?
        </h1>
        <HeroArc />
      </div>

      {/* Today task */}
      {todayTask && (
        <div style={{ padding: '4px 20px 0' }}>
          <button onClick={() => navigate('/trips')} style={{ width: '100%', textAlign: 'left', background: T.paper, border: `1px solid ${T.line2}`, borderRadius: 6, padding: '12px 14px 12px 12px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
            <div style={{ width: 6, alignSelf: 'stretch', borderRadius: 100, background: T.amber, animation: 'pulse 2s ease-in-out infinite' }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: T.sans, fontSize: 9.5, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', color: T.amber }}>Hôm nay · 1 việc cần làm</div>
              <div style={{ fontFamily: T.serif, fontSize: 14, color: T.ink, marginTop: 4, fontWeight: 500, letterSpacing: '-0.2px', lineHeight: 1.3 }}>
                Booking <em style={{ color: T.rust, fontStyle: 'normal', fontWeight: 500 }}>{todayTask.code}</em> còn {todayTask.remain} để hoàn tất
              </div>
              <div style={{ fontFamily: T.serif, fontSize: 12, color: T.ink3, fontStyle: 'italic', marginTop: 2 }}>{todayTask.route} · {todayTask.date} · {todayTask.pax} khách</div>
            </div>
            <Ic.chevron size={14} stroke={T.ink3} />
          </button>
        </div>
      )}

      {/* Sol */}
      <div style={{ padding: '4px 20px 0' }}>
        <SolQuickInput onTap={() => navigate('/sol')} />
      </div>

      {/* Search form */}
      <div style={{ padding: '16px 20px 0' }}>
        <QuickSearchForm onSubmit={() => navigate('/search')} />
      </div>

      {/* Fare hunts */}
      <div style={{ padding: '28px 0 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px 12px' }}>
          <div>
            <Eyebrow>Săn vé tự động</Eyebrow>
            <div style={{ fontFamily: T.serif, fontSize: 18, fontWeight: 500, color: T.ink, marginTop: 6, letterSpacing: '-0.4px' }}>
              Sol đang săn <em style={{ color: T.rust, fontWeight: 500 }}>{activeHunts.length} chặng</em> cho bạn
            </div>
          </div>
          <button onClick={() => navigate('/hunter')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: T.sans, fontSize: 12, fontWeight: 500, color: T.ink2, display: 'flex', alignItems: 'center', gap: 4 }}>
            Xem tất cả <Ic.chevron size={12} stroke={T.ink2} />
          </button>
        </div>
        <div className="of-scroll-x" style={SCROLL}>
          {activeHunts.map((h) => <HuntCardCompact key={h.id} hunt={h} onTap={() => navigate('/hunter')} />)}
          <button onClick={() => navigate('/hunter')} style={{ minWidth: 130, flexShrink: 0, background: 'transparent', border: `1px dashed ${T.line2}`, borderRadius: 6, padding: 16, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: T.paper2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: T.serif, fontSize: 22, color: T.rust, marginTop: -2 }}>+</span>
            </div>
            <div style={{ fontFamily: T.serif, fontSize: 13, color: T.ink2, textAlign: 'center', lineHeight: 1.25, fontStyle: 'italic' }}>Tạo hunt mới</div>
          </button>
        </div>
      </div>

      {/* Destinations */}
      <div style={{ padding: '28px 0 0' }}>
        <div style={{ padding: '0 20px 12px' }}>
          <Eyebrow>Có thể bạn đang nghĩ tới</Eyebrow>
          <div style={{ fontFamily: T.serif, fontSize: 18, fontWeight: 500, color: T.ink, marginTop: 6, letterSpacing: '-0.4px' }}>Điểm đến gợi ý cho bạn</div>
        </div>
        <div className="of-scroll-x" style={SCROLL}>
          {destinations.map((d) => <DestCard key={d.code} dest={d} />)}
        </div>
      </div>

      {/* Vouchers */}
      <div style={{ padding: '28px 0 16px' }}>
        <div style={{ padding: '0 20px 12px' }}>
          <Eyebrow>Mã ưu đãi của bạn</Eyebrow>
          <div style={{ fontFamily: T.serif, fontSize: 18, fontWeight: 500, color: T.ink, marginTop: 6, letterSpacing: '-0.4px' }}>{vouchers.length} mã sẵn sàng dùng</div>
        </div>
        <div className="of-scroll-x" style={SCROLL}>
          {vouchers.map((v) => <VoucherCard key={v.code} v={v} />)}
        </div>
      </div>

      {/* Editorial footnote */}
      <div style={{ padding: '24px 24px 8px', textAlign: 'center' }}>
        <Eyebrow dash={false} style={{ color: T.ink4 }}>Bay trong nắng mới</Eyebrow>
      </div>
    </div>
  )
}
