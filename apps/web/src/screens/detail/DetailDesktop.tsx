// OpenFly — Flight Detail (desktop), ported from desktop-detail.jsx DetailPage.
import { useNavigate } from 'react-router-dom'
import { T, fmtVnd } from '../../theme/tokens'
import { Eyebrow, Price, AirlineBadge, Btn, Ic } from '../../components/ui'
import { Container } from '../../shell/Container'
import { AIRLINES, AIRPORTS } from '../../data/mock'
import type { Flight } from '../../data/mock'

function SummaryRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '7px 0' }}>
      <span style={{ fontFamily: T.serif, fontSize: 14, color: T.ink2 }}>{label}</span>
      <span style={{ fontFamily: T.serif, fontSize: 14.5, color: color || T.ink, fontWeight: 500, letterSpacing: '-0.2px' }}>{value}</span>
    </div>
  )
}

export function DetailDesktop({ flight: f }: { flight: Flight }) {
  const navigate = useNavigate()
  const a = AIRLINES[f.airline]
  const a1 = AIRPORTS[f.from]
  const a2 = AIRPORTS[f.to]

  return (
    <div style={{ background: T.canvas, minHeight: '100%', paddingBottom: 80 }}>
      <Container max={1140} style={{ paddingTop: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
          <button onClick={() => navigate(-1)} aria-label="Quay lại" style={{ width: 42, height: 42, borderRadius: '50%', background: 'transparent', border: `1px solid ${T.line2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Ic.back size={17} stroke={T.ink} /></button>
          <Eyebrow>Chi tiết chuyến bay</Eyebrow>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 28, alignItems: 'start' }}>
          {/* LEFT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ background: T.paper, border: `1px solid ${T.line}`, borderRadius: 12, padding: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
                <AirlineBadge code={f.airline} size={44} color={T.ink2} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: T.serif, fontSize: 19, fontWeight: 500, color: T.ink, letterSpacing: '-0.3px' }}>{a.short}</div>
                  <div style={{ fontFamily: T.sans, fontSize: 12, color: T.ink3, marginTop: 2 }}>{f.number} · {f.aircraft}</div>
                </div>
                <span style={{ padding: '6px 14px', borderRadius: 100, border: `1px solid ${T.line2}`, fontFamily: T.sans, fontSize: 11, fontWeight: 500, color: T.ink3 }}>Bay thẳng</span>
              </div>
              <div style={{ display: 'flex', gap: 18 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: T.ink }} />
                  <div style={{ width: 2, flex: 1, minHeight: 80, background: T.line2, margin: '6px 0' }} />
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: T.rust }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                    <span style={{ fontFamily: T.serif, fontSize: 34, fontWeight: 500, color: T.ink, letterSpacing: '-1.2px', lineHeight: 1 }}>{f.depart}</span>
                    <span style={{ fontFamily: T.sans, fontSize: 12, color: T.ink3 }}>CN, 15 thg 6</span>
                  </div>
                  <div style={{ fontFamily: T.serif, fontSize: 16, color: T.ink, marginTop: 6 }}>{a1.city} <span style={{ color: T.ink3 }}>· {f.from}</span></div>
                  <div style={{ fontFamily: T.sans, fontSize: 12, color: T.ink3, marginTop: 2 }}>{a1.name} · Nhà ga T1</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '18px 0' }}>
                    <Ic.plane2 size={13} stroke={T.rust} sw={1.6} />
                    <span style={{ fontFamily: T.sans, fontSize: 12, color: T.ink3, fontWeight: 500 }}>{f.duration} bay</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                    <span style={{ fontFamily: T.serif, fontSize: 34, fontWeight: 500, color: T.ink, letterSpacing: '-1.2px', lineHeight: 1 }}>{f.arrive}</span>
                    <span style={{ fontFamily: T.sans, fontSize: 12, color: T.ink3 }}>cùng ngày</span>
                  </div>
                  <div style={{ fontFamily: T.serif, fontSize: 16, color: T.ink, marginTop: 6 }}>{a2.city} <span style={{ color: T.ink3 }}>· {f.to}</span></div>
                  <div style={{ fontFamily: T.sans, fontSize: 12, color: T.ink3, marginTop: 2 }}>{a2.name} · Nhà ga quốc nội</div>
                </div>
              </div>
            </div>
            {/* Sol insight */}
            <div style={{ background: T.inkBlock, color: T.onInk, borderRadius: 12, padding: 26, display: 'flex', gap: 16 }}>
              <span style={{ width: 38, height: 38, borderRadius: '50%', background: T.rust, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: T.serif, fontSize: 18, color: '#F5F1EA', fontStyle: 'italic', fontWeight: 600 }}>S</span>
              <div>
                <Eyebrow dash={false} color={T.rustSoft} style={{ marginBottom: 8 }}>Sol nhìn vào dữ liệu</Eyebrow>
                <div style={{ fontFamily: T.serif, fontSize: 17, lineHeight: 1.55, fontStyle: 'italic', color: 'rgba(245,241,234,0.95)' }}>Giá đang thấp hơn <em style={{ color: T.rustSoft, fontStyle: 'normal', fontWeight: 500 }}>18%</em> so với trung bình tuần. Có khả năng tăng trong 24h tới — nên đặt sớm.</div>
                <Btn onClick={() => navigate('/hunter/create')} size="sm" style={{ marginTop: 14, background: 'transparent', color: T.rustSoft, border: `1px solid ${T.rustSoft}` }} icon={<Ic.trend size={14} stroke={T.rustSoft} />}>Xem biểu đồ 30 ngày</Btn>
              </div>
            </div>
            {/* baggage + conditions */}
            <div style={{ background: T.paper, border: `1px solid ${T.line}`, borderRadius: 12, padding: 28 }}>
              <Eyebrow style={{ marginBottom: 16 }}>Hành lý & điều kiện</Eyebrow>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[['Hành lý xách tay', f.baggage.carry, 'Đã bao gồm'] as const, ['Hành lý ký gửi', f.baggage.check, f.baggage.check === 'Mua thêm' ? 'Chưa bao gồm' : 'Đã bao gồm'] as const].map(([t, v, s]) => (
                  <div key={t} style={{ display: 'flex', gap: 12, padding: 16, borderRadius: 8, background: T.paper2 }}>
                    <Ic.bag size={20} stroke={T.ink2} />
                    <div>
                      <div style={{ fontFamily: T.serif, fontSize: 15, fontWeight: 500, color: T.ink }}>{t}</div>
                      <div style={{ fontFamily: T.sans, fontSize: 11, color: T.ink3, marginTop: 2 }}>{s} · <em style={{ color: T.ink2, fontStyle: 'normal', fontWeight: 600 }}>{v}</em></div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16, padding: 16, borderRadius: 8, background: T.paper2, fontFamily: T.serif, fontSize: 14, color: T.ink2, lineHeight: 1.5, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Ic.shield size={15} stroke={T.ink3} /> {f.refundable} · Đổi tên không hỗ trợ.
              </div>
            </div>
          </div>
          {/* RIGHT sticky summary */}
          <div style={{ position: 'sticky', top: 86, background: T.paper, border: `1px solid ${T.line2}`, borderRadius: 12, padding: 26 }}>
            <Eyebrow dash={false} style={{ marginBottom: 16 }}>Chi tiết giá · 1 khách</Eyebrow>
            <SummaryRow label="Giá vé cơ bản" value={`${fmtVnd(f.basePrice)}đ`} />
            <SummaryRow label="Thuế & lệ phí sân bay" value={`${fmtVnd(f.tax)}đ`} />
            <SummaryRow label="Phí dịch vụ OpenFly" value={`${fmtVnd(f.fee)}đ`} />
            <div style={{ height: 1, background: T.line, margin: '12px 0' }} />
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 18 }}>
              <span style={{ fontFamily: T.serif, fontSize: 17, fontWeight: 500, color: T.ink }}>Tổng cộng</span>
              <Price value={f.price} size={30} />
            </div>
            <Btn onClick={() => navigate(`/booking/${f.id}`)} full size="lg">Chọn vé này</Btn>
            <button onClick={() => navigate('/hunter/create')} style={{ width: '100%', marginTop: 10, padding: '12px', borderRadius: 6, background: 'transparent', border: `1px solid ${T.line2}`, cursor: 'pointer', fontFamily: T.serif, fontSize: 14, color: T.ink2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Ic.radar size={15} stroke={T.ink2} /> Tạo cảnh báo giá
            </button>
            <div style={{ textAlign: 'center', fontFamily: T.serif, fontSize: 12, color: T.ink3, fontStyle: 'italic', marginTop: 14 }}>Chưa trừ tiền cho đến khi bạn xác nhận.</div>
          </div>
        </div>
      </Container>
    </div>
  )
}
