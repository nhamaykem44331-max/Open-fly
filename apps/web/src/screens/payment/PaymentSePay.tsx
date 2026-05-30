// OpenFly — Payment via SePay (ADAPT of the design's VNPay/MoMo/ZaloPay selector, Q-48).
// Real path: create a SePay QR intent (POST .../payment/sepay), show the real QR/bank/amount/
// transfer-content + countdown, and POLL .../payment/status until the backend confirms PAID —
// the "Tôi đã chuyển khoản" button only re-checks status, it never marks the booking paid.
// Mock path (design mode / :bookingId = "mock") keeps the decorative QR + click-to-advance.
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams, type NavigateFunction } from 'react-router-dom'
import { T, fmtVnd, CURRENCY } from '../../theme/tokens'
import { Eyebrow, Ic } from '../../components/ui'
import { apiEnabled } from '../../lib/api/client'
import { useSepayIntent, usePaymentStatus, isPaid } from '../../data/usePayment'
import { PaymentFailed } from '../states/PaymentFailed'

const DEFAULT_HOLDER = 'CÔNG TY CỔ PHẦN OPENFLY'
const BANK_BY_BIN: Record<string, string> = {
  '970436': 'Vietcombank',
  '970422': 'MB Bank',
  '970407': 'Techcombank',
  '970418': 'BIDV',
  '970415': 'VietinBank',
}

// Decorative QR (finder squares + a deterministic module pattern) — mock + image fallback.
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

function Row({ label, value, mono, strong }: { label: string; value: string; mono?: boolean; strong?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '12px 0', gap: 16 }}>
      <span style={{ fontFamily: T.sans, fontSize: 11, color: T.ink3, flexShrink: 0 }}>{label}</span>
      <span style={{ fontFamily: mono ? T.mono : T.serif, fontSize: strong ? 18 : 14, fontWeight: strong ? 600 : 500, color: strong ? T.rust : T.ink, letterSpacing: mono ? 0.5 : '-0.2px', textAlign: 'right' }}>{value}</span>
    </div>
  )
}
function Div() { return <div style={{ height: 1, background: T.line }} /> }

