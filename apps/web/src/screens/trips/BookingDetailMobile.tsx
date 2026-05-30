// OpenFly — Booking detail / e-ticket (mobile), ported from screens-trips.jsx BookingDetailScreen.
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { T, fmtVnd } from '../../theme/tokens'
import { Eyebrow, Price, Sunmark, Ic } from '../../components/ui'
import { AIRLINES, AIRPORTS } from '../../data/mock'
import type { Booking } from '../../data/mock'

function DetailCell({ label, value, sub, right }: { label: string; value: string; sub?: string; right?: boolean }) {
  return (
    <div style={{ textAlign: right ? 'right' : 'left' }}>
      <div style={{ fontFamily: T.sans, fontSize: 9, color: T.ink3, letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: 600 }}>{label}</div>
      <div style={{ fontFamily: T.serif, fontSize: 15, color: T.ink, marginTop: 4, fontWeight: 500, letterSpacing: '-0.2px' }}>{value}</div>
      {sub && <div style={{ fontFamily: T.sans, fontSize: 10, color: T.ink3, marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

function ActionButton({ icon, label, sub }: { icon: ReactNode; label: string; sub?: string }) {
  return (
    <button style={{ width: '100%', padding: '14px 18px', background: T.paper, border: `1px solid ${T.line}`, borderRadius: 6, display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', textAlign: 'left' }}>
      <div style={{ width: 32, height: 32, borderRadius: 4, background: T.paper2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: T.serif, fontSize: 14, color: T.ink, fontWeight: 500, letterSpacing: '-0.2px' }}>{label}</div>
        {sub && <div style={{ fontFamily: T.sans, fontSize: 11, color: T.ink3, marginTop: 1 }}>{sub}</div>}
      </div>
      <Ic.chevron size={12} stroke={T.ink3} />
    </button>
  )
}

function FauxQR({ size = 84 }: { size?: number }) {
  const cells = 17
  const cs = size / cells
  const seed = 'OFY8K2'
  const pattern: { r: number; c: number }[] = []
  for (let r = 0; r < cells; r++) for (let c = 0; c < cells; c++) {
    const hash = (r * 31 + c * 17 + seed.charCodeAt((r + c) % seed.length)) % 7
    const isFinder = (r < 7 && c < 7) || (r < 7 && c >= cells - 7) || (r >= cells - 7 && c < 7)
    const inner = (r >= 2 && r < 5 && c >= 2 && c < 5) || (r >= 2 && r < 5 && c >= cells - 5 && c < cells - 2) || (r >= cells - 5 && r < cells - 2 && c >= 2 && c < 5)
    const ring = ((r === 0 || r === 6) && c < 7) || ((c === 0 || c === 6) && r < 7) || ((r === 0 || r === 6) && c >= cells - 7) || ((c === cells - 7 || c === cells - 1) && r < 7) || ((r === cells - 7 || r === cells - 1) && c < 7) || ((c === 0 || c === 6) && r >= cells - 7)
    const fill = isFinder ? (ring || inner) : hash < 3
    if (fill) pattern.push({ r, c })
  }
  return (
    <div style={{ width: size, height: size, background: T.paper, borderRadius: 4, padding: 2, boxSizing: 'border-box', border: `1px solid ${T.line}`, flexShrink: 0 }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size - 4} height={size - 4}>
        {pattern.map((p, i) => <rect key={i} x={p.c * cs} y={p.r * cs} width={cs + 0.4} height={cs + 0.4} fill={T.ink} />)}
      </svg>
    </div>
  )
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '6px 0' }}>
      <span style={{ fontFamily: T.serif, fontSize: 13, color: T.ink2 }}>{label}</span>
      <span style={{ fontFamily: T.serif, fontSize: 14, color: highlight ? T.green : T.ink, fontWeight: 500, letterSpacing: '-0.2px' }}>{value}</span>
    </div>
  )
}

export function BookingDetailMobile({ booking: b }: { booking: Booking }) {
  const navigate = useNavigate()
  const a = AIRLINES[b.airline]
  const a1 = AIRPORTS[b.from]
  const a2 = AIRPORTS[b.to]
  const confirmed = b.status === 'confirmed'

  return (
    <div style={{ background: T.paper2, minHeight: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px 8px', background: T.paper, borderBottom: `1px solid ${T.line}` }}>
        <button onClick={() => navigate('/trips')} aria-label="Quay lại" style={{ width: 36, height: 36, borderRadius: '50%', background: 'transparent', border: `1px solid ${T.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Ic.back size={16} stroke={T.ink} /></button>
        <div style={{ flex: 1 }}><Eyebrow dash={false}>Vé điện tử</Eyebrow></div>
        <button aria-label="Tùy chọn" style={{ width: 36, height: 36, borderRadius: '50%', background: 'transparent', border: `1px solid ${T.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Ic.options size={16} stroke={T.ink2} /></button>
      </div>

      {/* Boarding pass */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ background: T.paper, borderRadius: 8, border: `1px solid ${T.line}`, overflow: 'hidden', position: 'relative' }}>
          <div style={{ background: T.inkBlock, color: T.onInk, padding: '16px 22px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <Sunmark size={22} color={T.rustLt} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: T.sans, fontSize: 9.5, color: T.rustSoft, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 600 }}>Boarding pass · {a.short}</div>
              <div style={{ fontFamily: T.serif, fontSize: 14, color: T.onInk, marginTop: 2, fontWeight: 500, letterSpacing: '-0.2px' }}>{b.number} · {b.aircraft}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: T.sans, fontSize: 9, color: 'rgba(245,241,234,0.55)', letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600 }}>PNR</div>
              <div style={{ fontFamily: T.mono, fontSize: 14, color: T.rustSoft, fontWeight: 500, letterSpacing: 2, marginTop: 2 }}>{b.pnr}</div>
            </div>
          </div>
          <div style={{ padding: '24px 22px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: T.serif, fontSize: 34, fontWeight: 500, color: T.ink, letterSpacing: '-1.5px', lineHeight: 0.95 }}>{b.from}</div>
                <div style={{ fontFamily: T.serif, fontSize: 13, color: T.ink2, marginTop: 6 }}>{a1.city}</div>
                <div style={{ fontFamily: T.sans, fontSize: 10, color: T.ink3, marginTop: 1 }}>{a1.name}</div>
              </div>
              <div style={{ width: 60, padding: '0 4px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}><Ic.plane2 size={16} stroke={T.rust} sw={1.6} /></div>
                <div style={{ height: 1, backgroundImage: `linear-gradient(to right, ${T.line2} 50%, transparent 50%)`, backgroundSize: '4px 1px' }} />
              </div>
              <div style={{ flex: 1, textAlign: 'right' }}>
                <div style={{ fontFamily: T.serif, fontSize: 34, fontWeight: 500, color: T.ink, letterSpacing: '-1.5px', lineHeight: 0.95 }}>{b.to}</div>
                <div style={{ fontFamily: T.serif, fontSize: 13, color: T.ink2, marginTop: 6 }}>{a2.city}</div>
                <div style={{ fontFamily: T.sans, fontSize: 10, color: T.ink3, marginTop: 1 }}>{a2.name}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', marginTop: 22 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: T.sans, fontSize: 10, color: T.ink3, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 600 }}>Khởi hành</div>
                <div style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 500, color: T.ink, marginTop: 4, letterSpacing: '-0.5px' }}>{b.depart}</div>
                <div style={{ fontFamily: T.sans, fontSize: 11, color: T.ink3, marginTop: 2 }}>{b.dateLabel}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: T.sans, fontSize: 10, color: T.ink3, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 600 }}>Đến</div>
                <div style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 500, color: T.ink, marginTop: 4, letterSpacing: '-0.5px' }}>{b.arrive}</div>
                <div style={{ fontFamily: T.sans, fontSize: 11, color: T.ink3, marginTop: 2 }}>cùng ngày · {b.duration}</div>
              </div>
            </div>
          </div>
          {/* perforation */}
          <div style={{ position: 'relative', height: 22, margin: '0 -1px' }}>
            <div style={{ position: 'absolute', left: -12, top: 5, width: 22, height: 22, borderRadius: '50%', background: T.paper2, border: `1px solid ${T.line}`, borderRight: 'none' }} />
            <div style={{ position: 'absolute', right: -12, top: 5, width: 22, height: 22, borderRadius: '50%', background: T.paper2, border: `1px solid ${T.line}`, borderLeft: 'none' }} />
            <div style={{ position: 'absolute', left: 20, right: 20, top: 15, height: 1, backgroundImage: `linear-gradient(to right, ${T.line2} 50%, transparent 50%)`, backgroundSize: '6px 1px' }} />
          </div>
          <div style={{ padding: '14px 22px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            <DetailCell label="Hành khách" value={b.pax[0].name} sub={b.pax.length > 1 ? `+ ${b.pax.length - 1} người khác` : '1 người lớn'} />
            <DetailCell label="Ghế" value={b.seats[0] || '—'} sub={confirmed ? 'Đã chọn' : 'Chưa chọn'} right />
            <DetailCell label="Hạng ghế" value={b.cabin} sub="·" />
            <DetailCell label="Hành lý" value={b.baggage.check} sub={`Xách tay ${b.baggage.carry}`} right />
          </div>
        </div>
      </div>

      {confirmed && (
        <div style={{ padding: '14px 20px 0' }}>
          <div style={{ background: T.paper, border: `1px solid ${T.line}`, borderRadius: 6, padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 18 }}>
            <FauxQR size={84} />
            <div style={{ flex: 1 }}>
              <Eyebrow dash={false}>Quét tại sân bay</Eyebrow>
              <div style={{ fontFamily: T.serif, fontSize: 14, color: T.ink, marginTop: 6, fontWeight: 500, letterSpacing: '-0.2px' }}>Vé điện tử có hiệu lực</div>
              <div style={{ fontFamily: T.serif, fontSize: 12, color: T.ink3, fontStyle: 'italic', marginTop: 3 }}>Check-in mở {b.checkinOpensAt}</div>
            </div>
          </div>
        </div>
      )}

      {b.status === 'holding' && (
        <div style={{ padding: '14px 20px 0' }}>
          <div style={{ background: T.inkBlock, color: T.onInk, borderRadius: 6, padding: 16 }}>
            <Eyebrow dash={false} color={T.rustSoft} style={{ marginBottom: 6 }}>Đang giữ chỗ</Eyebrow>
            <div style={{ fontFamily: T.serif, fontSize: 14, color: T.onInk, lineHeight: 1.5, fontStyle: 'italic' }}>
              Booking này được giữ chỗ đến <em style={{ color: T.rustSoft, fontStyle: 'normal', fontWeight: 500 }}>14:32 hôm nay</em>. Hoàn tất thanh toán để chốt vé.
            </div>
            <button onClick={() => navigate('/payment', { state: { flightId: b.flightId, total: b.total } })} style={{ marginTop: 12, padding: '10px 16px', borderRadius: 4, background: T.rust, border: 'none', color: '#F5F1EA', fontFamily: T.serif, fontSize: 13, fontWeight: 500, letterSpacing: '-0.1px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              Thanh toán {fmtVnd(b.total)}đ <Ic.arrow size={14} stroke="#F5F1EA" />
            </button>
          </div>
        </div>
      )}

      <div style={{ padding: '20px 20px 0' }}>
        <Eyebrow>Thanh toán</Eyebrow>
        <div style={{ marginTop: 12, background: T.paper, border: `1px solid ${T.line}`, borderRadius: 6, padding: '14px 18px' }}>
          <Row label="Giá vé" value={`${fmtVnd(b.basePrice)}đ`} />
          <Row label="Thuế & phí" value={`${fmtVnd(b.tax + b.fee)}đ`} />
          {b.addons && <Row label="Dịch vụ thêm" value={`${fmtVnd(b.addons)}đ`} />}
          {b.voucher && <Row label={`Ưu đãi · ${b.voucher.code}`} value={`${fmtVnd(b.voucher.value)}đ`} highlight />}
          <div style={{ height: 1, background: T.line, margin: '10px 0' }} />
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: T.serif, fontSize: 14, color: T.ink, fontWeight: 500 }}>Đã thanh toán</span>
            <Price value={b.total} size={20} />
          </div>
          {b.payment.method && b.payment.method !== '—' && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px dashed ${T.line2}`, display: 'flex', alignItems: 'center', gap: 6, fontFamily: T.sans, fontSize: 11, color: T.ink3 }}>
              <Ic.check size={12} stroke={T.green} /> {b.payment.method} {b.payment.last4} · {b.payment.paidAt}
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {confirmed && <ActionButton icon={<Ic.send size={16} stroke={T.ink2} />} label="Tải vé PDF" />}
        {confirmed && <ActionButton icon={<Ic.cal size={16} stroke={T.ink2} />} label="Thêm vào lịch" />}
        {confirmed && <ActionButton icon={<Ic.options size={16} stroke={T.ink2} />} label="Đổi vé" sub="có phí" />}
        <ActionButton icon={<Ic.chat size={16} stroke={T.ink2} />} label="Chat với Sol" sub="đổi/hủy, hỏi thông tin" />
      </div>

      <div style={{ padding: '28px 24px 16px', textAlign: 'center' }}>
        <Eyebrow dash={false} style={{ color: T.ink4 }}>Chúc bạn bay vui</Eyebrow>
      </div>
    </div>
  )
}
