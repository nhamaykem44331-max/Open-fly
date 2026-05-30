// OpenFly — Hunt Detail (mobile), ported from screens-hunter-detail.jsx HunterDetailScreen.
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { T, fmtVnd } from '../../theme/tokens'
import { Eyebrow, Price, Ic, ChannelIcon, PriceHistoryChart } from '../../components/ui'
import { huntStatusMeta } from './huntStatus'
import { AIRPORTS, NOTIF_LOG } from '../../data/mock'
import type { Hunt } from '../../data/mock'

function LegendDot({ color, label, dashed, hollow, opacity = 1 }: { color: string; label: string; dashed?: boolean; hollow?: boolean; opacity?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, opacity }}>
      {dashed ? (
        <svg width="14" height="2"><line x1="0" y1="1" x2="14" y2="1" stroke={color} strokeWidth="1.5" strokeDasharray="3 2" /></svg>
      ) : hollow ? (
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.paper, border: `1.5px solid ${color}` }} />
      ) : (
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
      )}
      <span style={{ fontFamily: T.sans, fontSize: 9.5, color: T.ink3, letterSpacing: 0.3, fontWeight: 500 }}>{label}</span>
    </div>
  )
}

function StatCell({ label, value, sub, left, top }: { label: string; value: ReactNode; sub: string; left?: boolean; top?: boolean }) {
  return (
    <div style={{ padding: '14px 16px', borderLeft: left ? `1px solid ${T.line}` : 'none', borderTop: top ? `1px solid ${T.line}` : 'none' }}>
      <div style={{ fontFamily: T.sans, fontSize: 10, color: T.ink3, letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: 500 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
        <span style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 500, color: T.ink, letterSpacing: '-0.5px', lineHeight: 1 }}>{value}</span>
        <span style={{ fontFamily: T.serif, fontSize: 11, color: T.ink3, fontStyle: 'italic' }}>{sub}</span>
      </div>
    </div>
  )
}

function ActionRow({ label, icon, danger, onClick }: { label: string; icon: ReactNode; danger?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderRadius: 6, background: T.paper, border: `1px solid ${T.line}`, cursor: 'pointer', fontFamily: T.serif, fontSize: 14, fontWeight: 500, color: danger ? T.red : T.ink, textAlign: 'left', letterSpacing: '-0.2px' }}>
      <div style={{ width: 30, height: 30, borderRadius: 4, background: T.paper2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
      <span style={{ flex: 1 }}>{label}</span>
      <Ic.chevron size={12} stroke={T.ink3} />
    </button>
  )
}

