// OpenFly — Flight Detail (mobile), ported from screens-results.jsx DetailScreen.
import { useNavigate } from 'react-router-dom'
import { T, fmtVnd } from '../../theme/tokens'
import { Eyebrow, Price, AirlineBadge, Ic } from '../../components/ui'
import { AIRLINES, AIRPORTS } from '../../data/mock'
import type { Flight } from '../../data/mock'

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '6px 0' }}>
      <span style={{ fontFamily: T.serif, fontSize: 13, color: T.ink2 }}>{label}</span>
      <span style={{ fontFamily: T.serif, fontSize: 14, color: T.ink, fontWeight: 500, letterSpacing: '-0.2px' }}>{value}</span>
    </div>
  )
}

export function DetailMobile({ flight: f }: { flight: Flight }) {
  const navigate = useNavigate()
  const a = AIRLINES[f.airline]
  const a1 = AIRPORTS[f.from]
  const a2 = AIRPORTS[f.to]

  return (
    <div style={{ background: T.paper, minHeight: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px 0' }}>
        <button onClick={() => navigate(-1)} aria-label="Quay lại" style={{ width: 36, height: 36, borderRadius: '50%', background: 'transparent', border: `1px solid ${T.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Ic.back size={16} stroke={T.ink} />
        </button>
        <div style={{ flex: 1 }}><Eyebrow dash={false}>Chi tiết chuyến bay</Eyebrow></div>
        <button aria-label="Tùy chọn" style={{ width: 36, height: 36, borderRadius: '50%', background: 'transparent', border: `1px solid ${T.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Ic.options size={16} stroke={T.ink2} />
        </button>
      </div>

      {/* Hero card */}
      <div style={{ padding: '16px 20px 0' }}>
        <div style={{ background: T.paper, border: `1px solid ${T.line}`, borderRadius: 6, padding: '20px 20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <AirlineBadge code={f.airline} size={36} color={a.color} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: T.serif, fontSize: 16, fontWeight: 500, color: T.ink, letterSpacing: '-0.3px' }}>{a.short}</div>
              <div style={{ fontFamily: T.sans, fontSize: 11, color: T.ink3, marginTop: 1 }}>{f.number} · {f.aircraft}</div>
            </div>
            <div style={{ padding: '4px 10px', borderRadius: 100, border: `1px solid ${T.line2}`, fontFamily: T.sans, fontSize: 10, fontWeight: 500, color: T.ink3, letterSpacing: 0.5 }}>Bay thẳng</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.ink, border: `2px solid ${T.paper}`, boxShadow: `0 0 0 1px ${T.ink}` }} />
              <div style={{ width: 1, flex: 1, minHeight: 90, background: T.line2, margin: '4px 0', backgroundImage: `linear-gradient(to bottom, ${T.line2} 50%, transparent 50%)`, backgroundSize: '1px 4px' }} />
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.rust, border: `2px solid ${T.paper}`, boxShadow: `0 0 0 1px ${T.rust}` }} />
            </div>
            <div style={{ flex: 1 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <span style={{ fontFamily: T.serif, fontSize: 28, fontWeight: 500, color: T.ink, letterSpacing: '-1px', lineHeight: 1 }}>{f.depart}</span>
                  <span style={{ fontFamily: T.sans, fontSize: 11, color: T.ink3, letterSpacing: 0.3 }}>CN, 15 thg 6</span>
                </div>
                <div style={{ fontFamily: T.serif, fontSize: 14, color: T.ink, marginTop: 6 }}>{a1.city} <span style={{ color: T.ink3 }}>· {f.from}</span></div>
                <div style={{ fontFamily: T.sans, fontSize: 11, color: T.ink3, marginTop: 2 }}>{a1.name} · Nhà ga T1</div>
              </div>
              <div style={{ padding: '14px 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Ic.plane2 size={12} stroke={T.rust} sw={1.6} />
                <span style={{ fontFamily: T.sans, fontSize: 11, color: T.ink3, fontWeight: 500, letterSpacing: 0.3 }}>{f.duration} bay</span>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <span style={{ fontFamily: T.serif, fontSize: 28, fontWeight: 500, color: T.ink, letterSpacing: '-1px', lineHeight: 1 }}>{f.arrive}</span>
                  <span style={{ fontFamily: T.sans, fontSize: 11, color: T.ink3, letterSpacing: 0.3 }}>cùng ngày</span>
                </div>
                <div style={{ fontFamily: T.serif, fontSize: 14, color: T.ink, marginTop: 6 }}>{a2.city} <span style={{ color: T.ink3 }}>· {f.to}</span></div>
                <div style={{ fontFamily: T.sans, fontSize: 11, color: T.ink3, marginTop: 2 }}>{a2.name} · Nhà ga quốc nội</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sol insight */}
      <div style={{ padding: '14px 20px 0' }}>
        <div style={{ padding: 16, borderRadius: 6, background: T.inkBlock, color: T.onInk, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: T.rust, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontFamily: T.serif, fontSize: 15, color: '#F5F1EA', fontStyle: 'italic', fontWeight: 600, marginTop: -1 }}>S</span>
          </div>
          <div style={{ flex: 1 }}>
            <Eyebrow dash={false} color={T.rustSoft} style={{ marginBottom: 6 }}>Sol nhìn vào dữ liệu</Eyebrow>
            <div style={{ fontFamily: T.serif, fontSize: 14, color: T.onInk, lineHeight: 1.5, fontStyle: 'italic' }}>
              Giá đang thấp hơn <em style={{ color: T.rustSoft, fontStyle: 'normal', fontWeight: 500 }}>18%</em> so với trung bình tuần. Có khả năng tăng trong 24h tới — nên đặt sớm.
            </div>
            <button onClick={() => navigate('/hunter/create')} style={{ marginTop: 12, padding: '7px 12px', borderRadius: 4, background: 'transparent', border: `1px solid ${T.rustSoft}`, color: T.rustSoft, fontFamily: T.sans, fontSize: 11, fontWeight: 500, letterSpacing: 0.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Ic.trend size={12} stroke={T.rustSoft} sw={1.6} /> Xem biểu đồ 30 ngày
            </button>
          </div>
        </div>
      </div>

      {/* Baggage */}
      <div style={{ padding: '24px 20px 0' }}>
        <Eyebrow>Hành lý</Eyebrow>
        <div style={{ marginTop: 12, background: T.paper, border: `1px solid ${T.line}`, borderRadius: 6, overflow: 'hidden' }}>
          {[['Hành lý xách tay', 'Đã bao gồm', f.baggage.carry, false] as const, ['Hành lý ký gửi', f.baggage.check === 'Mua thêm' ? 'Chưa bao gồm' : 'Đã bao gồm', f.baggage.check, f.baggage.check === 'Mua thêm'] as const].map(([title, sub, val, extra], i) => (
            <div key={title}>
              {i === 1 && <div style={{ height: 1, background: T.line, margin: '0 18px' }} />}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px' }}>
                <div style={{ width: 32, height: 32, borderRadius: 4, background: T.paper2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ic.bag size={16} stroke={T.ink2} /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: T.serif, fontSize: 14, color: T.ink, fontWeight: 500 }}>{title}</div>
                  <div style={{ fontFamily: T.sans, fontSize: 11, color: T.ink3, marginTop: 1 }}>{sub}</div>
                </div>
                <div style={{ fontFamily: T.serif, fontSize: 15, fontWeight: 500, color: extra ? T.rust : T.ink }}>{val}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Conditions */}
      <div style={{ padding: '24px 20px 0' }}>
        <Eyebrow>Điều kiện vé</Eyebrow>
        <div style={{ marginTop: 12, background: T.paper, border: `1px solid ${T.line}`, borderRadius: 6, padding: '14px 18px', fontFamily: T.serif, fontSize: 13, color: T.ink2, lineHeight: 1.55 }}>
          {f.refundable} · Đổi tên không hỗ trợ.
        </div>
      </div>

      {/* Price breakdown */}
      <div style={{ padding: '24px 20px 0' }}>
        <Eyebrow>Chi tiết giá</Eyebrow>
        <div style={{ marginTop: 12, background: T.paper, border: `1px solid ${T.line}`, borderRadius: 6, padding: '14px 18px' }}>
          <Row label="Giá vé cơ bản" value={`${fmtVnd(f.basePrice)}đ`} />
          <Row label="Thuế & lệ phí sân bay" value={`${fmtVnd(f.tax)}đ`} />
          <Row label="Phí dịch vụ OpenFly" value={`${fmtVnd(f.fee)}đ`} />
          <div style={{ height: 1, background: T.line, margin: '10px 0' }} />
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: T.serif, fontSize: 15, color: T.ink, fontWeight: 500 }}>Tổng cộng</span>
            <Price value={f.price} size={24} />
          </div>
        </div>
      </div>

      {/* Footnote */}
      <div style={{ padding: '24px 24px 16px', textAlign: 'center' }}>
        <Eyebrow dash={false} style={{ color: T.ink4 }}>Mỗi câu đều có lý do để tồn tại</Eyebrow>
      </div>

      {/* Action bar */}
      <div style={{ borderTop: `1px solid ${T.line}`, padding: '14px 20px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => navigate('/hunter/create')} aria-label="Tạo cảnh báo giá" title="Tạo cảnh báo giá" style={{ width: 52, height: 52, borderRadius: 4, background: 'transparent', border: `1px solid ${T.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
          <Ic.radar size={20} stroke={T.ink} sw={1.6} />
        </button>
        <button onClick={() => navigate(`/booking/${f.id}`)} style={{ flex: 1, padding: '17px', background: T.ink, color: T.paper, border: 'none', borderRadius: 4, fontFamily: T.serif, fontSize: 15, fontWeight: 500, letterSpacing: '-0.2px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          Chọn vé <span style={{ opacity: 0.55, fontWeight: 400 }}>·</span>
          <Price value={f.price} size={15} color={T.paper} />
        </button>
      </div>
    </div>
  )
}
