// OpenFly — Payment success (responsive). Real flow passes { orderCode, amountVnd, bookingId };
// the route/PNR come from the held booking. Mock flow falls back to { total, pnr }.
import type { ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { T, fmtVnd } from '../../theme/tokens'
import { Eyebrow, Ic } from '../../components/ui'
import { useBooking } from '../../data/useBookings'

function NextStepRow({ icon, label, sub }: { icon: ReactNode; label: string; sub: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', background: T.paper, border: `1px solid ${T.line}`, borderRadius: 6 }}>
      <div style={{ width: 32, height: 32, borderRadius: 4, background: T.paper2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: T.serif, fontSize: 14, color: T.ink, fontWeight: 500 }}>{label}</div>
        <div style={{ fontFamily: T.sans, fontSize: 11, color: T.ink3, marginTop: 1 }}>{sub}</div>
      </div>
      <Ic.check size={14} stroke={T.green} />
    </div>
  )
}

export function PaymentSuccess() {
  const navigate = useNavigate()
  const { state } = useLocation() as {
    state: { total?: number; pnr?: string; orderCode?: string; amountVnd?: number; bookingId?: string } | null
  }
  const { data: booking } = useBooking(state?.bookingId)
  const pnr = booking?.pnr ?? state?.orderCode ?? state?.pnr ?? 'OFY8K2'
  const amountText =
    state?.amountVnd != null ? `${state.amountVnd.toLocaleString('vi-VN')}đ` : `${fmtVnd(state?.total ?? 940)}đ`
  const contactEmail = booking?.contact.email || 'email của bạn'

  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px 48px' }}>
      <div style={{ width: '100%', maxWidth: 560 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 84, height: 84, borderRadius: '50%', background: T.inkBlock, margin: '0 auto 28px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <Ic.check size={36} stroke={T.rustSoft} sw={2} />
            <div style={{ position: 'absolute', inset: -10, borderRadius: '50%', border: `1px solid ${T.line2}` }} />
            <div style={{ position: 'absolute', inset: -22, borderRadius: '50%', border: `1px solid ${T.line}`, opacity: 0.5 }} />
          </div>
          <Eyebrow dash={false} color={T.green} style={{ marginBottom: 14 }}>Đã xác nhận</Eyebrow>
          <h1 style={{ fontFamily: T.serif, fontSize: 30, fontWeight: 400, letterSpacing: '-1.1px', lineHeight: 1.05, color: T.ink, margin: '0 0 12px' }}>
            Vé của bạn đã <em style={{ color: T.rust, fontWeight: 500 }}>sẵn sàng</em>.
          </h1>
          <p style={{ fontFamily: T.serif, fontSize: 14, color: T.ink3, fontStyle: 'italic', lineHeight: 1.55, margin: 0 }}>
            Vé điện tử đã gửi tới email và Zalo của bạn. Chúc bạn một chuyến bay nhẹ nhõm.
          </p>
        </div>

        <div style={{ marginTop: 32, background: T.paper, border: `1px solid ${T.line}`, borderRadius: 8, padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontFamily: T.sans, fontSize: 10, color: T.ink3, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 600 }}>Mã đặt chỗ</div>
              <div style={{ fontFamily: T.mono, fontSize: 22, color: T.ink, fontWeight: 500, marginTop: 6, letterSpacing: 2 }}>{pnr}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: T.sans, fontSize: 10, color: T.ink3, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 600 }}>Đã thanh toán</div>
              <div style={{ fontFamily: T.serif, fontSize: 20, fontWeight: 500, color: T.ink, marginTop: 6, letterSpacing: '-0.4px' }}>{amountText}</div>
            </div>
          </div>
          <div style={{ height: 1, background: T.line, margin: '16px 0' }} />
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontFamily: T.serif, fontSize: 18, fontWeight: 500, color: T.ink, letterSpacing: '-0.4px' }}>{booking?.from ?? 'HAN'}</span>
            <Ic.arrow size={12} stroke={T.ink3} />
            <span style={{ fontFamily: T.serif, fontSize: 18, fontWeight: 500, color: T.ink, letterSpacing: '-0.4px' }}>{booking?.to ?? 'DAD'}</span>
            <span style={{ fontFamily: T.serif, fontSize: 12, color: T.ink3, fontStyle: 'italic', marginLeft: 8 }}>
              {booking ? `${booking.dateLabel} · ${booking.number} · ${booking.depart}` : 'CN, 15 thg 6 · VJ513 · 07:25'}
            </span>
          </div>
        </div>

        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <NextStepRow icon={<Ic.send size={16} stroke={T.ink2} />} label="Đã gửi vé qua email" sub={contactEmail} />
          <NextStepRow icon={<Ic.chat size={16} stroke={T.ink2} />} label="Đã gửi vé qua Zalo" sub="OpenFly OA" />
          <NextStepRow icon={<Ic.cal size={16} stroke={T.ink2} />} label="Nhắc check-in" sub="Chúng tôi sẽ nhắc trước 24h" />
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
          <button onClick={() => navigate('/')} style={{ padding: '15px 18px', background: 'transparent', border: `1px solid ${T.line2}`, borderRadius: 4, fontFamily: T.serif, fontSize: 14, fontWeight: 500, color: T.ink, letterSpacing: '-0.2px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Về trang chủ
          </button>
          <button onClick={() => navigate('/trips')} style={{ flex: 1, padding: '15px', background: T.ink, color: T.paper, border: 'none', borderRadius: 4, fontFamily: T.serif, fontSize: 14, fontWeight: 500, letterSpacing: '-0.2px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            Xem vé của tôi <Ic.arrow size={14} stroke={T.paper} />
          </button>
        </div>
      </div>
    </div>
  )
}
