// OpenFly — Fare Hunter list (mobile), ported from screens-hunter.jsx HunterListScreen.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { T, fmtVnd } from '../../theme/tokens'
import { Eyebrow, Chip, Price, Sparkline, Divider, Ic, ChannelIcon } from '../../components/ui'
import { AIRPORTS } from '../../data/mock'
import type { Hunt } from '../../data/mock'

function HuntListCard({ hunt, onTap }: { hunt: Hunt; onTap: () => void }) {
  const a1 = AIRPORTS[hunt.from]
  const a2 = AIRPORTS[hunt.to]
  const found = hunt.status === 'found'
  const savings = hunt.target - hunt.best
  const savingsPct = Math.round((savings / hunt.target) * 100)
  const trendCol = found ? T.green : T.rust
  return (
    <div onClick={onTap} style={{ background: T.paper, border: `1px solid ${found ? T.ink : T.line}`, borderRadius: 6, padding: '18px 18px 16px', cursor: 'pointer', transition: 'all 0.15s' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: found ? T.green : T.amber, boxShadow: found ? 'none' : `0 0 0 4px ${T.amber}22`, animation: found ? 'none' : 'pulse 2s ease-in-out infinite' }} />
        <div style={{ fontFamily: T.sans, fontSize: 10, fontWeight: 600, letterSpacing: 1.6, textTransform: 'uppercase', color: found ? T.green : T.ink3, flex: 1 }}>{found ? 'Đã tìm thấy giá tốt' : 'Đang săn'}</div>
        <div style={{ fontFamily: T.sans, fontSize: 10, color: T.ink3, letterSpacing: 0.3 }}>Quét mỗi {hunt.frequency}g</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
        <span style={{ fontFamily: T.serif, fontSize: 26, fontWeight: 500, color: T.ink, letterSpacing: '-0.8px', lineHeight: 1 }}>{hunt.from}</span>
        <Ic.arrow size={14} stroke={T.ink3} />
        <span style={{ fontFamily: T.serif, fontSize: 26, fontWeight: 500, color: T.ink, letterSpacing: '-0.8px', lineHeight: 1 }}>{hunt.to}</span>
      </div>
      <div style={{ fontFamily: T.sans, fontSize: 11, color: T.ink3, marginBottom: 14 }}>{a1.city} → {a2.city} · {hunt.windowShort} · {hunt.pax} khách</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', paddingTop: 14, borderTop: `1px solid ${T.line}` }}>
        <div>
          <div style={{ fontFamily: T.sans, fontSize: 10, fontWeight: 500, letterSpacing: 1.5, textTransform: 'uppercase', color: T.ink3 }}>{found ? 'Giá tốt nhất' : 'Giá hiện tại'}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
            <Price value={hunt.best} size={22} />
            <span style={{ fontFamily: T.sans, fontSize: 11, color: T.ink3 }}>mục tiêu <em style={{ color: T.ink2, fontStyle: 'normal', fontWeight: 500 }}>{fmtVnd(hunt.target)}đ</em></span>
          </div>
        </div>
        <Sparkline data={hunt.trend30.slice(-12)} w={84} h={28} color={trendCol} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 12, borderTop: `1px dashed ${T.line2}` }}>
        {found ? (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 8px', borderRadius: 4, background: T.greenTint, fontFamily: T.serif, fontSize: 12, color: T.green, fontWeight: 500 }}>
            ↓ {fmtVnd(savings)}đ ({savingsPct}%) <span style={{ color: T.ink3, fontWeight: 400 }}>dưới mục tiêu</span>
          </div>
        ) : (
          <div style={{ fontFamily: T.serif, fontSize: 12, color: T.ink3, fontStyle: 'italic' }}>
            Đã quét <em style={{ color: T.ink2, fontStyle: 'normal', fontWeight: 500 }}>{hunt.scans} lần</em> · còn cách mục tiêu {fmtVnd(Math.abs(hunt.best - hunt.target))}đ
          </div>
        )}
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: 4 }}>
          {hunt.channels.map((ch) => (
            <div key={ch} style={{ width: 22, height: 22, borderRadius: '50%', background: T.paper2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChannelIcon kind={ch} size={11} /></div>
          ))}
        </div>
      </div>
    </div>
  )
}

const STEPS = [
  { n: '01', t: 'Bạn đặt yêu cầu', d: 'Chặng bay, khoảng ngày linh hoạt, giá mục tiêu và kênh thông báo.' },
  { n: '02', t: 'Sol quét giá liên tục', d: 'Mỗi 1–4 giờ, bot so sánh với lịch sử giá và phát hiện cơ hội.' },
  { n: '03', t: 'Bạn nhận thông báo', d: 'Telegram / Email / Zalo · có nút đặt nhanh, không cần mở app.' },
]

