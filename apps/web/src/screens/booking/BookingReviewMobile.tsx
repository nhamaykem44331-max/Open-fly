// OpenFly — Booking step 2 (mobile): review & confirm. The "Thanh toán" CTA holds the booking
// (POST /bookings/hold) then goes to /payment/:bookingId. Voucher application is deferred (Q-59),
// so the review shows the real offer price = the backend totalSellPrice that will be charged.
import { useNavigate } from 'react-router-dom'
import { T, fmtVnd } from '../../theme/tokens'
import { Eyebrow, Price } from '../../components/ui'
import type { Flight } from '../../data/mock'
import { useBookingForm } from '../../stores/bookingForm'
import { useHoldBooking } from '../../data/useHoldBooking'
import { apiEnabled } from '../../lib/api/client'
import { StepHeader, MiniFlightCard, SummaryRow, HoldError } from './parts'

export function BookingReviewMobile({ flight: f }: { flight: Flight }) {
  const navigate = useNavigate()
  const { passengers, email, phone } = useBookingForm()
  const hold = useHoldBooking()
  const total = f.price

  const onPay = () => {
    if (hold.isPending) return
    if (!apiEnabled) {
      navigate('/payment/mock', { state: { total } })
      return
    }
    hold.mutate(
      { flight: f, passengers, email, phone },
      { onSuccess: (b) => navigate(`/payment/${b.id}`) },
    )
  }

  if (hold.isError) return <HoldError error={hold.error} flight={f} onRetry={() => hold.reset()} />

  return (
    <div style={{ background: T.paper, minHeight: '100%' }}>
      <StepHeader label="Xác nhận booking" step={2} />
      <div style={{ padding: '4px 20px 0' }}>
        <h1 style={{ fontFamily: T.serif, fontSize: 26, fontWeight: 400, letterSpacing: '-0.9px', lineHeight: 1.1, color: T.ink, margin: '14px 0 18px' }}>
          Một lần <em style={{ color: T.rust, fontWeight: 500 }}>nhìn lại</em>.
        </h1>

        <Eyebrow>Chuyến bay</Eyebrow>
        <div style={{ marginTop: 12, marginBottom: 24 }}><MiniFlightCard flight={f} /></div>

        <Eyebrow>Hành khách</Eyebrow>
        <div style={{ marginTop: 12, marginBottom: 24, background: T.paper, border: `1px solid ${T.line}`, borderRadius: 6, overflow: 'hidden' }}>
          {passengers.map((p, i) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderTop: i > 0 ? `1px solid ${T.line}` : 'none' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: T.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.serif, fontSize: 14, fontWeight: 500, color: T.rustSoft, fontStyle: 'italic' }}>{p.initials}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: T.serif, fontSize: 14, color: T.ink, fontWeight: 500 }}>{p.name}</div>
                <div style={{ fontFamily: T.sans, fontSize: 11, color: T.ink3, marginTop: 2 }}>{p.gender} · {p.dob}{p.child ? ' · Trẻ em' : p.cccd && p.cccd !== '—' ? ` · CCCD ${p.cccd}` : ''}</div>
              </div>
            </div>
          ))}
        </div>

        <Eyebrow>Liên hệ</Eyebrow>
        <div style={{ marginTop: 12, marginBottom: 24, background: T.paper, border: `1px solid ${T.line}`, borderRadius: 6, padding: '12px 18px' }}>
          <SummaryRow label="Email" value={email} />
          <div style={{ height: 1, background: T.line, margin: '4px 0' }} />
          <SummaryRow label="Số điện thoại" value={phone} />
        </div>

        <Eyebrow>Chi tiết giá</Eyebrow>
        <div style={{ marginTop: 12, background: T.paper, border: `1px solid ${T.line}`, borderRadius: 6, padding: '14px 18px' }}>
          <SummaryRow label={`Giá vé · ${passengers.length || 1} khách`} value={`${fmtVnd(f.basePrice)}đ`} />
          <SummaryRow label="Thuế & lệ phí sân bay" value={`${fmtVnd(f.tax)}đ`} />
          <SummaryRow label="Phí dịch vụ OpenFly" value={`${fmtVnd(f.fee)}đ`} />
          <div style={{ height: 1, background: T.line, margin: '10px 0' }} />
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: T.serif, fontSize: 15, color: T.ink, fontWeight: 500 }}>Tổng thanh toán</span>
            <Price value={total} size={26} />
          </div>
        </div>

        <div style={{ marginTop: 18, padding: 14, borderRadius: 6, background: T.paper2, border: `1px solid ${T.line}`, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ width: 26, height: 26, borderRadius: '50%', background: T.ink, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: T.serif, fontSize: 13, color: T.rustSoft, fontStyle: 'italic', fontWeight: 600, marginTop: -1 }}>S</span>
          </div>
          <p style={{ margin: 0, fontFamily: T.serif, fontSize: 13, color: T.ink2, fontStyle: 'italic', lineHeight: 1.5 }}>
            Vé hạng phổ thông thường không hoàn được sau khi đặt; đổi vé có thể mất phí theo điều kiện của hãng.
          </p>
        </div>

      </div>

      <div style={{ borderTop: `1px solid ${T.line}`, padding: '14px 20px 20px', marginTop: 24 }}>
        <button onClick={onPay} disabled={hold.isPending} style={{ width: '100%', padding: '17px', background: T.ink, color: T.paper, border: 'none', borderRadius: 4, fontFamily: T.serif, fontSize: 15, fontWeight: 500, letterSpacing: '-0.2px', cursor: hold.isPending ? 'default' : 'pointer', opacity: hold.isPending ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          {hold.isPending ? 'Đang giữ chỗ…' : <>Thanh toán <span style={{ opacity: 0.5 }}>·</span> <Price value={total} size={15} color={T.paper} /></>}
        </button>
        <div style={{ textAlign: 'center', fontFamily: T.serif, fontSize: 11, color: T.ink3, fontStyle: 'italic', marginTop: 8 }}>
          Booking sẽ được giữ chỗ 15 phút trong khi thanh toán.
        </div>
      </div>
    </div>
  )
}
