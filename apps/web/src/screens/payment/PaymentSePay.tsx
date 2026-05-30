// OpenFly — Payment via SePay (ADAPT of the design's VNPay/MoMo/ZaloPay selector).
// Per Q-48 + KEHOACH 7.5: dynamic SePay QR + bank transfer + transfer-content (PNR) + 15-min
// countdown, then backend confirms via polling/webhook → Success.
//
// MOCK: the QR is decorative and "Tôi đã chuyển khoản" advances immediately. In production the
// QR image URL comes from SePay, the amount/content are real, and the screen polls
// GET /bookings/:id/payment-status until paid (do NOT trust a user-clicked button to mark paid).
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { T, fmtVnd, CURRENCY } from '../../theme/tokens'
import { Eyebrow, Ic } from '../../components/ui'

const PNR = 'OFY8K2'
const BANK = { name: 'Vietcombank', account: '0011 0000 123456', holder: 'CÔNG TY CỔ PHẦN OPENFLY' }

// Decorative QR (finder squares + a deterministic module pattern).
function QrMark({ size = 168 }: { size?: number }) {
  const cells: { x: number; y: number }[] = []
  for (let y = 0; y < 21; y++) for (let x = 0; x < 21; x++) {
    const finder = (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13)
    if (finder) continue
    if (((x * 3 + y * 7 + x * y) % 5) === 0) cells.push({ x, y })
  }
  const u = size / 21
  const Finder = ({ x, y }: { x: number; y: number }) => (
    <g>
      <rect x={x * u} y={y * u} width={u * 7} height={u * 7} rx={u} fill="none" stroke={T.ink} strokeWidth={u * 1.1} />
      <rect x={(x + 2) * u} y={(y + 2) * u} width={u * 3} height={u * 3} rx={u * 0.6} fill={T.ink} />
    </g>
  )
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
      {cells.map((c, i) => <rect key={i} x={c.x * u} y={c.y * u} width={u} height={u} fill={T.ink} />)}
      <Finder x={0} y={0} /><Finder x={14} y={0} /><Finder x={0} y={14} />
    </svg>
  )
}

