import { T } from '../theme/tokens'
import { Wordmark } from '../components/ui'
import { Container } from './Container'

// Desktop marketing footer (ported from desktop-shell.jsx). Always on inkBlock.
const COLS = [
  { h: 'Sản phẩm', links: ['Tìm vé', 'Săn vé tự động', 'Sol AI', 'Ưu đãi', 'Dành cho đại lý'] },
  { h: 'Công ty', links: ['Về OpenFly', 'Triết lý thiết kế', 'Tuyển dụng', 'Báo chí', 'Liên hệ'] },
  { h: 'Hỗ trợ', links: ['Trung tâm trợ giúp', 'Hoàn / đổi vé', 'Điều khoản', 'Bảo mật', 'Câu hỏi thường gặp'] },
]

export function Footer() {
  return (
    <footer style={{ background: T.inkBlock, color: T.onInk }}>
      <Container max={1320} style={{ padding: '64px 40px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: 40 }}>
          <div>
            <Wordmark size={22} onInk />
            <p style={{ fontFamily: T.serif, fontSize: 15, fontStyle: 'italic', color: 'rgba(245,241,234,0.6)', lineHeight: 1.6, margin: '18px 0 0', maxWidth: 280 }}>
              Bay trong nắng mới. Đặt vé minh bạch, để trợ lý săn giá tốt cho bạn — 24/7.
            </p>
          </div>
          {COLS.map((col) => (
            <div key={col.h}>
              <div style={{ fontFamily: T.sans, fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(245,241,234,0.5)', marginBottom: 16 }}>{col.h}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                {col.links.map((l) => (
                  <span key={l} style={{ fontFamily: T.serif, fontSize: 14.5, color: 'rgba(245,241,234,0.78)', cursor: 'pointer' }}>{l}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 48, paddingTop: 24, borderTop: '1px solid rgba(245,241,234,0.12)' }}>
          <span style={{ fontFamily: T.sans, fontSize: 12, color: 'rgba(245,241,234,0.45)' }}>© 2026 OpenFly · Bay Trong Nắng Mới</span>
          <span style={{ fontFamily: T.sans, fontSize: 12, color: 'rgba(245,241,234,0.45)', letterSpacing: 0.3 }}>Tiếng Việt · VND ₫</span>
        </div>
      </Container>
    </footer>
  )
}
