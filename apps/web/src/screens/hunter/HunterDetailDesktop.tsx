// OpenFly — Hunt Detail (desktop), ported from desktop-hunter.jsx HunterDetailPage.
import { useNavigate } from 'react-router-dom'
import { T, fmtVnd } from '../../theme/tokens'
import { Eyebrow, Price, Toggle, Btn, Ic, ChannelIcon, PriceHistoryChart } from '../../components/ui'
import { huntStatusMeta } from './huntStatus'
import { Container } from '../../shell/Container'
import { AIRPORTS, NOTIF_LOG, CHANNELS } from '../../data/mock'
import { apiEnabled } from '../../lib/api/client'
import { useUpdateHunt, useCancelHunt } from '../../data/useHunts'
import type { Hunt } from '../../data/mock'

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '7px 0' }}>
      <span style={{ fontFamily: T.serif, fontSize: 14, color: T.ink2 }}>{label}</span>
      <span style={{ fontFamily: T.serif, fontSize: 14.5, color: T.ink, fontWeight: 500 }}>{value}</span>
    </div>
  )
}

export function HunterDetailDesktop({ hunt }: { hunt: Hunt }) {
  const navigate = useNavigate()
  const a1 = AIRPORTS[hunt.from]
  const a2 = AIRPORTS[hunt.to]
  const found = hunt.status === 'found'
  const meta = huntStatusMeta(hunt.status)
  const savings = hunt.target - hunt.best
  const pct = Math.round((savings / hunt.target) * 100)
  const log = NOTIF_LOG.slice(0, hunt.notifSent || 3)
  const paused = hunt.status === 'paused'
  const update = useUpdateHunt(hunt.id)
  const cancel = useCancelHunt(hunt.id)
  const onPauseResume = () => {
    if (!apiEnabled || update.isPending) return
    update.mutate(paused ? 'resume' : 'pause')
  }
  const onDelete = () => {
    if (cancel.isPending) return
    if (apiEnabled && !window.confirm('Xóa Fare Hunt này? Sol sẽ ngừng theo dõi chặng này.')) return
    if (!apiEnabled) {
      navigate('/hunter')
      return
    }
    cancel.mutate(undefined, { onSuccess: () => navigate('/hunter') })
  }

  return (
    <div style={{ background: T.canvas, minHeight: '100%', paddingBottom: 80 }}>
      <Container max={1140} style={{ paddingTop: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <button onClick={() => navigate('/hunter')} aria-label="Quay lại" style={{ width: 42, height: 42, borderRadius: '50%', background: 'transparent', border: `1px solid ${T.line2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Ic.back size={17} stroke={T.ink} /></button>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: meta.dot, animation: meta.pulse ? 'pulse 2s ease-in-out infinite' : 'none' }} />
              <span style={{ fontFamily: T.sans, fontSize: 11, fontWeight: 600, letterSpacing: 1.6, textTransform: 'uppercase', color: meta.text }}>{meta.label}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 6 }}>
              <span style={{ fontFamily: T.serif, fontSize: 30, fontWeight: 500, color: T.ink, letterSpacing: '-1px' }}>{a1.city}</span><Ic.arrow size={17} stroke={T.ink3} /><span style={{ fontFamily: T.serif, fontSize: 30, fontWeight: 500, color: T.ink, letterSpacing: '-1px' }}>{a2.city}</span>
              <span style={{ fontFamily: T.sans, fontSize: 13, color: T.ink3, marginLeft: 8 }}>· {hunt.window} · {hunt.pax} khách</span>
            </div>
          </div>
          <Toggle on={!paused} onClick={onPauseResume} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 28, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* chart */}
            <div style={{ background: T.paper, border: `1px solid ${T.line}`, borderRadius: 12, padding: 28 }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 10 }}>
                <div><Eyebrow>Lịch sử giá · 30 ngày</Eyebrow><div style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 500, color: T.ink, marginTop: 6, letterSpacing: '-0.5px' }}>Xu hướng giá vé</div></div>
                <div style={{ textAlign: 'right' }}><div style={{ fontFamily: T.sans, fontSize: 10.5, fontWeight: 600, letterSpacing: 1.4, textTransform: 'uppercase', color: T.ink3 }}>Giá tốt nhất</div><Price value={hunt.best} size={28} color={found ? T.green : T.ink} /></div>
              </div>
              <PriceHistoryChart data={hunt.trend30} target={hunt.target} w={680} h={280} />
            </div>
            {/* AI prediction */}
            <div style={{ background: T.inkBlock, color: T.onInk, borderRadius: 12, padding: 26, display: 'flex', gap: 16 }}>
              <span style={{ width: 38, height: 38, borderRadius: '50%', background: T.rust, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: T.serif, fontSize: 18, color: '#F5F1EA', fontStyle: 'italic', fontWeight: 600 }}>S</span>
              <div>
                <Eyebrow dash={false} color={T.rustSoft} style={{ marginBottom: 8 }}>Xu hướng giá gần đây</Eyebrow>
                <div style={{ fontFamily: T.serif, fontSize: 17, lineHeight: 1.55, fontStyle: 'italic', color: 'rgba(245,241,234,0.95)' }}>{hunt.aiTrend.text}</div>
              </div>
            </div>
            {/* notification log */}
            <div style={{ background: T.paper, border: `1px solid ${T.line}`, borderRadius: 12, padding: 28 }}>
              <Eyebrow style={{ marginBottom: 6 }}>Lịch sử thông báo · {hunt.notifSent} đã gửi</Eyebrow>
              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column' }}>
                {hunt.notifSent ? log.map((n, i, arr) => (
                  <div key={n.id} style={{ display: 'flex', gap: 16, padding: '14px 0', borderBottom: i < arr.length - 1 ? `1px solid ${T.line}` : 'none' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: T.paper2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><ChannelIcon kind={n.channel} size={16} /></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: T.serif, fontSize: 15, color: T.ink, fontWeight: 500 }}>{n.title}</div>
                      <div style={{ fontFamily: T.sans, fontSize: 11.5, color: T.ink3, marginTop: 2 }}>{CHANNELS[n.channel].name} · {n.date}</div>
                    </div>
                  </div>
                )) : <div style={{ fontFamily: T.serif, fontSize: 14, color: T.ink3, fontStyle: 'italic', padding: '10px 0' }}>Chưa có thông báo. Sol sẽ báo ngay khi giá chạm mục tiêu.</div>}
              </div>
            </div>
          </div>
          {/* sticky side */}
          <div style={{ position: 'sticky', top: 86, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: T.paper, border: `1px solid ${found ? T.ink : T.line2}`, borderRadius: 12, padding: 26 }}>
              {found && <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 100, background: T.greenTint, fontFamily: T.sans, fontSize: 11, fontWeight: 600, letterSpacing: 0.5, color: T.green, marginBottom: 14 }}>↓ {fmtVnd(savings)}đ ({pct}%) dưới mục tiêu</div>}
              <div style={{ fontFamily: T.sans, fontSize: 10.5, fontWeight: 600, letterSpacing: 1.4, textTransform: 'uppercase', color: T.ink3 }}>{found ? 'Vé tốt nhất · ' + hunt.bestDate : 'Giá hiện tại'}</div>
              <div style={{ marginTop: 8 }}><Price value={hunt.best} size={40} color={found ? T.green : T.ink} /></div>
              <div style={{ fontFamily: T.serif, fontSize: 14, color: T.ink3, marginTop: 6 }}>mục tiêu của bạn: <em style={{ color: T.ink2, fontStyle: 'normal', fontWeight: 500 }}>{fmtVnd(hunt.target)}đ</em></div>
              <Btn onClick={() => navigate('/detail/fl-002')} full size="lg" variant={found ? 'rust' : 'primary'} style={{ marginTop: 18 }}>{found ? 'Đặt ngay với giá này' : 'Đặt với giá hiện tại'}</Btn>
            </div>
            <div style={{ background: T.paper, border: `1px solid ${T.line}`, borderRadius: 12, padding: 24 }}>
              <Eyebrow dash={false} style={{ marginBottom: 14 }}>Thiết lập hunt</Eyebrow>
              <SummaryRow label="Quét mỗi" value={`${hunt.frequency} giờ`} />
              <SummaryRow label="Đã quét" value={`${hunt.scans} lần`} />
              <SummaryRow label="Tạo cách đây" value={`${hunt.createdDaysAgo} ngày`} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.line}` }}>
                <span style={{ fontFamily: T.sans, fontSize: 11, color: T.ink3, marginRight: 4 }}>Kênh:</span>
                {hunt.channels.map((ch) => <div key={ch} style={{ width: 26, height: 26, borderRadius: '50%', background: T.paper2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChannelIcon kind={ch} size={12} /></div>)}
              </div>
              <button onClick={onDelete} style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${T.line}`, width: '100%', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: T.serif, fontSize: 13, fontWeight: 500, color: T.red, display: 'inline-flex', alignItems: 'center', gap: 8 }}><Ic.close size={13} stroke={T.red} /> Xóa Fare Hunt này</button>
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
}
