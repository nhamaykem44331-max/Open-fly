// OpenFly — Notification preview (desktop), ported from desktop-hunter.jsx HunterNotifsPage.
import { useNavigate } from 'react-router-dom'
import { T } from '../../theme/tokens'
import { Eyebrow, Btn, Ic, ChannelIcon } from '../../components/ui'
import { Container } from '../../shell/Container'

function ChannelHead({ kind, label }: { kind: string; label: string }) {
  return (
    <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.line}`, display: 'flex', alignItems: 'center', gap: 10 }}>
      <ChannelIcon kind={kind} size={18} />
      <span style={{ fontFamily: T.sans, fontSize: 13, fontWeight: 600, color: T.ink2 }}>{label}</span>
    </div>
  )
}

export function HunterNotifsDesktop() {
  const navigate = useNavigate()
  return (
    <div style={{ background: T.canvas, minHeight: '100%', paddingBottom: 80 }}>
      <Container max={1140} style={{ paddingTop: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
          <button onClick={() => navigate('/hunter/create')} aria-label="Quay lại" style={{ width: 42, height: 42, borderRadius: '50%', background: 'transparent', border: `1px solid ${T.line2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Ic.back size={17} stroke={T.ink} /></button>
          <Eyebrow>Xem trước thông báo</Eyebrow>
        </div>
        <h1 style={{ fontFamily: T.serif, fontSize: 34, fontWeight: 400, letterSpacing: '-1.3px', color: T.ink, margin: '6px 0 28px 56px' }}>Sol sẽ báo bạn như thế này</h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
          {/* Telegram */}
          <div style={{ background: T.paper, border: `1px solid ${T.line}`, borderRadius: 12, overflow: 'hidden' }}>
            <ChannelHead kind="telegram" label="Telegram" />
            <div style={{ padding: 20 }}>
              <div style={{ background: T.paper2, borderRadius: '4px 14px 14px 14px', padding: 16, fontFamily: T.serif, fontSize: 14.5, color: T.ink, lineHeight: 1.5 }}>
                <strong style={{ color: T.rust }}>OpenFly · Sol</strong><br />🎯 Tìm thấy vé <strong>HAN–DAD ngày 15/6</strong> chỉ <strong>890.000đ</strong> — giảm 23% so với mục tiêu 1.100.000đ của bạn. Đặt ngay?
                <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                  <span style={{ flex: 1, textAlign: 'center', padding: '8px', borderRadius: 6, background: T.ink, color: T.paper, fontFamily: T.sans, fontSize: 12, fontWeight: 600 }}>Đặt ngay</span>
                  <span style={{ flex: 1, textAlign: 'center', padding: '8px', borderRadius: 6, border: `1px solid ${T.line2}`, color: T.ink2, fontFamily: T.sans, fontSize: 12, fontWeight: 600 }}>Xem</span>
                </div>
              </div>
            </div>
          </div>
          {/* Email */}
          <div style={{ background: T.paper, border: `1px solid ${T.line}`, borderRadius: 12, overflow: 'hidden' }}>
            <ChannelHead kind="email" label="Email" />
            <div style={{ padding: 20 }}>
              <div style={{ fontFamily: T.sans, fontSize: 11, color: T.ink3, marginBottom: 8 }}>Từ: sol@openfly.vn</div>
              <div style={{ fontFamily: T.serif, fontSize: 17, fontWeight: 500, color: T.ink, lineHeight: 1.3 }}>Giá HAN–DAD đã xuống 890.000đ</div>
              <div style={{ fontFamily: T.serif, fontSize: 14, color: T.ink2, marginTop: 8, lineHeight: 1.55 }}>Chào Andy, vé bạn đang theo dõi vừa chạm <em style={{ color: T.rust, fontStyle: 'normal', fontWeight: 500 }}>890.000đ</em> cho ngày 15/6 — thấp hơn mục tiêu 110.000đ.</div>
              <Btn size="sm" style={{ marginTop: 14 }}>Đặt vé này →</Btn>
            </div>
          </div>
          {/* Zalo */}
          <div style={{ background: T.paper, border: `1px solid ${T.line}`, borderRadius: 12, overflow: 'hidden' }}>
            <ChannelHead kind="zalo" label="Zalo OA" />
            <div style={{ padding: 20 }}>
              <div style={{ background: T.paper2, borderRadius: 12, padding: 16, fontFamily: T.serif, fontSize: 14.5, color: T.ink, lineHeight: 1.5 }}>
                ✈️ <strong>OpenFly</strong>: Vé <strong>HAN–DAD 15/6</strong> còn <strong style={{ color: T.rust }}>890.000đ</strong>. Giá tốt hiếm có — đặt trong hôm nay nhé!
              </div>
              <div style={{ marginTop: 12, textAlign: 'center', padding: '10px', borderRadius: 8, border: `1px solid ${T.line2}`, fontFamily: T.sans, fontSize: 12.5, fontWeight: 600, color: T.ink2 }}>Mở OpenFly để đặt →</div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
}
