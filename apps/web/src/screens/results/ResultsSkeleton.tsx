// OpenFly — Results loading skeleton. Mobile mirrors screens-states-loading.jsx.
import { T } from '../../theme/tokens'
import { SkBox, SkLine, SkCircle, SkCard } from '../../components/ui'
import { Container } from '../../shell/Container'

const PULSE = 'skPulse 1.6s ease-in-out infinite'

function ResultsSkeletonMobile() {
  return (
    <div style={{ background: T.paper, minHeight: '100%', paddingBottom: 80 }}>
      <div style={{ padding: '12px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <SkCircle size={36} />
          <div style={{ flex: 1 }}>
            <SkLine w="60%" h={18} />
            <div style={{ marginTop: 6 }}><SkLine w="80%" h={10} /></div>
          </div>
          <SkCircle size={36} />
        </div>
        <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 4, background: T.paper2, opacity: 0.6, animation: PULSE, height: 36 }} />
      </div>
      <div style={{ display: 'flex', gap: 8, padding: '16px 20px 4px' }}>
        {[64, 80, 70, 56, 60].map((w, i) => <SkBox key={i} w={w} h={32} r={100} />)}
      </div>
      <div style={{ padding: '12px 20px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <SkCard key={i} p={16}>
            {i === 0 && <div style={{ margin: '-16px -16px 12px', padding: '8px 16px', height: 24, background: T.paper2, opacity: 0.7, animation: PULSE }} />}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <SkBox w={28} h={28} r={6} />
              <div style={{ flex: 1 }}>
                <SkLine w={80} h={11} />
                <div style={{ marginTop: 4 }}><SkLine w={120} h={9} /></div>
              </div>
              <div style={{ textAlign: 'right' }}><SkLine w={70} h={20} /></div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0' }}>
              <div><SkLine w={50} h={20} /><div style={{ marginTop: 4 }}><SkLine w={30} h={10} /></div></div>
              <div style={{ flex: 1, height: 1, background: T.line2 }} />
              <div style={{ textAlign: 'right' }}><SkLine w={50} h={20} /><div style={{ marginTop: 4 }}><SkLine w={30} h={10} /></div></div>
            </div>
          </SkCard>
        ))}
      </div>
    </div>
  )
}

function ResultsSkeletonDesktop() {
  return (
    <div style={{ background: T.canvas, minHeight: '100%', paddingBottom: 80 }}>
      <Container max={1240} style={{ paddingTop: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <SkCircle size={42} />
          <div style={{ flex: 1 }}>
            <SkLine w={260} h={30} />
            <div style={{ marginTop: 8 }}><SkLine w="50%" h={13} /></div>
          </div>
          <SkBox w={150} h={36} r={4} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '256px 1fr', gap: 28, alignItems: 'start' }}>
          <SkCard p={22} style={{ borderRadius: 10, height: 320 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <SkCard key={i} p={0} style={{ borderRadius: 8 }}>
                <div style={{ padding: '22px 26px', display: 'flex', alignItems: 'center', gap: 28 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, width: 200 }}>
                    <SkBox w={40} h={40} r={7} />
                    <div style={{ flex: 1 }}><SkLine w="80%" h={13} /><div style={{ marginTop: 5 }}><SkLine w="60%" h={11} /></div></div>
                  </div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 18 }}>
                    <SkLine w={56} h={26} />
                    <div style={{ flex: 1, height: 1, background: T.line2 }} />
                    <SkLine w={56} h={26} />
                  </div>
                  <div style={{ width: 180, textAlign: 'right' }}><SkLine w={90} h={28} /><div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}><SkBox w={80} h={32} r={4} /></div></div>
                </div>
              </SkCard>
            ))}
          </div>
        </div>
      </Container>
    </div>
  )
}

export function ResultsSkeleton({ desktop = false }: { desktop?: boolean }) {
  return desktop ? <ResultsSkeletonDesktop /> : <ResultsSkeletonMobile />
}