export function HunterListMobile({ hunts }: { hunts: Hunt[] }) {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<'all' | 'hunting' | 'found'>('all')
  const list = hunts.filter((h) => (filter === 'all' ? true : filter === 'hunting' ? h.status === 'hunting' : h.status === 'found'))
  const totalSavings = hunts.filter((h) => h.status === 'found').reduce((s, h) => s + (h.target - h.best), 0)
  const totalScans = hunts.reduce((s, h) => s + h.scans, 0)
  const huntingN = hunts.filter((h) => h.status === 'hunting').length
  const foundN = hunts.filter((h) => h.status === 'found').length

  return (
    <div style={{ background: T.paper, minHeight: '100%', paddingBottom: 60 }}>
      <div style={{ padding: '14px 20px 0' }}>
        <Eyebrow>Sol săn vé · 24/7</Eyebrow>
        <h1 style={{ fontFamily: T.serif, fontSize: 30, fontWeight: 400, letterSpacing: '-1.1px', lineHeight: 1.05, color: T.ink, margin: '12px 0 6px' }}>
          Trợ lý đang <em style={{ color: T.rust, fontWeight: 500 }}>săn cho bạn</em>
        </h1>
        <p style={{ fontFamily: T.serif, fontSize: 14, color: T.ink3, fontStyle: 'italic', lineHeight: 1.5, margin: '4px 0 18px', maxWidth: 280 }}>
          Đặt một yêu cầu, Sol sẽ quét giá liên tục và báo cho bạn ngay khi tìm được vé đúng ý.
        </p>
      </div>

      {/* Stats strip */}
      <div style={{ margin: '0 20px 16px', borderRadius: 6, border: `1px solid ${T.line}`, background: T.paper, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div style={{ padding: '14px 12px', textAlign: 'center' }}>
          <div style={{ fontFamily: T.serif, fontSize: 20, fontWeight: 500, color: T.ink, letterSpacing: '-0.5px' }}>{hunts.length}</div>
          <div style={{ fontFamily: T.sans, fontSize: 9.5, color: T.ink3, marginTop: 2, letterSpacing: 0.6, textTransform: 'uppercase', fontWeight: 500 }}>Đang săn</div>
        </div>
        <div style={{ padding: '14px 12px', textAlign: 'center', borderLeft: `1px solid ${T.line}`, borderRight: `1px solid ${T.line}` }}>
          <div style={{ fontFamily: T.serif, fontSize: 20, fontWeight: 500, color: T.ink, letterSpacing: '-0.5px' }}>{totalScans}</div>
          <div style={{ fontFamily: T.sans, fontSize: 9.5, color: T.ink3, marginTop: 2, letterSpacing: 0.6, textTransform: 'uppercase', fontWeight: 500 }}>Lần quét</div>
        </div>
        <div style={{ padding: '14px 12px', textAlign: 'center' }}>
          <div style={{ fontFamily: T.serif, fontSize: 20, fontWeight: 500, color: T.green, letterSpacing: '-0.5px' }}>
            <em style={{ fontStyle: 'normal' }}>{totalSavings}</em><span style={{ fontSize: 12, color: T.ink3, fontStyle: 'italic', marginLeft: 2 }}>k</span>
          </div>
          <div style={{ fontFamily: T.sans, fontSize: 9.5, color: T.ink3, marginTop: 2, letterSpacing: 0.6, textTransform: 'uppercase', fontWeight: 500 }}>Đã tiết kiệm</div>
        </div>
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 8, padding: '4px 20px 14px' }}>
        <Chip active={filter === 'all'} onClick={() => setFilter('all')}>Tất cả · {hunts.length}</Chip>
        <Chip active={filter === 'hunting'} onClick={() => setFilter('hunting')} icon={<span style={{ width: 6, height: 6, borderRadius: '50%', background: T.amber }} />}>Đang săn · {huntingN}</Chip>
        <Chip active={filter === 'found'} onClick={() => setFilter('found')} icon={<span style={{ width: 6, height: 6, borderRadius: '50%', background: T.green }} />}>Đã tìm thấy · {foundN}</Chip>
      </div>

      {/* Hunt list */}
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {list.map((h) => <HuntListCard key={h.id} hunt={h} onTap={() => navigate(`/hunter/${h.id}`)} />)}
      </div>

      {/* How it works */}
      <div style={{ padding: '24px 20px 4px' }}><Divider label="Cách thức hoạt động" /></div>
      <div style={{ padding: '14px 20px 4px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {STEPS.map((s) => (
          <div key={s.n} style={{ display: 'flex', gap: 14 }}>
            <div style={{ fontFamily: T.serif, fontSize: 18, fontWeight: 500, color: T.rust, letterSpacing: '-0.5px', minWidth: 28, fontStyle: 'italic' }}>{s.n}</div>
            <div style={{ flex: 1, paddingTop: 1 }}>
              <div style={{ fontFamily: T.serif, fontSize: 15, fontWeight: 500, color: T.ink, letterSpacing: '-0.2px' }}>{s.t}</div>
              <div style={{ fontFamily: T.serif, fontSize: 13, color: T.ink3, marginTop: 3, lineHeight: 1.5, fontStyle: 'italic' }}>{s.d}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Floating FAB above bottom nav */}
      <div style={{ position: 'fixed', left: 0, right: 0, bottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)', padding: '0 20px', display: 'flex', justifyContent: 'center', pointerEvents: 'none', zIndex: 30 }}>
        <button onClick={() => navigate('/hunter/create')} style={{ background: T.ink, color: T.paper, border: 'none', padding: '15px 24px', borderRadius: 100, cursor: 'pointer', fontFamily: T.serif, fontSize: 14, fontWeight: 500, letterSpacing: '-0.2px', display: 'inline-flex', alignItems: 'center', gap: 10, pointerEvents: 'auto', boxShadow: '0 6px 24px rgba(26,26,25,0.22), 0 2px 8px rgba(26,26,25,0.18)' }}>
          <span style={{ width: 22, height: 22, borderRadius: '50%', background: T.rust, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.serif, fontSize: 16, color: '#F5F1EA', lineHeight: 0.9, marginTop: -1 }}>+</span>
          Tạo Fare Hunt mới
        </button>
      </div>
    </div>
  )
}
