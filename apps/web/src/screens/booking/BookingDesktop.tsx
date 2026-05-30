// OpenFly — Booking (desktop, all-in-one). "Tiếp tục thanh toán" holds the booking
// (POST /bookings/hold) then goes to /payment/:bookingId. Voucher application is deferred (Q-59),
// so the total shown is the real offer price = the backend totalSellPrice that will be charged.
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { T, fmtVnd } from '../../theme/tokens'
import { Eyebrow, Price, AirlineBadge, Btn, SectionLabel, Ic } from '../../components/ui'
import { Container } from '../../shell/Container'
import { SummaryRow } from './parts'
import { AIRLINES } from '../../data/mock'
import type { Flight } from '../../data/mock'
import { useSavedPassengers } from '../../data/useProfile'
import { useHoldBooking } from '../../data/useHoldBooking'
import { useAuthStore } from '../../stores/auth'
import { apiEnabled } from '../../lib/api/client'

function FormField({ label, value, half }: { label: string; value: string; half?: boolean }) {
  return (
    <div style={{ flex: half ? '1 1 calc(50% - 8px)' : '1 1 100%' }}>
      <div style={{ fontFamily: T.sans, fontSize: 10.5, fontWeight: 600, letterSpacing: 1.4, textTransform: 'uppercase', color: T.ink3, marginBottom: 7 }}>{label}</div>
      <div style={{ padding: '13px 16px', borderRadius: 8, background: T.paper2, border: `1px solid ${T.line}`, fontFamily: T.serif, fontSize: 16, color: T.ink }}>{value}</div>
    </div>
  )
}

function EditField({ label, value, onChange, half }: { label: string; value: string; onChange: (v: string) => void; half?: boolean }) {
  return (
    <div style={{ flex: half ? '1 1 calc(50% - 8px)' : '1 1 100%' }}>
      <div style={{ fontFamily: T.sans, fontSize: 10.5, fontWeight: 600, letterSpacing: 1.4, textTransform: 'uppercase', color: T.ink3, marginBottom: 7 }}>{label}</div>
      <input value={value} onChange={(e) => onChange(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '13px 16px', borderRadius: 8, background: T.paper2, border: `1px solid ${T.line}`, fontFamily: T.serif, fontSize: 16, color: T.ink, outline: 'none' }} />
    </div>
  )
}