function Shell({ children, onBack, secs }: { children: React.ReactNode; onBack: () => void; secs: number | null }) {
  const mm = secs == null ? '' : String(Math.floor(secs / 60)).padStart(2, '0')
  const ss = secs == null ? '' : String(secs % 60).padStart(2, '0')
  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 20px 40px' }}>
      <div style={{ width: '100%', maxWidth: 480, display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <button onClick={onBack} aria-label="Quay lại" style={{ width: 36, height: 36, borderRadius: '50%', background: 'transparent', border: `1px solid ${T.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Ic.close size={16} stroke={T.ink2} />
        </button>
        <div style={{ flex: 1 }}><Eyebrow dash={false}>Thanh toán qua SePay</Eyebrow></div>
        {secs != null && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 100, background: T.paper2, border: `1px solid ${T.line}` }}>
            <Ic.clock size={13} stroke={secs < 120 ? T.red : T.ink3} />
            <span style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 500, color: secs < 120 ? T.red : T.ink2, letterSpacing: 0.5 }}>{mm}:{ss}</span>
          </div>
        )}
      </div>
      <div style={{ width: '100%', maxWidth: 480 }}>{children}</div>
    </div>
  )
}

function useCountdown(target: number | null): number | null {
  const [secs, setSecs] = useState<number | null>(null)
  useEffect(() => {
    if (target == null) { setSecs(null); return }
    const tick = () => setSecs(Math.max(0, Math.round((target - Date.now()) / 1000)))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [target])
  return secs
}

function QrCard({ qr, waiting }: { qr: string | null; waiting: string }) {
  const [imgOk, setImgOk] = useState(true)
  return (
    <div style={{ background: T.paper, border: `1px solid ${T.line}`, borderRadius: 10, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ position: 'relative', padding: 14, borderRadius: 8, background: '#FFFFFF', border: `1px solid ${T.line2}` }}>
        {qr && imgOk
          ? <img src={qr} width={168} height={168} alt="QR thanh toán SePay" style={{ display: 'block', width: 168, height: 168 }} onError={() => setImgOk(false)} />
          : <QrMark size={168} />}
        <div style={{ position: 'absolute', inset: -6, borderRadius: 12, border: `1.5px solid ${T.rust}`, opacity: 0.3, animation: 'ringPulse 1.8s ease-out infinite', pointerEvents: 'none' }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16 }}>
        <span style={{ fontFamily: T.sans, fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: T.green }}>● {waiting}</span>
        <div style={{ display: 'flex', gap: 5 }}>
          {[0, 1, 2].map((i) => <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: T.ink, opacity: 0.3, animation: `dotBounce 1.2s ease-in-out ${i * 0.16}s infinite` }} />)}
        </div>
      </div>
    </div>
  )
}

function Intro() {
  return (
    <>
      <h1 style={{ fontFamily: T.serif, fontSize: 24, fontWeight: 400, letterSpacing: '-0.8px', lineHeight: 1.15, color: T.ink, margin: '10px 0 6px' }}>
        Quét mã hoặc <em style={{ color: T.rust, fontWeight: 500 }}>chuyển khoản</em> để hoàn tất.
      </h1>
      <p style={{ fontFamily: T.serif, fontSize: 13, color: T.ink3, fontStyle: 'italic', margin: '0 0 20px', lineHeight: 1.5 }}>
        Hệ thống tự động xác nhận trong vài giây sau khi nhận được tiền.
      </p>
    </>
  )
}

function TransferBlock({ holder, account, bank, amountText, content }: { holder: string; account: string; bank: string; amountText: string; content: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    try { navigator.clipboard?.writeText(content) } catch { /* ignore */ }
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }
  return (
    <>
      <div style={{ marginTop: 14, background: T.paper, border: `1px solid ${T.line}`, borderRadius: 10, padding: '6px 18px' }}>
        <Row label="Ngân hàng" value={bank} />
        <Div /><Row label="Số tài khoản" value={account} mono />
        <Div /><Row label="Chủ tài khoản" value={holder} />
        <Div /><Row label="Số tiền" value={amountText} strong />
        <Div />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
          <div>
            <div style={{ fontFamily: T.sans, fontSize: 11, color: T.ink3 }}>Nội dung chuyển khoản</div>
            <div style={{ fontFamily: T.mono, fontSize: 18, fontWeight: 600, color: T.rust, letterSpacing: 1, marginTop: 3 }}>{content}</div>
          </div>
          <button onClick={copy} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 6, background: copied ? T.green : T.ink, color: T.paper, border: 'none', cursor: 'pointer', fontFamily: T.sans, fontSize: 12, fontWeight: 600 }}>
            {copied ? <><Ic.check size={13} stroke={T.paper} /> Đã copy</> : 'Copy'}
          </button>
        </div>
      </div>
      <div style={{ marginTop: 12, padding: '12px 16px', borderRadius: 8, background: T.rustTint, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <Ic.info size={15} stroke={T.rust} />
        <p style={{ margin: 0, fontFamily: T.serif, fontSize: 12.5, color: T.ink2, lineHeight: 1.5 }}>
          Vui lòng ghi <em style={{ color: T.rust, fontStyle: 'normal', fontWeight: 600 }}>đúng nội dung {content}</em> để hệ thống tự động xác nhận. Sai nội dung có thể làm chậm việc xuất vé.
        </p>
      </div>
    </>
  )
}

// ─── Real (wired) ───────────────────────────────────────────
function PaymentReal({ bookingId, navigate }: { bookingId: string; navigate: NavigateFunction }) {
  const intentQ = useSepayIntent(bookingId, true)
  const statusQ = usePaymentStatus(bookingId, true)
  const intent = intentQ.data
  const status = statusQ.data
  const paid = isPaid(status?.bookingStatus)
  const amount = intent?.intent.amount ?? status?.intent?.amount ?? 0
  const content = intent ? `OPENFLY${intent.intent.providerOrderCode}` : (status?.orderCode ? `OPENFLY${status.intent?.providerOrderCode ?? ''}` : '')
  const expireMs = useMemo(() => (intent?.expiresAt ? new Date(intent.expiresAt).getTime() : null), [intent?.expiresAt])
  const secs = useCountdown(expireMs)

  // Payment confirmed by the backend → success. Driven by polling, never by a button.
  useEffect(() => {
    if (paid) navigate('/success', { state: { orderCode: status?.orderCode, amountVnd: amount, bookingId } })
  }, [paid, navigate, status?.orderCode, amount])

  if (intentQ.isLoading) {
    return <Shell onBack={() => navigate(-1)} secs={null}><Intro /><div style={{ textAlign: 'center', padding: '40px 0', fontFamily: T.serif, fontSize: 14, color: T.ink3, fontStyle: 'italic' }}>Đang tạo mã thanh toán…</div></Shell>
  }
  if (intentQ.isError) {
    return (
      <Shell onBack={() => navigate(-1)} secs={null}>
        <Intro />
        <div style={{ textAlign: 'center', padding: '28px 0' }}>
          <p style={{ fontFamily: T.serif, fontSize: 14, color: T.red, fontStyle: 'italic' }}>Không tạo được thanh toán — {(intentQ.error as Error)?.message}</p>
          <button onClick={() => navigate('/trips')} style={{ marginTop: 14, padding: '12px 20px', background: T.ink, color: T.paper, border: 'none', borderRadius: 4, fontFamily: T.serif, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>Xem chuyến của tôi</button>
        </div>
      </Shell>
    )
  }

  // QR / transfer window expired without a confirmed payment → recovery screen (real amount + content).
  if (secs === 0 && !paid) {
    return (
      <PaymentFailed
        amountLabel={`${amount.toLocaleString('vi-VN')}${CURRENCY}`}
        content={content}
        onCheckAgain={() => void statusQ.refetch()}
        onContact={() => navigate('/sol')}
      />
    )
  }

  const bank = intent?.intent.bin ? BANK_BY_BIN[intent.intent.bin] ?? `Mã ngân hàng ${intent.intent.bin}` : '—'
  return (
    <Shell onBack={() => navigate(-1)} secs={secs}>
      <Intro />
      <QrCard qr={intent?.qrUrl ?? null} waiting={paid ? 'Đã nhận thanh toán' : 'Đang chờ thanh toán'} />
      <TransferBlock
        holder={DEFAULT_HOLDER}
        account={intent?.intent.accountNumber ?? '—'}
        bank={bank}
        amountText={`${amount.toLocaleString('vi-VN')}${CURRENCY}`}
        content={content}
      />
      <button onClick={() => statusQ.refetch()} style={{ width: '100%', marginTop: 18, padding: '16px', background: T.ink, color: T.paper, border: 'none', borderRadius: 4, fontFamily: T.serif, fontSize: 15, fontWeight: 500, letterSpacing: '-0.2px', cursor: 'pointer' }}>
        Tôi đã chuyển khoản
      </button>
      <div style={{ textAlign: 'center', fontFamily: T.serif, fontSize: 11, color: T.ink3, fontStyle: 'italic', marginTop: 10 }}>
        Không cần bấm nếu app tự xác nhận — màn hình sẽ tự chuyển khi nhận được tiền.
      </div>
    </Shell>
  )
}

// ─── Mock (design mode) ─────────────────────────────────────
function PaymentMock({ total, navigate }: { total: number; navigate: NavigateFunction }) {
  const secs = useCountdown(useMemo(() => Date.now() + 15 * 60 * 1000, []))
  return (
    <Shell onBack={() => navigate(-1)} secs={secs}>
      <Intro />
      <QrCard qr={null} waiting="Đang chờ thanh toán" />
      <TransferBlock holder={DEFAULT_HOLDER} account="0011 0000 123456" bank="Vietcombank" amountText={`${fmtVnd(total)}${CURRENCY}`} content="OFY8K2" />
      <button onClick={() => navigate('/success', { state: { total } })} style={{ width: '100%', marginTop: 18, padding: '16px', background: T.ink, color: T.paper, border: 'none', borderRadius: 4, fontFamily: T.serif, fontSize: 15, fontWeight: 500, letterSpacing: '-0.2px', cursor: 'pointer' }}>
        Tôi đã chuyển khoản
      </button>
      <div style={{ textAlign: 'center', fontFamily: T.serif, fontSize: 11, color: T.ink3, fontStyle: 'italic', marginTop: 10 }}>
        Không cần bấm nếu app tự xác nhận — màn hình sẽ tự chuyển khi nhận được tiền.
      </div>
    </Shell>
  )
}

export function PaymentSePay() {
  const navigate = useNavigate()
  const { bookingId = '' } = useParams()
  const { state } = useLocation() as { state: { total?: number } | null }
  const isMock = !apiEnabled || bookingId === 'mock'
  return isMock ? <PaymentMock total={state?.total ?? 940} navigate={navigate} /> : <PaymentReal bookingId={bookingId} navigate={navigate} />
}
