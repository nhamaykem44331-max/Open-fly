// OpenFly — Notification mockups (mobile): Telegram / Email / Zalo.
// Ported from screens-hunter-detail.jsx. Platform chrome uses literal brand colors
// (these depict external apps, so they intentionally do NOT follow the OpenFly theme).
import { useNavigate } from 'react-router-dom'
import { T } from '../../theme/tokens'
import { Eyebrow, Price, Sunmark, Ic } from '../../components/ui'

function SectionLabelStandalone({ label }: { label: string }) {
  return (
    <div style={{ padding: '8px 20px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontFamily: T.sans, fontSize: 10, fontWeight: 600, letterSpacing: 1.8, textTransform: 'uppercase', color: T.ink2 }}>— {label}</span>
      <div style={{ flex: 1, height: 1, background: T.line }} />
    </div>
  )
}

function TelegramMockup() {
  return (
    <div style={{ background: '#17212B', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, background: '#242F3D', color: '#fff' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#1A1A19', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Sunmark size={20} color={T.rustLt} /></div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: T.sans, fontSize: 13, fontWeight: 600, color: '#fff' }}>OpenFly Bot</div>
          <div style={{ fontFamily: T.sans, fontSize: 10, color: '#7E8F9F', marginTop: 1 }}>đang trực tuyến</div>
        </div>
        <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#5288c1' }} />
      </div>
      <div style={{ padding: '20px 12px 16px', background: '#0E1621' }}>
        <div style={{ textAlign: 'center', marginBottom: 14 }}>
          <span style={{ fontFamily: T.sans, fontSize: 9, color: '#5C7080', letterSpacing: 0.5, background: '#182533', padding: '3px 8px', borderRadius: 100 }}>Hôm nay · 14:32</span>
        </div>
        <div style={{ background: '#182533', color: '#fff', borderRadius: '4px 14px 14px 14px', padding: '12px 14px', maxWidth: '92%', boxShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <span style={{ padding: '2px 7px', borderRadius: 4, background: T.rust, color: '#F5F1EA', fontFamily: T.sans, fontSize: 9, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase' }}>Săn vé · trúng giá</span>
          </div>
          <div style={{ fontFamily: T.sans, fontSize: 13, lineHeight: 1.45, color: '#fff' }}>
            Sol vừa tìm thấy vé <b style={{ color: '#E89977' }}>HAN → DAD</b> ngày <b>15 thg 6</b> chỉ <b>890.000đ</b>. Thấp hơn <b style={{ color: '#7BC59A' }}>110.000đ</b> so với mục tiêu của bạn.
          </div>
          <div style={{ marginTop: 10, padding: 10, borderRadius: 6, background: '#0E1621', borderLeft: `3px solid ${T.rust}` }}>
            <div style={{ fontFamily: T.sans, fontSize: 10, color: '#7E8F9F', letterSpacing: 0.4, textTransform: 'uppercase', fontWeight: 600 }}>Vietjet VJ513 · A321</div>
            <div style={{ fontFamily: T.sans, fontSize: 14, color: '#fff', marginTop: 4, fontWeight: 500, display: 'flex', alignItems: 'baseline', gap: 8 }}>07:25 — 08:55 <span style={{ color: '#7E8F9F', fontSize: 10 }}>1g 30p bay thẳng</span></div>
            <div style={{ fontFamily: T.sans, fontSize: 11, color: '#7E8F9F', marginTop: 2 }}>HAN · Nội Bài → DAD · Đà Nẵng</div>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            <button style={{ flex: 1, padding: '8px 10px', borderRadius: 6, cursor: 'pointer', background: T.rust, color: '#fff', border: 'none', fontFamily: T.sans, fontSize: 11, fontWeight: 600, letterSpacing: 0.3 }}>Đặt ngay</button>
            <button style={{ padding: '8px 10px', borderRadius: 6, cursor: 'pointer', background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', fontFamily: T.sans, fontSize: 11, fontWeight: 500, letterSpacing: 0.3 }}>Tạm hoãn</button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8, fontFamily: T.sans, fontSize: 9, color: '#5C7080', justifyContent: 'flex-end' }}>14:32 <Ic.check size={11} stroke="#5288c1" /></div>
        </div>
      </div>
    </div>
  )
}

function EmailMockup() {
  return (
    <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', border: `1px solid ${T.line}` }}>
      <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, background: '#F5F5F5', borderBottom: '1px solid #E4E4E4' }}>
        <Ic.back size={14} stroke="#5F6368" />
        <div style={{ marginLeft: 'auto' }}><Ic.options size={14} stroke="#5F6368" /></div>
      </div>
      <div style={{ padding: '18px 18px 12px' }}>
        <div style={{ fontFamily: T.sans, fontSize: 16, fontWeight: 600, color: '#1F1F1F', letterSpacing: -0.2, lineHeight: 1.3 }}>Giá HAN → DAD vừa giảm xuống 890.000đ — Sol đã tìm thấy vé bạn đang săn</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#F5F1EA', border: '1px solid rgba(26,26,25,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Sunmark size={18} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: T.sans, fontSize: 13, fontWeight: 500, color: '#1F1F1F' }}>OpenFly <span style={{ color: '#5F6368', fontWeight: 400 }}>{'<sol@openfly.vn>'}</span></div>
            <div style={{ fontFamily: T.sans, fontSize: 11, color: '#5F6368', marginTop: 1 }}>đến tôi · 14:32</div>
          </div>
        </div>
      </div>
      <div style={{ padding: '0 18px 18px' }}>
        <div style={{ height: 1, background: '#E4E4E4', marginBottom: 16 }} />
        <div style={{ fontFamily: T.serif, fontSize: 16, color: '#1A1A19', letterSpacing: '-0.3px', marginBottom: 12 }}>Chào Andy,</div>
        <div style={{ fontFamily: T.serif, fontSize: 14, color: '#1A1A19', lineHeight: 1.65 }}>
          Sol vừa tìm thấy một vé phù hợp với yêu cầu của bạn. Giá hiện tại là <em style={{ color: '#A14B2C', fontWeight: 500 }}>890.000đ</em> — thấp hơn <em style={{ color: '#4A8A6F', fontStyle: 'normal', fontWeight: 500 }}>110.000đ</em> so với mục tiêu bạn đặt (1.000.000đ).
        </div>
        <div style={{ marginTop: 18, border: '1px solid rgba(26,26,25,0.18)', borderRadius: 6, padding: '16px 18px' }}>
          <div style={{ fontFamily: T.sans, fontSize: 10, color: '#6B635A', letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>Chuyến bay</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div>
              <div style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 500, color: '#1A1A19', letterSpacing: '-0.5px', lineHeight: 1 }}>07:25</div>
              <div style={{ fontFamily: T.sans, fontSize: 10, color: '#6B635A', marginTop: 4, fontWeight: 600, letterSpacing: 0.5 }}>HAN</div>
            </div>
            <div style={{ flex: 1, padding: '0 4px' }}>
              <div style={{ fontFamily: T.sans, fontSize: 10, color: '#6B635A', textAlign: 'center', marginBottom: 4 }}>1g 30p · bay thẳng</div>
              <div style={{ height: 1, background: 'rgba(26,26,25,0.18)', position: 'relative' }}><Ic.plane2 size={10} stroke="#A14B2C" sw={1.6} /></div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 500, color: '#1A1A19', letterSpacing: '-0.5px', lineHeight: 1 }}>08:55</div>
              <div style={{ fontFamily: T.sans, fontSize: 10, color: '#6B635A', marginTop: 4, fontWeight: 600, letterSpacing: 0.5 }}>DAD</div>
            </div>
          </div>
          <div style={{ height: 1, background: 'rgba(26,26,25,0.10)', margin: '14px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: T.serif, fontSize: 13, color: '#3D3935' }}>Vietjet VJ513 · 15 thg 6</span>
            <Price value={890} size={18} color="#1A1A19" />
          </div>
        </div>
        <div style={{ display: 'inline-block', marginTop: 18, padding: '14px 24px', background: '#1A1A19', color: '#F5F1EA', borderRadius: 4, fontFamily: T.serif, fontSize: 14, fontWeight: 500, letterSpacing: '-0.2px' }}>Đặt vé này ngay →</div>
        <div style={{ fontFamily: T.serif, fontSize: 12, color: '#6B635A', fontStyle: 'italic', marginTop: 14, lineHeight: 1.55 }}>Giá có thể thay đổi nhanh. Sol khuyên bạn quyết định trong vòng 24h.</div>
      </div>
    </div>
  )
}

function ZaloMockup() {
  return (
    <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', border: `1px solid ${T.line}` }}>
      <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, background: '#0068FF', color: '#fff' }}>
        <Ic.back size={16} stroke="#fff" />
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Sunmark size={18} /></div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: T.sans, fontSize: 14, fontWeight: 600, color: '#fff' }}>OpenFly</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
            <span style={{ padding: '1px 6px', borderRadius: 100, background: 'rgba(255,255,255,0.2)', fontFamily: T.sans, fontSize: 9, color: '#fff', fontWeight: 600, letterSpacing: 0.5 }}>OA</span>
            <span style={{ fontFamily: T.sans, fontSize: 10, color: 'rgba(255,255,255,0.85)' }}>· 1.2k người quan tâm</span>
          </div>
        </div>
      </div>
      <div style={{ background: '#E9F0FB', padding: '16px 12px' }}>
        <div style={{ textAlign: 'center', marginBottom: 14 }}>
          <span style={{ fontFamily: T.sans, fontSize: 10, color: '#7B8794', background: 'rgba(255,255,255,0.85)', padding: '3px 10px', borderRadius: 100 }}>Hôm nay · 14:32</span>
        </div>
        <div style={{ background: '#fff', borderRadius: '4px 14px 14px 14px', overflow: 'hidden', maxWidth: '90%', boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }}>
          <div style={{ background: '#1A1A19', color: '#F5F1EA', padding: '12px 14px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Sunmark size={22} color={T.rustLt} />
            <div>
              <div style={{ fontFamily: T.sans, fontSize: 9, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', color: T.rustSoft }}>Vé phù hợp · ưu tiên</div>
              <div style={{ fontFamily: T.serif, fontSize: 14, fontWeight: 500, marginTop: 2, letterSpacing: '-0.2px' }}>HAN → DAD · 890.000đ</div>
            </div>
          </div>
          <div style={{ padding: '14px 14px 12px' }}>
            <div style={{ fontFamily: T.sans, fontSize: 13, color: '#1F1F1F', lineHeight: 1.5 }}>Sol tìm thấy vé Vietjet 15 thg 6 chỉ <b style={{ color: '#A14B2C' }}>890.000đ</b> — thấp hơn <b style={{ color: '#4A8A6F' }}>110.000đ</b> so với mục tiêu bạn đặt.</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, padding: '8px 0 0', borderTop: '1px solid rgba(26,26,25,0.10)' }}>
              <div style={{ flex: 1, fontFamily: T.sans, fontSize: 11, color: '#5F6368' }}>07:25 — 08:55 · 1g 30p</div>
              <button style={{ padding: '8px 14px', borderRadius: 100, background: '#0068FF', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: T.sans, fontSize: 11, fontWeight: 600, letterSpacing: 0.2 }}>Đặt ngay</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function HunterNotifsMobile() {
  const navigate = useNavigate()
  return (
    <div style={{ background: T.paper2, minHeight: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px 8px', background: T.paper, borderBottom: `1px solid ${T.line}` }}>
        <button onClick={() => navigate(-1)} aria-label="Quay lại" style={{ width: 36, height: 36, borderRadius: '50%', background: 'transparent', border: `1px solid ${T.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Ic.back size={16} stroke={T.ink} /></button>
        <div style={{ flex: 1 }}><Eyebrow dash={false}>Thông báo trông thế nào</Eyebrow></div>
      </div>
      <div style={{ padding: '20px 20px 0' }}>
        <h1 style={{ fontFamily: T.serif, fontSize: 24, fontWeight: 400, letterSpacing: '-0.8px', lineHeight: 1.1, color: T.ink, margin: '0 0 6px' }}>
          Khi tìm thấy giá tốt, <em style={{ color: T.rust, fontWeight: 500 }}>bạn sẽ nhận được</em>:
        </h1>
        <p style={{ fontFamily: T.serif, fontSize: 13, color: T.ink3, fontStyle: 'italic', margin: 0, lineHeight: 1.5, marginBottom: 20 }}>
          Mỗi kênh được thiết kế để bạn quyết định nhanh, ngay tại nơi đang xem.
        </p>
      </div>
      <SectionLabelStandalone label="Telegram" />
      <div style={{ padding: '0 20px 20px' }}><TelegramMockup /></div>
      <SectionLabelStandalone label="Email" />
      <div style={{ padding: '0 20px 20px' }}><EmailMockup /></div>
      <SectionLabelStandalone label="Zalo Official Account" />
      <div style={{ padding: '0 20px 20px' }}><ZaloMockup /></div>
      <div style={{ padding: '8px 24px 16px', textAlign: 'center' }}>
        <Eyebrow dash={false} style={{ color: T.ink4 }}>Một biểu tượng thầm lặng</Eyebrow>
      </div>
    </div>
  )
}
