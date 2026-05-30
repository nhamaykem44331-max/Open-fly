// OpenFly — Hunt detail loading skeleton (mobile + desktop), compact.
import { T } from '../../theme/tokens'
import { SkLine, SkCard } from '../../components/ui'
import { Container } from '../../shell/Container'

const PULSE = 'skPulse 1.6s ease-in-out infinite'

function ChartSk({ h = 200 }: { h?: number }) {
  return <div style={{ height: h, borderRadius: 4, background: T.paper2, opacity: 0.5, animation: PULSE }} />
}

function Mobile() {
  return (
    <div style={{ background: T.paper, minHeight: '100%', paddingBottom: 100, padding: '14px 20px 0' }}>
      <SkLine w={120} h={11} />
      <div style={{ marginTop: 16 }}><SkLine w={200} h={32} /></div>
      <div style={{ marginTop: 10 }}><SkLine w="60%" h={13} /></div>
      <div style={{ marginTop: 18 }}><SkCard p={18}><SkLine w={140} h={10} /><div style={{ marginTop: 12 }}><ChartSk /></div></SkCard></div>
      <div style={{ marginTop: 16 }}><SkCard p={16} style={{ background: T.paper2, height: 80 }} /></div>
    </div>
  )
}

function Desktop() {
  return (
    <div style={{ background: T.canvas, minHeight: '100%' }}>
      <Container max={1140} style={{ paddingTop: 40 }}>
        <SkLine w={300} h={30} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 28, alignItems: 'start', marginTop: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <SkCard p={28} style={{ borderRadius: 12 }}><SkLine w={180} h={14} /><div style={{ marginTop: 16 }}><ChartSk h={280} /></div></SkCard>
            <SkCard p={26} style={{ borderRadius: 12, background: T.paper3, opacity: 0.5, height: 110 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <SkCard p={26} style={{ borderRadius: 12, height: 200 }} />
            <SkCard p={24} style={{ borderRadius: 12, height: 160 }} />
          </div>
        </div>
      </Container>
    </div>
  )
}

export function HunterDetailSkeleton({ desktop = false }: { desktop?: boolean }) {
  return desktop ? <Desktop /> : <Mobile />
}
