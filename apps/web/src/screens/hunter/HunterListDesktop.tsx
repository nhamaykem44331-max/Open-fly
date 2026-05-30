// OpenFly — Fare Hunter list (desktop), ported from desktop-hunter.jsx HunterListPage.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { T, fmtVnd } from '../../theme/tokens'
import { Eyebrow, Chip, Btn, Price, Sparkline, Divider, Card, Ic, ChannelIcon } from '../../components/ui'
import { huntStatusMeta } from './huntStatus'
import { Container } from '../../shell/Container'
import { AIRPORTS } from '../../data/mock'
import type { Hunt } from '../../data/mock'

function HuntCardLg({ hunt, onOpen }: { hunt: Hunt; onOpen: () => void }) {
  const a1 = AIRPORTS[hunt.from]
  const a2 = AIRPORTS[hunt.to]
  const found = hunt.status === 'found'
  const meta = huntStatusMeta(hunt.status)
  const savings = hunt.target - hunt.best
  const pct = Math.round((savings / hunt.target) * 100)
  return (
    <Card hover featured={found} onClick={onOpen} style={{ padding: 24, borderRadius: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: meta.dot, animation: meta.pulse ? 'pulse 2s ease-in-out infinite' : 'none' }} />
        <span style={{ fontFamily: T.sans, fontSize: 11, fontWeight: 600, letterSpacing: 1.6, textTransform: 'uppercase', color: meta.text, flex: 1 }}>{meta.label}</span>
        <span style={{ fontFamily: T.sans, fontSize: 11, color: T.ink3 }}>quét mỗi {hunt.frequency}g</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 11 }}>
        <span style={{ fontFamily: T.serif, fontSize: 32, fontWeight: 500, color: T.ink, letterSpacing: '-1px' }}>{hunt.from}</span>
        <Ic.arrow size={17} stroke={T.ink3} />
        <span style={{ fontFamily: T.serif, fontSize: 32, fontWeight: 500, color: T.ink, letterSpacing: '-1px' }}>{hunt.to}</span>
      </div>
      <div style={{ fontFamily: T.sans, fontSize: 12.5, color: T.ink3, marginTop: 5 }}>{a1.city} → {a2.city} · {hunt.windowShort} · {hunt.pax} khách</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 18, paddingTop: 18, borderTop: `1px solid ${T.line}` }}>
        <div>
          <div style={{ fontFamily: T.sans, fontSize: 10, fontWeight: 600, letterSpacing: 1.4, textTransform: 'uppercase', color: T.ink3 }}>{found ? 'Giá tốt nhất' : 'Giá hiện tại'}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 6 }}>
            <Price value={hunt.best} size={28} />
            <span style={{ fontFamily: T.sans, fontSize: 12, color: T.ink3 }}>mục tiêu <em style={{ color: T.ink2, fontStyle: 'normal', fontWeight: 600 }}>{fmtVnd(hunt.target)}đ</em></span>
          </div>
        </div>
        {hunt.trend30.length > 0 && <Sparkline data={hunt.trend30.slice(-14)} w={120} h={40} color={found ? T.green : T.rust} />}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, paddingTop: 14, borderTop: `1px dashed ${T.line2}` }}>
        {found
          ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 6, background: T.greenTint, fontFamily: T.serif, fontSize: 13, color: T.green, fontWeight: 500 }}>↓ {fmtVnd(savings)}đ ({pct}%) <span style={{ color: T.ink3, fontWeight: 400 }}>dưới mục tiêu</span></span>
          : <span style={{ fontFamily: T.serif, fontSize: 13, color: T.ink3, fontStyle: 'italic' }}>Đã quét <em style={{ color: T.ink2, fontStyle: 'normal', fontWeight: 600 }}>{hunt.scans} lần</em> · còn cách mục tiêu {fmtVnd(Math.abs(hunt.best - hunt.target))}đ</span>}
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: 5 }}>
          {hunt.channels.map((ch) => <div key={ch} style={{ width: 24, height: 24, borderRadius: '50%', background: T.paper2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChannelIcon kind={ch} size={12} /></div>)}
        </div>
      </div>
    </Card>
  )
}

const STEPS: [string, string, string][] = [
  ['01', 'Bạn đặt yêu cầu', 'Chặng bay, khoảng ngày linh hoạt, giá mục tiêu và kênh thông báo.'],
  ['02', 'Sol quét giá liên tục', 'Mỗi 1–4 giờ, bot so sánh với lịch sử giá và phát hiện cơ hội.'],
  ['03', 'Bạn nhận thông báo', 'Telegram · Email · Zalo — có nút đặt nhanh, không cần mở app.'],
]

