// OpenFly — Booking detail (desktop), ported from desktop-trips.jsx BookingDetailPage.
import { useNavigate } from 'react-router-dom'
import { T, fmtVnd } from '../../theme/tokens'
import { Eyebrow, Price, AirlineBadge, Btn, Ic } from '../../components/ui'
import { Container } from '../../shell/Container'
import { SummaryRow } from '../booking/parts'
import { AIRLINES, AIRPORTS } from '../../data/mock'
import type { Booking } from '../../data/mock'

const STATUS: Record<Booking['status'], { label: string; color: string }> = {
  confirmed: { label: 'Đã xác nhận', color: T.green },
  holding: { label: 'Đang giữ chỗ', color: T.amber },
  completed: { label: 'Đã hoàn thành', color: T.ink3 },
  cancelled: { label: 'Đã hủy', color: T.red },
}

export function BookingDetailDesktop({ booking: b }: { booking: Booking }) {
  const navigate = useNavigate()
  const a = AIRLINES[b.airline]
  const a1 = AIRPORTS[b.from]
  const a2 = AIRPORTS[b.to]
  const sm = STATUS[b.status]
  const holding = b.status === 'holding'

  return (
    <div style={{ background: T.canvas, minHeight: '100%', paddingBottom: 80 }}>
      <Container max={1100} style={{ paddingTop: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <button onClick={() => navigate('/trips')} aria-label="Quay lại" style={{ width: 42, height: 42, borderRadius: '50%', background: 'transparent', border: `1px solid ${T.line2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Ic.back size={17} stroke={T.ink} /></button>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <span style={{ fontFamily: T.serif, fontSize: 28, fontWeight: 500, color: T.ink, letterSpacing: '-1px' }}>{a1.city} → {a2.city}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: T.sans, fontSize: 12, fontWeight: 600, color: sm.color }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: sm.color }} />{sm.label}</span>
            </div>
            <div style={{ fontFamily: T.sans, fontSize: 13, color: T.ink3, marginTop: 4 }}>{b.dateLabel} · Mã đặt chỗ <em style={{ color: T.ink2, fontStyle: 'normal', fontWeight: 600 }}>{b.pnr}</em></div>
          </div>
        </div>

        {holding && (
          <div style={{ background: T.rustTint, border: `1px solid ${T.rust}`, borderRadius: 12, padding: '18px 24px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 16 }}>
            <Ic.clock size={22} stroke={T.rust} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: T.serif, fontSize: 16, fontWeight: 500, color: T.ink }}>Đang giữ chỗ — còn 2g 14p để hoàn tất</div>
              <div style={{ fontFamily: T.serif, fontSize: 13.5, color: T.ink2, fontStyle: 'italic', marginTop: 2 }}>Thanh toán trước {(b.holdExpiresAt || '').replace('giữ đến ', '')} để giữ giá này.</div>
            </div>
            <Btn onClick={() => navigate(`/payment/${b.id}`)} variant="rust">Thanh toán ngay</Btn>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 28, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ background: T.paper, border: `1px solid ${T.line}`, borderRadius: 12, padding: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
                <AirlineBadge code={b.airline} size={42} color={T.ink2} />
                <div style={{ flex: 1 }}><div style={{ fontFamily: T.serif, fontSize: 17, fontWeight: 500, color: T.ink }}>{a.short}</div><div style={{ fontFamily: T.sans, fontSize: 12, color: T.ink3, marginTop: 2 }}>{b.number} · {b.aircraft}</div></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div><div style={{ fontFamily: T.serif, fontSize: 32, fontWeight: 500, color: T.ink, letterSpacing: '-1px', lineHeight: 1 }}>{b.depart}</div><div style={{ fontFamily: T.sans, fontSize: 12, fontWeight: 600, color: T.ink3, marginTop: 5 }}>{b.from} · {a1.city}</div></div>
                <div style={{ flex: 1, textAlign: 'center' }}><div style={{ fontFamily: T.sans, fontSize: 11, color: T.ink3, marginBottom: 4 }}>{b.duration} · bay thẳng</div><div style={{ display: 'flex', alignItems: 'center' }}><div style={{ flex: 1, height: 1, background: T.line2 }} /><Ic.plane2 size={13} stroke={T.rust} sw={1.6} /><div style={{ flex: 1, height: 1, background: T.line2 }} /></div></div>
                <div style={{ textAlign: 'right' }}><div style={{ fontFamily: T.serif, fontSize: 32, fontWeight: 500, color: T.ink, letterSpacing: '-1px', lineHeight: 1 }}>{b.arrive}</div><div style={{ fontFamily: T.sans, fontSize: 12, fontWeight: 600, color: T.ink3, marginTop: 5 }}>{b.to} · {a2.city}</div></div>
              </div>
            </div>
            <div style={{ background: T.paper, border: `1px solid ${T.line}`, borderRadius: 12, padding: 28 }}>
              <Eyebrow style={{ marginBottom: 16 }}>Hành khách · {b.pax.length}</Eyebrow>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {b.pax.map((p, i) => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: i < b.pax.length - 1 ? `1px solid ${T.line}` : 'none' }}>
                    <span style={{ width: 38, height: 38, borderRadius: '50%', background: T.paper2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.serif, fontSize: 14, color: T.ink2, fontStyle: 'italic', fontWeight: 600 }}>{p.initials}</span>
                    <div style={{ flex: 1 }}><div style={{ fontFamily: T.serif, fontSize: 16, fontWeight: 500, color: T.ink }}>{p.name}</div><div style={{ fontFamily: T.sans, fontSize: 11.5, color: T.ink3, marginTop: 1 }}>{p.gender} · {p.dob}</div></div>
                    <div style={{ textAlign: 'right' }}><div style={{ fontFamily: T.sans, fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: T.ink3 }}>Ghế</div><div style={{ fontFamily: T.serif, fontSize: 16, fontWeight: 500, color: b.seats[i] === '—' ? T.ink3 : T.ink, marginTop: 2 }}>{b.seats[i]}</div></div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: T.paper, border: `1px solid ${T.line}`, borderRadius: 12, padding: 28 }}>
              <Eyebrow style={{ marginBottom: 16 }}>Hành lý & dịch vụ</Eyebrow>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[['Xách tay', b.baggage.carry] as const, ['Ký gửi', b.baggage.check] as const].map(([t, v]) => (
                  <div key={t} style={{ display: 'flex', gap: 12, padding: 14, borderRadius: 8, background: T.paper2 }}><Ic.bag size={20} stroke={T.ink2} /><div><div style={{ fontFamily: T.serif, fontSize: 14, fontWeight: 500, color: T.ink }}>{t}</div><div style={{ fontFamily: T.sans, fontSize: 12, color: T.ink3, marginTop: 2 }}>{v}</div></div></div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ position: 'sticky', top: 86, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {!holding && (
              <div style={{ background: T.paper, border: `1px solid ${T.ink}`, borderRadius: 12, padding: 24, textAlign: 'center' }}>
                <div style={{ width: 110, height: 110, borderRadius: 12, background: T.paper2, border: `1px solid ${T.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}><Ic.qr size={66} stroke={T.ink} sw={1.1} /></div>
                <div style={{ fontFamily: T.mono, fontSize: 16, color: T.rust, letterSpacing: 1, marginTop: 14, fontWeight: 500 }}>{b.pnr}</div>
                <div style={{ fontFamily: T.sans, fontSize: 11.5, color: T.ink3, marginTop: 4 }}>Quét tại quầy check-in</div>
                <Btn variant="secondary" full size="md" style={{ marginTop: 16 }} icon={<Ic.download size={16} stroke={T.ink} />}>Tải vé PDF</Btn>
              </div>
            )}
            <div style={{ background: T.paper, border: `1px solid ${T.line}`, borderRadius: 12, padding: 24 }}>
              <Eyebrow dash={false} style={{ marginBottom: 14 }}>Thanh toán</Eyebrow>
              <SummaryRow label="Giá vé" value={`${fmtVnd(b.basePrice)}đ`} />
              <SummaryRow label="Thuế & phí" value={`${fmtVnd(b.tax + b.fee)}đ`} />
              {b.voucher && <SummaryRow label={b.voucher.code} value={`${fmtVnd(b.voucher.value)}đ`} highlight />}
              <div style={{ height: 1, background: T.line, margin: '10px 0' }} />
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: T.serif, fontSize: 16, fontWeight: 500, color: T.ink }}>Tổng</span>
                <Price value={b.total} size={26} />
              </div>
              {b.payment.method !== '—' && <div style={{ fontFamily: T.sans, fontSize: 11.5, color: T.ink3, marginTop: 10 }}>Đã thanh toán qua {b.payment.method} {b.payment.last4} · {b.payment.paidAt}</div>}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Btn variant="ghost" size="sm" full>Đổi vé</Btn>
              <Btn variant="ghost" size="sm" full>Hủy vé</Btn>
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
}
