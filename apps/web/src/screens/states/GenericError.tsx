// OpenFly — generic error state (backend down / network fail). Reusable fallback
// for any failed query. Copy + structure from the Lần 6 spec.
import { T } from '../../theme/tokens'
import { Sunmark, Eyebrow } from '../../components/ui'

export function GenericError({ onRetry, onContactSol }: { onRetry?: () => void; onContactSol?: () => void }) {
  return (
    <div style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 40px', textAlign: 'center' }}>
      <div style={{ opacity: 0.3 }}><Sunmark size={56} /></div>
      <Eyebrow color={T.rust} style={{ marginTop: 26 }}>Lỗi kết nối</Eyebrow>
      <h2 style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 500, letterSpacing: '-0.6px', color: T.ink, margin: '14px 0 10px', lineHeight: 1.2 }}>
        Sol đang gặp sự cố tạm thời.
      </h2>
      <p style={{ fontFamily: T.serif, fontSize: 14, color: T.ink3, fontStyle: 'italic', lineHeight: 1.55, margin: 0, maxWidth: 300 }}>
        Mạng có vấn đề hoặc hệ thống đang bảo trì. Bạn thử lại sau ít phút nhé.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 26, width: 240 }}>
        <button onClick={onRetry} style={{ padding: '14px', background: T.ink, color: T.paper, border: 'none', borderRadius: 4, fontFamily: T.serif, fontSize: 14, fontWeight: 500, letterSpacing: '-0.2px', cursor: 'pointer' }}>
          Thử lại
        </button>
        <button onClick={onContactSol} style={{ padding: '12px', background: 'transparent', border: `1px solid ${T.line2}`, borderRadius: 4, fontFamily: T.serif, fontSize: 13, fontWeight: 500, color: T.ink2, letterSpacing: '-0.2px', cursor: 'pointer' }}>
          Báo Sol
        </button>
      </div>
    </div>
  )
}
