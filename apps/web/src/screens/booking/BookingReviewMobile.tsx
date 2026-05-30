// OpenFly — Booking step 2 (mobile): review & confirm. Ported from screens-booking.jsx.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { T, fmtVnd } from '../../theme/tokens'
import { Eyebrow, Price, Ic } from '../../components/ui'
import type { Flight } from '../../data/mock'
import { StepHeader, MiniFlightCard, SummaryRow } from './parts'

export function BookingReviewMobile({ flight: f }: { flight: Flight }) {
  const navigate = useNavigate()
  const [voucher, setVoucher] = useState('OPENFLY150')
  const discount = voucher ? 150 : 0
  const total = f.price - discount

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
        <div style={{ marginTop: 12, marginBottom: 24, background: T.paper, border: `1px solid ${T.line}`, borderRadius: 6, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: T.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.serif, fontSize: 14, fontWeight: 500, color: T.rustSoft, fontStyle: 'italic' }}>AN</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: T.serif, fontSize: 14, color: T.ink, fontWeight: 500 }}>Đào Andy</div>
            <div style={{ fontFamily: T.sans, fontSize: 11, color: T.ink3, marginTop: 2 }}>Nam · 04/04/1995 · CCCD 001234567890</div>
          </div>
        </div>

        <Eyebrow>Liên hệ</Eyebrow>
        <div style={{ marginTop: 12, marginBottom: 24, background: T.paper, border: `1px solid ${T.line}`, borderRadius: 6, padding: '12px 18px' }}>
          <SummaryRow label="Email" value="andy.dao@gmail.com" />
          <div style={{ height: 1, background: T.line, margin: '4px 0' }} />
          <SummaryRow label="Số điện thoại" value="+84 938 121 234" />
        </div>

        <Eyebrow>Mã ưu đãi</Eyebrow>
        <button onClick={() => setVoucher(voucher ? '' : 'OPENFLY150')} style={{ width: '100%', marginTop: 12, marginBottom: 24, background: voucher ? T.ink : T.paper2, border: `1px solid ${voucher ? T.ink : T.line}`, borderRadius: 6, padding: '14px 18px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 32, height: 32, borderRadius: 4, flexShrink: 0, background: voucher ? T.rust : T.paper, border: voucher ? 'none' : `1px solid ${T.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.serif, fontSize: 12, color: voucher ? T.paper : T.ink3, fontStyle: 'italic', fontWeight: 600 }}>%</div>
          <div style={{ flex: 1 }}>
            {voucher ? (
              <>
                <div style={{ fontFamily: T.serif, fontSize: 13, fontWeight: 500, color: T.paper, letterSpacing: '-0.2px' }}>OPENFLY150 · Giảm 150.000đ</div>
                <div style={{ fontFamily: T.sans, fontSize: 11, color: T.rustSoft, marginTop: 2 }}>Đã áp dụng</div>
              </>
            ) : (
              <>
                <div style={{ fontFamily: T.serif, fontSize: 13, fontWeight: 500, color: T.ink, letterSpacing: '-0.2px' }}>Chọn mã ưu đãi</div>
                <div style={{ fontFamily: T.sans, fontSize: 11, color: T.ink3, marginTop: 2 }}>Bạn có 2 mã khả dụng</div>
              </>
            )}
          </div>
          <Ic.chevron size={12} stroke={voucher ? T.paper : T.ink3} />
        </button>

        <Eyebrow>Chi tiết giá</Eyebrow>
        <div style={{ marginTop: 12, background: T.paper, border: `1px solid ${T.line}`, borderRadius: 6, padding: '14px 18px' }}>
          <SummaryRow label="Giá vé · 1 khách" value={`${fmtVnd(f.basePrice)}đ`} />
          <SummaryRow label="Thuế & lệ phí sân bay" value={`${fmtVnd(f.tax)}đ`} />
          <SummaryRow label="Phí dịch vụ OpenFly" value={`${fmtVnd(f.fee)}đ`} />
          {discount > 0 && <SummaryRow label="Ưu đãi OPENFLY150" value={`-${fmtVnd(discount)}đ`} highlight />}
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
            Vé hạng phổ thông Vietjet không hoàn được sau khi đặt. Đổi vé phí <em style={{ color: T.ink, fontStyle: 'normal', fontWeight: 500 }}>~390.000đ</em>.
          </p>
        </div>
      </div>

      <div style={{ borderTop: `1px solid ${T.line}`, padding: '14px 20px 20px', marginTop: 24 }}>
        <button onClick={() => navigate('/payment', { state: { flightId: f.id, total } })} style={{ width: '100%', padding: '17px', background: T.ink, color: T.paper, border: 'none', borderRadius: 4, fontFamily: T.serif, fontSize: 15, fontWeight: 500, letterSpacing: '-0.2px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          Thanh toán <span style={{ opacity: 0.5 }}>·</span> <Price value={total} size={15} color={T.paper} />
        </button>
        <div style={{ textAlign: 'center', fontFamily: T.serif, fontSize: 11, color: T.ink3, fontStyle: 'italic', marginTop: 8 }}>
          Booking sẽ được giữ chỗ 15 phút trong khi thanh toán.
        </div>
      </div>
    </div>
  )
}