export function BookingDesktop({ flight: f }: { flight: Flight }) {
  const navigate = useNavigate()
  const a = AIRLINES[f.airline]
  const user = useAuthStore((s) => s.user)
  const passengers = useSavedPassengers().data ?? []
  const hold = useHoldBooking()
  const [selPax, setSelPax] = useState('')
  const [email, setEmail] = useState(user?.email ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  useEffect(() => {
    if (!selPax && passengers.length > 0) setSelPax((passengers.find((x) => x.primary) ?? passengers[0]).id)
  }, [passengers, selPax])
  const p = passengers.find((x) => x.id === selPax)
  const total = f.price

  const onPay = () => {
    if (hold.isPending || !p) return
    if (!apiEnabled) {
      navigate('/payment/mock', { state: { total } })
      return
    }
    hold.mutate({ flight: f, passengers: [p], email, phone }, { onSuccess: (b) => navigate(`/payment/${b.id}`) })
  }

  return (
    <div style={{ background: T.canvas, minHeight: '100%', paddingBottom: 80 }}>
      <Container max={1140} style={{ paddingTop: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
          <button onClick={() => navigate(`/detail/${f.id}`)} aria-label="Quay lại" style={{ width: 42, height: 42, borderRadius: '50%', background: 'transparent', border: `1px solid ${T.line2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Ic.back size={17} stroke={T.ink} /></button>
          <Eyebrow>Đặt vé · Bước 1 / 2</Eyebrow>
        </div>
        <h1 style={{ fontFamily: T.serif, fontSize: 36, fontWeight: 400, letterSpacing: '-1.4px', color: T.ink, margin: '6px 0 26px 56px' }}>Thông tin hành khách</h1>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 28, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ background: T.paper, border: `1px solid ${T.line}`, borderRadius: 12, padding: 26 }}>
              <SectionLabel num="01" title="Chọn hành khách đã lưu" />
              <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
                {passengers.map((sp) => (
                  <button key={sp.id} onClick={() => setSelPax(sp.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px 10px 10px', borderRadius: 100, cursor: 'pointer', background: selPax === sp.id ? T.ink : 'transparent', border: `1px solid ${selPax === sp.id ? T.ink : T.line2}` }}>
                    <span style={{ width: 30, height: 30, borderRadius: '50%', background: selPax === sp.id ? T.rust : T.paper2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.serif, fontSize: 13, fontStyle: 'italic', fontWeight: 600, color: selPax === sp.id ? '#F5F1EA' : T.ink2 }}>{sp.initials}</span>
                    <span style={{ fontFamily: T.serif, fontSize: 15, color: selPax === sp.id ? T.paper : T.ink, fontWeight: 500 }}>{sp.name}{sp.child ? ' (trẻ em)' : ''}</span>
                  </button>
                ))}
                {passengers.length === 0 && <div style={{ fontFamily: T.serif, fontSize: 14, color: T.ink3, fontStyle: 'italic' }}>Chưa có hành khách đã lưu. Thêm trong mục Tài khoản.</div>}
              </div>
            </div>
            <div style={{ background: T.paper, border: `1px solid ${T.line}`, borderRadius: 12, padding: 26 }}>
              <SectionLabel num="02" title="Thông tin chi tiết" />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 18 }}>
                <FormField label="Họ và tên" value={p?.name ?? '—'} />
                <FormField label="Giới tính" value={p?.gender || '—'} half />
                <FormField label="Ngày sinh" value={p?.dob ?? '—'} half />
                <FormField label="CCCD / Hộ chiếu" value={p?.cccd ?? '—'} />
              </div>
            </div>
            <div style={{ background: T.paper, border: `1px solid ${T.line}`, borderRadius: 12, padding: 26 }}>
              <SectionLabel num="03" title="Liên hệ nhận vé" />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 18 }}>
                <EditField label="Email" value={email} onChange={setEmail} half />
                <EditField label="Số điện thoại" value={phone} onChange={setPhone} half />
              </div>
              <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 10, fontFamily: T.serif, fontSize: 14, color: T.ink2, fontStyle: 'italic' }}>
                <Ic.check size={16} stroke={T.green} /> Vé điện tử sẽ gửi qua Email và Zalo ngay sau thanh toán.
              </div>
            </div>
          </div>
          <div style={{ position: 'sticky', top: 86, background: T.paper, border: `1px solid ${T.line2}`, borderRadius: 12, padding: 26 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <AirlineBadge code={f.airline} size={38} color={T.ink2} />
              <div>
                <div style={{ fontFamily: T.serif, fontSize: 15, fontWeight: 500, color: T.ink }}>{f.from} → {f.to}</div>
                <div style={{ fontFamily: T.sans, fontSize: 11, color: T.ink3, marginTop: 2 }}>{a.short} · {f.depart}–{f.arrive}</div>
              </div>
            </div>
            <div style={{ height: 1, background: T.line, marginBottom: 8 }} />
            <SummaryRow label="Giá vé cơ bản" value={`${fmtVnd(f.basePrice)}đ`} />
            <SummaryRow label="Thuế & phí" value={`${fmtVnd(f.tax + f.fee)}đ`} />
            <div style={{ height: 1, background: T.line, margin: '10px 0' }} />
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 18 }}>
              <span style={{ fontFamily: T.serif, fontSize: 17, fontWeight: 500, color: T.ink }}>Tổng cộng</span>
              <Price value={total} size={30} />
            </div>
            <Btn onClick={onPay} full size="lg" icon={<Ic.arrow size={16} stroke={T.paper} />}>{hold.isPending ? 'Đang giữ chỗ…' : 'Tiếp tục thanh toán'}</Btn>
            {hold.isError && <div style={{ marginTop: 12, fontFamily: T.serif, fontSize: 12.5, color: T.red, fontStyle: 'italic', textAlign: 'center' }}>Không giữ chỗ được — {hold.error?.message}</div>}
          </div>
        </div>
      </Container>
    </div>
  )
}