export function HunterListDesktop({ hunts }: { hunts: Hunt[] }) {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<'all' | 'hunting' | 'found'>('all')
  const list = hunts.filter((h) => (filter === 'all' ? true : filter === 'hunting' ? h.status === 'hunting' : h.status === 'found'))
  const totalSavings = hunts.filter((h) => h.status === 'found').reduce((s, h) => s + (h.target - h.best), 0)
  const totalScans = hunts.reduce((s, h) => s + h.scans, 0)
  const foundN = hunts.filter((h) => h.status === 'found').length
  const huntingN = hunts.filter((h) => h.status === 'hunting').length
  const stats: [string | number, string, string][] = [
    [hunts.length, 'Đang săn', T.onInk],
    [totalScans, 'Lần quét', T.onInk],
    [fmtVnd(totalSavings) + 'đ', 'Đã tiết kiệm', T.green],
    [foundN, 'Đã tìm thấy', T.rustSoft],
  ]

  return (
    <div style={{ background: T.canvas, minHeight: '100%', paddingBottom: 70 }}>
      {/* hero band */}
      <div style={{ background: T.inkBlock, color: T.onInk }}>
        <Container max={1240} style={{ paddingTop: 52, paddingBottom: 48 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 48, alignItems: 'center' }}>
            <div>
              <Eyebrow color={T.rustSoft}>Sol săn vé · 24/7</Eyebrow>
              <h1 style={{ fontFamily: T.serif, fontSize: 52, fontWeight: 300, letterSpacing: '-2px', lineHeight: 1.05, color: T.onInk, margin: '18px 0 0' }}>Trợ lý đang <em style={{ color: T.rustSoft, fontWeight: 500 }}>săn cho bạn</em>.</h1>
              <p style={{ fontFamily: T.serif, fontSize: 18, color: 'rgba(245,241,234,0.7)', fontStyle: 'italic', lineHeight: 1.55, margin: '18px 0 0', maxWidth: 460 }}>Đặt một yêu cầu, Sol quét giá liên tục và báo bạn ngay khi tìm được vé đúng ý.</p>
              <div style={{ marginTop: 28 }}><Btn onClick={() => navigate('/hunter/create')} variant="rust" size="lg" icon={<Ic.plus size={18} stroke="#F5F1EA" />}>Tạo Fare Hunt mới</Btn></div>
            </div>
            <div style={{ background: 'rgba(245,241,234,0.05)', border: '1px solid rgba(245,241,234,0.14)', borderRadius: 14, padding: 6, display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
              {stats.map(([n, l, col], i) => (
                <div key={i} style={{ padding: '22px 20px', textAlign: 'center' }}>
                  <div style={{ fontFamily: T.serif, fontSize: 30, fontWeight: 500, color: col, letterSpacing: '-1px' }}>{n}</div>
                  <div style={{ fontFamily: T.sans, fontSize: 10.5, color: 'rgba(245,241,234,0.55)', marginTop: 4, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 500 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </div>

      <Container max={1240} style={{ paddingTop: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
          <Chip active={filter === 'all'} onClick={() => setFilter('all')}>Tất cả · {hunts.length}</Chip>
          <Chip active={filter === 'hunting'} onClick={() => setFilter('hunting')} icon={<span style={{ width: 6, height: 6, borderRadius: '50%', background: T.amber }} />}>Đang săn · {huntingN}</Chip>
          <Chip active={filter === 'found'} onClick={() => setFilter('found')} icon={<span style={{ width: 6, height: 6, borderRadius: '50%', background: T.green }} />}>Đã tìm thấy · {foundN}</Chip>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          {list.map((h) => <HuntCardLg key={h.id} hunt={h} onOpen={() => navigate(`/hunter/${h.id}`)} />)}
        </div>

        <div style={{ marginTop: 56 }}><Divider label="Cách thức hoạt động" /></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 28, marginTop: 32 }}>
          {STEPS.map(([n, t, d]) => (
            <div key={n}>
              <div style={{ fontFamily: T.serif, fontSize: 30, fontWeight: 500, color: T.rust, fontStyle: 'italic', letterSpacing: '-1px' }}>{n}</div>
              <div style={{ fontFamily: T.serif, fontSize: 19, fontWeight: 500, color: T.ink, marginTop: 8 }}>{t}</div>
              <div style={{ fontFamily: T.serif, fontSize: 14.5, color: T.ink3, fontStyle: 'italic', marginTop: 6, lineHeight: 1.55 }}>{d}</div>
            </div>
          ))}
        </div>
      </Container>
    </div>
  )
}