export function PaymentSePay() {
  const navigate = useNavigate()
  const { state } = useLocation() as { state: { total?: number; flightId?: string } | null }
  const total = state?.total ?? 940
  const [secs, setSecs] = useState(15 * 60)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (secs <= 0) return
    const id = setInterval(() => setSecs((s) => (s > 0 ? s - 1 : 0)), 1000)
    return () => clearInterval(id)
  }, [secs])

  const mm = String(Math.floor(secs / 60)).padStart(2, '0')
  const ss = String(secs % 60).padStart(2, '0')

  const copyContent = () => {
    try { navigator.clipboard?.writeText(PNR) } catch { /* ignore */ }
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 20px 40px' }}>
      <div style={{ width: '100%', maxWidth: 480, display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <button onClick={() => navigate(-1)} aria-label="Quay lại" style={{ width: 36, height: 36, borderRadius: '50%', background: 'transparent', border: `1px solid ${T.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Ic.close size={16} stroke={T.ink2} />
        </button>
        <div style={{ flex: 1 }}><Eyebrow dash={false}>Thanh toán qua SePay</Eyebrow></div>
        {/* countdown */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 100, background: T.paper2, border: `1px solid ${T.line}` }}>
          <Ic.clock size={13} stroke={secs < 120 ? T.red : T.ink3} />
          <span style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 500, color: secs < 120 ? T.red : T.ink2, letterSpacing: 0.5 }}>{mm}:{ss}</span>
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: 480 }}>
        <h1 style={{ fontFamily: T.serif, fontSize: 24, fontWeight: 400, letterSpacing: '-0.8px', lineHeight: 1.15, color: T.ink, margin: '10px 0 6px' }}>
          Quét mã hoặc <em style={{ color: T.rust, fontWeight: 500 }}>chuyển khoản</em> để hoàn tất.
        </h1>
        <p style={{ fontFamily: T.serif, fontSize: 13, color: T.ink3, fontStyle: 'italic', margin: '0 0 20px', lineHeight: 1.5 }}>
          Hệ thống tự động xác nhận trong vài giây sau khi nhận được tiền.
        </p>

        {/* QR card */}
        <div style={{ background: T.paper, border: `1px solid ${T.line}`, borderRadius: 10, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ position: 'relative', padding: 14, borderRadius: 8, background: '#FFFFFF', border: `1px solid ${T.line2}` }}>
            <QrMark size={168} />
            {/* pulsing ring around QR */}
            <div style={{ position: 'absolute', inset: -6, borderRadius: 12, border: `1.5px solid ${T.rust}`, opacity: 0.3, animation: 'ringPulse 1.8s ease-out infinite', pointerEvents: 'none' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16 }}>
            <span style={{ fontFamily: T.sans, fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: T.green }}>● Đang chờ thanh toán</span>
            <div style={{ display: 'flex', gap: 5 }}>
              {[0, 1, 2].map((i) => <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: T.ink, opacity: 0.3, animation: `dotBounce 1.2s ease-in-out ${i * 0.16}s infinite` }} />)}
            </div>
          </div>
        </div>

        {/* Bank transfer info */}
        <div style={{ marginTop: 14, background: T.paper, border: `1px solid ${T.line}`, borderRadius: 10, padding: '6px 18px' }}>
          <Row label="Ngân hàng" value={BANK.name} />
          <Div /><Row label="Số tài khoản" value={BANK.account} mono />
          <Div /><Row label="Chủ tài khoản" value={BANK.holder} />
          <Div /><Row label="Số tiền" value={`${fmtVnd(total)}${CURRENCY}`} strong />
          <Div />
          {/* transfer content — highlighted + copy */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
            <div>
              <div style={{ fontFamily: T.sans, fontSize: 11, color: T.ink3 }}>Nội dung chuyển khoản</div>
              <div style={{ fontFamily: T.mono, fontSize: 18, fontWeight: 600, color: T.rust, letterSpacing: 1, marginTop: 3 }}>{PNR}</div>
            </div>
            <button onClick={copyContent} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 6, background: copied ? T.green : T.ink, color: T.paper, border: 'none', cursor: 'pointer', fontFamily: T.sans, fontSize: 12, fontWeight: 600 }}>
              {copied ? <><Ic.check size={13} stroke={T.paper} /> Đã copy</> : 'Copy'}
            </button>
          </div>
        </div>

        {/* Warning */}
        <div style={{ marginTop: 12, padding: '12px 16px', borderRadius: 8, background: T.rustTint, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <Ic.info size={15} stroke={T.rust} />
          <p style={{ margin: 0, fontFamily: T.serif, fontSize: 12.5, color: T.ink2, lineHeight: 1.5 }}>
            Vui lòng ghi <em style={{ color: T.rust, fontStyle: 'normal', fontWeight: 600 }}>đúng nội dung {PNR}</em> để hệ thống tự động xác nhận. Sai nội dung có thể làm chậm việc xuất vé.
          </p>
        </div>

        {/* CTA (mock: advances; production polls payment-status) */}
        <button onClick={() => navigate('/success', { state: { total, pnr: PNR } })} style={{ width: '100%', marginTop: 18, padding: '16px', background: T.ink, color: T.paper, border: 'none', borderRadius: 4, fontFamily: T.serif, fontSize: 15, fontWeight: 500, letterSpacing: '-0.2px', cursor: 'pointer' }}>
          Tôi đã chuyển khoản
        </button>
        <div style={{ textAlign: 'center', fontFamily: T.serif, fontSize: 11, color: T.ink3, fontStyle: 'italic', marginTop: 10 }}>
          Không cần bấm nếu app tự xác nhận — màn hình sẽ tự chuyển khi nhận được tiền.
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, mono, strong }: { label: string; value: string; mono?: boolean; strong?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '12px 0', gap: 16 }}>
      <span style={{ fontFamily: T.sans, fontSize: 11, color: T.ink3, flexShrink: 0 }}>{label}</span>
      <span style={{ fontFamily: mono ? T.mono : T.serif, fontSize: strong ? 18 : 14, fontWeight: strong ? 600 : 500, color: strong ? T.rust : T.ink, letterSpacing: mono ? 0.5 : '-0.2px', textAlign: 'right' }}>{value}</span>
    </div>
  )
}
function Div() { return <div style={{ height: 1, background: T.line }} /> }
