// OpenFly — Fare Hunter list loading skeleton (mobile + desktop).
import { T } from '../../theme/tokens'
import { SkBox, SkLine, SkEyebrow, SkCard } from '../../components/ui'
import { Container } from '../../shell/Container'

function CardSk({ p = 18 }: { p?: number }) {
  return (
    <SkCard p={p} style={{ borderRadius: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <SkBox w={7} h={7} r={4} /><SkLine w={120} h={10} />
      </div>
      <SkLine w={180} h={26} />
      <div style={{ marginTop: 6 }}><SkLine w="70%" h={11} /></div>
      <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${T.line}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div><SkLine w={70} h={10} /><div style={{ marginTop: 6 }}><SkLine w={100} h={22} /></div></div>
        <SkBox w={96} h={34} r={3} />
      </div>
    </SkCard>
  )
}

function HunterListSkeletonMobile() {
  return (
    <div style={{ background: T.paper, minHeight: '100%', paddingBottom: 100 }}>
      <div style={{ padding: '14px 20px 0' }}>
        <SkEyebrow />
        <div style={{ marginTop: 12 }}><SkLine w="80%" h={28} /></div>
        <div style={{ marginTop: 8 }}><SkLine w="90%" h={13} /></div>
      </div>
      <div style={{ margin: '18px 20px 16px', height: 64, borderRadius: 6, background: T.paper3, opacity: 0.5, animation: 'skPulse 1.6s ease-in-out infinite' }} />
      <div style={{ display: 'flex', gap: 8, padding: '0 20px 14px' }}>{[80, 100, 110].map((w, i) => <SkBox key={i} w={w} h={32} r={100} />)}</div>
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>{[0, 1, 2].map((i) => <CardSk key={i} />)}</div>
    </div>
  )
}

function HunterListSkeletonDesktop() {
  return (
    <div style={{ background: T.canvas, minHeight: '100%' }}>
      <div style={{ background: T.inkBlock, height: 260 }} />
      <Container max={1240} style={{ paddingTop: 36 }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 22 }}>{[80, 100, 110].map((w, i) => <SkBox key={i} w={w} h={36} r={100} />)}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>{[0, 1, 2, 3].map((i) => <CardSk key={i} p={24} />)}</div>
      </Container>
    </div>
  )
}

export function HunterListSkeleton({ desktop = false }: { desktop?: boolean }) {
  return desktop ? <HunterListSkeletonDesktop /> : <HunterListSkeletonMobile />
}
