// OpenFly — Sol AI (Phase 1 placeholder).
// Per Q-5: Sol Phase 1 = trợ lý thông báo thông minh, KHÔNG chat realtime. The full
// chat artwork (design's screens-sol.jsx / desktop-sol.jsx) is kept for Phase 2.
// One responsive editorial screen, on-brand with Sol's identity (ink avatar + rust "S").
import { useNavigate } from 'react-router-dom'
import { T } from '../../theme/tokens'
import { Eyebrow, Ic } from '../../components/ui'
import { Container } from '../../shell/Container'
import { useViewport } from '../../shell/useViewport'

// Capability teaser — the quick-reply prompts from the Phase-2 chat, shown disabled.
const PREVIEW = [
  'Tìm vé HAN → DAD tuần sau',
  'Đổi giờ booking OFY8K2',
  'Săn vé Phú Quốc dưới 1tr',
  'Sân bay Tân Sơn Nhất có gì',
]

export function SolPlaceholder() {
  const navigate = useNavigate()
  const { isDesktop } = useViewport()
  return (
    <div style={{ background: T.canvas, minHeight: '100%', display: 'flex', alignItems: isDesktop ? 'center' : 'flex-start', justifyContent: 'center' }}>
      <Container max={isDesktop ? 760 : 560} style={{ padding: isDesktop ? '48px 40px' : '44px 24px 56px', textAlign: 'center' }}>
        {/* Sol avatar — ink disc, rust serif "S", live dot, concentric halo */}
        <div style={{ width: isDesktop ? 88 : 76, height: isDesktop ? 88 : 76, borderRadius: '50%', background: T.inkBlock, margin: '0 auto 28px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <span style={{ fontFamily: T.serif, fontSize: isDesktop ? 40 : 34, color: T.rustSoft, fontStyle: 'italic', fontWeight: 600, marginTop: -2 }}>S</span>
          <span style={{ position: 'absolute', bottom: 4, right: 4, width: 14, height: 14, borderRadius: '50%', background: T.green, border: `3px solid ${T.inkBlock}` }} />
          <div style={{ position: 'absolute', inset: -10, borderRadius: '50%', border: `1px solid ${T.line2}` }} />
          <div style={{ position: 'absolute', inset: -22, borderRadius: '50%', border: `1px solid ${T.line}`, opacity: 0.5 }} />
        </div>

        <Eyebrow dash={false} color={T.rust} style={{ marginBottom: 14 }}>Trợ lý AI · Sol</Eyebrow>
        <h1 style={{ fontFamily: T.serif, fontSize: isDesktop ? 40 : 30, fontWeight: 300, letterSpacing: '-1.4px', lineHeight: 1.06, color: T.ink, margin: '0 0 14px' }}>
          Sol đang <em style={{ color: T.rust, fontWeight: 500 }}>hoàn thiện</em>.
        </h1>
        <p style={{ fontFamily: T.serif, fontSize: isDesktop ? 16 : 14, color: T.ink2, fontStyle: 'italic', lineHeight: 1.6, margin: '0 auto', maxWidth: 460 }}>
          Hiện tại Sol giúp bạn qua các thông báo thông minh ✨ — theo dõi giá, nhắc giữ chỗ và gợi ý chuyến hợp với bạn. Trò chuyện trực tiếp với Sol sẽ sớm có mặt.
        </p>

        {/* Phase-2 teaser — preserved chat prompts, non-interactive */}
        <div style={{ marginTop: 30, display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
          {PREVIEW.map((c) => (
            <span key={c} style={{ padding: '8px 14px', borderRadius: 100, background: T.paper, border: `1px solid ${T.line}`, fontFamily: T.serif, fontSize: 12.5, color: T.ink3, fontStyle: 'italic' }}>“{c}”</span>
          ))}
        </div>
        <div style={{ fontFamily: T.sans, fontSize: 10.5, color: T.ink4, letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: 600, marginTop: 14 }}>Sắp ra mắt</div>

        {/* CTAs — what Sol does for you today */}
        <div style={{ marginTop: 32, display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/inbox')} style={{ padding: '14px 22px', background: T.ink, color: T.paper, border: 'none', borderRadius: 4, fontFamily: T.serif, fontSize: 14, fontWeight: 500, letterSpacing: '-0.2px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Ic.bell size={15} stroke={T.paper} /> Mở hộp thư
          </button>
          <button onClick={() => navigate('/hunter')} style={{ padding: '14px 22px', background: 'transparent', color: T.ink, border: `1px solid ${T.line2}`, borderRadius: 4, fontFamily: T.serif, fontSize: 14, fontWeight: 500, letterSpacing: '-0.2px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Ic.radar size={15} stroke={T.ink} /> Săn vé tự động
          </button>
        </div>
      </Container>
    </div>
  )
}
