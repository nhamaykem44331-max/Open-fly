// OpenFly — Trips loading skeletons (compact, mobile + desktop).
import { T } from '../../theme/tokens'
import { SkBox, SkLine, SkEyebrow, SkCard } from '../../components/ui'
import { Container } from '../../shell/Container'

const PULSE = 'skPulse 1.6s ease-in-out infinite'

function CardSk({ p = 16 }: { p?: number }) {
  return (
    <SkCard p={p} style={{ borderRadius: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}><SkBox w={26} h={26} r={6} /><div style={{ flex: 1 }}><SkLine w={80} h={11} /></div><SkLine w={60} h={13} /></div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><SkLine w={56} h={22} /><div style={{ flex: 1, height: 1, background: T.line2 }} /><SkLine w={56} h={22} /></div>
    </SkCard>
  )
}

export function TripsListSkeleton({ desktop = false }: { desktop?: boolean }) {
  if (desktop) {
    return (
      <div style={{ background: T.canvas, minHeight: '100%' }}>
        <Container max={1100} style={{ paddingTop: 48 }}>
          <SkEyebrow /><div style={{ margin: '14px 0 24px' }}><SkLine w="40%" h={44} /></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{[0, 1, 2].map((i) => <CardSk key={i} p={22} />)}</div>
        </Container>
      </div>
    )
  }
  return (
    <div style={{ background: T.paper, minHeight: '100%', padding: '14px 20px 0' }}>
      <SkEyebrow /><div style={{ margin: '12px 0 18px' }}><SkLine w="70%" h={28} /></div>
      <div style={{ height: 44, borderRadius: 100, background: T.paper2, marginBottom: 18, opacity: 0.6, animation: PULSE }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{[0, 1, 2].map((i) => <CardSk key={i} />)}</div>
    </div>
  )
}

export function BookingDetailSkeleton({ desktop = false }: { desktop?: boolean }) {
  const inner = (
    <>
      <div style={{ height: desktop ? 200 : 280, borderRadius: 12, background: T.paper3, opacity: 0.5, animation: PULSE }} />
      <div style={{ marginTop: 16, height: 120, borderRadius: 12, background: T.paper3, opacity: 0.45, animation: PULSE }} />
    </>
  )
  if (desktop) return <div style={{ background: T.canvas, minHeight: '100%' }}><Container max={1100} style={{ paddingTop: 40 }}><SkLine w={300} h={30} /><div style={{ marginTop: 20 }}>{inner}</div></Container></div>
  return <div style={{ background: T.paper2, minHeight: '100%', padding: '20px 20px 0' }}>{inner}</div>
}
