// Dev-only kitchen sink — renders every ported primitive for visual QA in both
// themes. Wired to a /dev route later; not part of the shipped app surface.
import type { ReactNode } from 'react'
import { T } from '../theme/tokens'
import { useThemeStore } from '../theme/theme'
import { Ic, Sunmark, Wordmark, Eyebrow, Chip, Price, AirlineBadge, RouteLine, Sparkline, Divider, Card } from '../components/ui'
import { SearchTimeout } from '../screens/states/SearchTimeout'
import { PaymentFailed } from '../screens/states/PaymentFailed'
import { BookingFailedSoldOut } from '../screens/states/BookingFailedSoldOut'
import { BookingFailedPriceChange } from '../screens/states/BookingFailedPriceChange'

const AIRLINE_COLORS: Record<string, string> = { VN: '#003B71', VJ: '#E40028', QH: '#0E7A6B', BL: '#FF6B00' }
const ICON_NAMES = Object.keys(Ic) as (keyof typeof Ic)[]

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={{ marginTop: 32 }}>
      <Eyebrow>{title}</Eyebrow>
      <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>{children}</div>
    </section>
  )
}

// A mobile-sized frame so full-screen states can be QA'd side by side in the kitchen.
function ErrFrame({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ width: 360 }}>
      <div style={{ fontFamily: T.sans, fontSize: 11, color: T.ink3, marginBottom: 8 }}>{label}</div>
      <div style={{ height: 640, border: `1px solid ${T.line2}`, borderRadius: 12, overflow: 'auto', background: T.paper }}>{children}</div>
    </div>
  )
}

export default function Kitchen() {
  const resolved = useThemeStore((s) => s.resolved)
  const toggle = useThemeStore((s) => s.toggle)

  return (
    <div style={{ minHeight: '100vh', background: T.canvas, color: T.ink, padding: '32px 24px' }}>
      <div style={{ maxWidth: 920, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Wordmark size={24} />
          <button onClick={toggle} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 100, border: `1px solid ${T.line2}`, background: 'transparent', color: T.ink, fontFamily: T.sans, fontSize: 12, fontWeight: 500 }}>
            {resolved === 'dark' ? <Ic.sun size={14} stroke={T.ink} /> : <Ic.moon size={14} stroke={T.ink} />}
            {resolved === 'dark' ? 'Sáng' : 'Tối'}
          </button>
        </div>

        <h1 style={{ fontFamily: T.serif, fontSize: 32, fontWeight: 400, letterSpacing: '-1.2px', margin: '24px 0 0' }}>
          Design system <em style={{ color: T.rust, fontWeight: 500 }}>kitchen sink</em>
        </h1>

        <Section title="Logo / Sunmark">
          <Sunmark size={48} />
          <Sunmark size={32} color={T.ink} />
          <Wordmark size={28} />
        </Section>

        <Section title="Eyebrow">
          <Eyebrow>Săn vé tự động</Eyebrow>
          <Eyebrow dash={false} color={T.rust}>Sol gợi ý</Eyebrow>
        </Section>

        <Section title="Chips">
          <Chip active>Một chiều</Chip>
          <Chip>Khứ hồi</Chip>
          <Chip icon={<Ic.sparkle size={13} stroke={T.rust} />}>Sol đề xuất</Chip>
          <Chip>Bay nhanh</Chip>
        </Section>

        <Section title="Price">
          <Price value={890} />
          <Price value={1450} size={22} />
          <Price value={2592} size={18} color={T.rust} italic />
        </Section>

        <Section title="Airline badge">
          {Object.keys(AIRLINE_COLORS).map((code) => (
            <AirlineBadge key={code} code={code} color={AIRLINE_COLORS[code]} />
          ))}
        </Section>

        <Section title="Route line · Sparkline">
          <div style={{ width: 200 }}><RouteLine from="HAN" to="DAD" /></div>
          <Sparkline data={[1280, 1340, 1180, 1090, 980, 960, 890]} />
          <Sparkline data={[1100, 1050, 980, 920, 890, 900, 870]} color={T.green} />
        </Section>

        <section style={{ marginTop: 32 }}>
          <Eyebrow>Cards</Eyebrow>
          <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
            <Card>
              <Eyebrow dash={false}>Card thường</Eyebrow>
              <div style={{ fontFamily: T.serif, fontSize: 18, marginTop: 8 }}>Viền 1px mảnh, không shadow</div>
            </Card>
            <Card featured>
              <Eyebrow dash={false} color={T.rust}>Featured</Eyebrow>
              <div style={{ fontFamily: T.serif, fontSize: 18, marginTop: 8 }}>Viền Ink đậm hơn</div>
            </Card>
          </div>
        </section>

        <Divider label="Icons" style={{ marginTop: 32 }} />
        <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 18 }}>
          {ICON_NAMES.map((name) => {
            const IconCmp = Ic[name]
            return (
              <div key={name} style={{ width: 64, textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center' }}><IconCmp size={20} stroke={T.ink2} /></div>
                <div style={{ fontFamily: T.sans, fontSize: 9, color: T.ink3, marginTop: 6 }}>{name}</div>
              </div>
            )
          })}
        </div>

        <section style={{ marginTop: 32 }}>
          <Eyebrow>Error states</Eyebrow>
          <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 20 }}>
            <ErrFrame label="Search timeout"><SearchTimeout /></ErrFrame>
            <ErrFrame label="Payment failed"><PaymentFailed /></ErrFrame>
            <ErrFrame label="Booking — sold out"><BookingFailedSoldOut /></ErrFrame>
            <ErrFrame label="Booking — price change"><BookingFailedPriceChange /></ErrFrame>
          </div>
        </section>
      </div>
    </div>
  )
}