export function HunterDetailMobile({ hunt }: { hunt: Hunt }) {
  const navigate = useNavigate()
  const a1 = AIRPORTS[hunt.from]
  const a2 = AIRPORTS[hunt.to]
  const found = hunt.status === 'found'
  const meta = huntStatusMeta(hunt.status)
  const savings = hunt.target - hunt.best
  const savingsPct = Math.round((savings / hunt.target) * 100)
  const last = hunt.trend30[hunt.trend30.length - 1]
  const avg = Math.round(hunt.trend30.reduce((s, v) => s + v, 0) / hunt.trend30.length)

  return (
    <div style={{ background: T.paper, minHeight: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px 8px' }}>
        <button onClick={() => navigate('/hunter')} aria-label="Quay lại" style={{ width: 36, height: 36, borderRadius: '50%', background: 'transparent', border: `1px solid ${T.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Ic.back size={16} stroke={T.ink} /></button>
        <div style={{ flex: 1 }}><Eyebrow dash={false}>Chi tiết hunt</Eyebrow></div>
        <button aria-label="Tùy chọn" style={{ width: 36, height: 36, borderRadius: '50%', background: 'transparent', border: `1px solid ${T.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Ic.options size={16} stroke={T.ink2} /></button>
      </div>

      {/* Hero */}
      <div style={{ padding: '4px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: meta.dot, boxShadow: meta.pulse ? `0 0 0 4px ${meta.dot}22` : 'none', animation: meta.pulse ? 'pulse 2s ease-in-out infinite' : 'none' }} />
          <div style={{ fontFamily: T.sans, fontSize: 10, fontWeight: 600, letterSpacing: 1.6, textTransform: 'uppercase', color: meta.text }}>{meta.label}</div>
        </div>
        <h1 style={{ fontFamily: T.serif, fontSize: 32, fontWeight: 400, letterSpacing: '-1.2px', lineHeight: 1, color: T.ink, margin: '6px 0 8px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontWeight: 500 }}>{hunt.from}</span>
          <Ic.arrow size={16} stroke={T.ink3} />
          <span style={{ fontWeight: 500, color: T.rust }}>{hunt.to}</span>
        </h1>
        <div style={{ fontFamily: T.serif, fontSize: 14, color: T.ink3, fontStyle: 'italic', marginBottom: 18 }}>{a1.city} → {a2.city} · {hunt.window} · {hunt.pax} khách</div>
      </div>

      {/* Chart card */}
      <div style={{ padding: '0 20px' }}>
        <div style={{ background: T.paper, border: `1px solid ${T.line}`, borderRadius: 6, padding: '18px 4px 16px 4px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '0 16px 12px' }}>
            <div>
              <Eyebrow dash={false}>Lịch sử giá · 30 ngày</Eyebrow>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 8 }}>
                <Price value={last} size={32} />
                <div style={{ fontFamily: T.serif, fontSize: 12, color: found ? T.green : T.amber, fontStyle: 'italic' }}>{found ? `↓ ${fmtVnd(savings)}đ (${savingsPct}%)` : `+${fmtVnd(last - hunt.target)}đ so với mục tiêu`}</div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: T.sans, fontSize: 10, color: T.ink3, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 500 }}>Trung bình 30 ngày</div>
              <div style={{ fontFamily: T.serif, fontSize: 14, color: T.ink, marginTop: 4, fontWeight: 500 }}>{fmtVnd(avg)}đ</div>
            </div>
          </div>
          <PriceHistoryChart data={hunt.trend30} target={hunt.target} w={360} h={200} />
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', padding: '12px 16px 0', borderTop: `1px solid ${T.line}`, marginTop: 8 }}>
            <LegendDot color={T.rust} label="Giá thực tế" />
            <LegendDot color={T.ink2} label="Mục tiêu" dashed />
            <LegendDot color={T.green} label="Thấp nhất" hollow />
          </div>
        </div>
      </div>

      {/* Sol prediction */}
      <div style={{ padding: '16px 20px 0' }}>
        <div style={{ background: T.inkBlock, color: T.onInk, borderRadius: 6, padding: 16, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: T.rust, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontFamily: T.serif, fontSize: 15, color: '#F5F1EA', fontStyle: 'italic', fontWeight: 600, marginTop: -1 }}>S</span>
          </div>
          <div style={{ flex: 1 }}>
            <Eyebrow dash={false} color={T.rustSoft} style={{ marginBottom: 6 }}>Xu hướng giá gần đây</Eyebrow>
            <div style={{ fontFamily: T.serif, fontSize: 14, color: T.onInk, lineHeight: 1.5, fontStyle: 'italic' }}>{hunt.aiTrend.text}</div>
            {found && (
              <button onClick={() => navigate('/detail/fl-002')} style={{ marginTop: 12, padding: '8px 14px', borderRadius: 4, background: T.rust, border: 'none', color: '#F5F1EA', fontFamily: T.serif, fontSize: 13, fontWeight: 500, letterSpacing: '-0.1px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                Đặt ngay với giá {fmtVnd(hunt.best)}đ <Ic.arrow size={14} stroke="#F5F1EA" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ padding: '24px 20px 0' }}>
        <Eyebrow>Hoạt động</Eyebrow>
        <div style={{ marginTop: 12, background: T.paper, border: `1px solid ${T.line}`, borderRadius: 6, display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
          <StatCell label="Đã quét" value={hunt.scans} sub={`mỗi ${hunt.frequency}g`} />
          <StatCell label="Đang theo dõi" value={hunt.createdDaysAgo} sub="ngày" left />
          <StatCell label="Thông báo đã gửi" value={hunt.notifSent} sub="qua các kênh" top />
          <StatCell label="Hãng theo dõi" value={hunt.airlines.length} sub={hunt.airlines.join(' · ')} left top />
        </div>
      </div>

      {/* Channels */}
      <div style={{ padding: '24px 20px 0' }}>
        <Eyebrow>Kênh thông báo</Eyebrow>
        <div style={{ marginTop: 12, background: T.paper, border: `1px solid ${T.line}`, borderRadius: 6, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
          {hunt.channels.map((ch) => (
            <div key={ch} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 100, background: T.paper2, border: `1px solid ${T.line}` }}>
              <ChannelIcon kind={ch} size={12} />
              <span style={{ fontFamily: T.sans, fontSize: 11, fontWeight: 500, color: T.ink2, textTransform: 'capitalize', letterSpacing: 0.2 }}>{ch}</span>
            </div>
          ))}
          <div style={{ flex: 1 }} />
          <button onClick={() => navigate('/hunter/notifs')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: T.sans, fontSize: 10, fontWeight: 500, color: T.rust, letterSpacing: 0.5, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            Xem mẫu <Ic.chevron size={10} stroke={T.rust} />
          </button>
        </div>
      </div>

      {/* Notification log */}
      {found && (
        <div style={{ padding: '24px 20px 0' }}>
          <Eyebrow>Lịch sử thông báo</Eyebrow>
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {NOTIF_LOG.map((n, i) => (
              <div key={n.id} style={{ background: T.paper, border: `1px solid ${T.line}`, borderTop: i === 0 ? `1px solid ${T.line}` : 'none', borderRadius: i === 0 ? '6px 6px 0 0' : i === NOTIF_LOG.length - 1 ? '0 0 6px 6px' : 0, padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 30, height: 30, borderRadius: 4, background: T.paper2, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChannelIcon kind={n.channel} size={14} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: T.serif, fontSize: 13, color: T.ink, fontWeight: 500, lineHeight: 1.3 }}>{n.title}</div>
                  <div style={{ fontFamily: T.sans, fontSize: 10, color: T.ink3, marginTop: 4, letterSpacing: 0.3 }}>{n.date}</div>
                </div>
                <Ic.check size={14} stroke={T.green} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ padding: '24px 20px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <ActionRow label="Chỉnh sửa yêu cầu" icon={<Ic.options size={16} stroke={T.ink2} />} />
        <ActionRow label="Tạm dừng săn vé" icon={<Ic.dot size={10} stroke={T.amber} />} />
        <ActionRow label="Xóa hunt này" icon={<Ic.close size={16} stroke={T.red} />} danger />
      </div>

      {/* Footnote */}
      <div style={{ padding: '28px 24px 16px', textAlign: 'center' }}>
        <Eyebrow dash={false} style={{ color: T.ink4 }}>Mỗi câu đều có lý do để tồn tại</Eyebrow>
      </div>

      {/* CTA bar (only if found) */}
      {found && (
        <div style={{ borderTop: `1px solid ${T.line}`, padding: '14px 20px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: T.sans, fontSize: 10, color: T.ink3, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 500 }}>Giá tốt nhất tìm được</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 2 }}>
              <Price value={hunt.best} size={20} />
              <span style={{ fontFamily: T.serif, fontSize: 11, color: T.green, fontStyle: 'italic' }}>· {hunt.bestDate}</span>
            </div>
          </div>
          <button onClick={() => navigate('/detail/fl-002')} style={{ padding: '14px 22px', background: T.ink, color: T.paper, border: 'none', borderRadius: 4, fontFamily: T.serif, fontSize: 14, fontWeight: 500, letterSpacing: '-0.2px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            Đặt ngay <Ic.arrow size={14} stroke={T.paper} />
          </button>
        </div>
      )}
    </div>
  )
}
