// OpenFly — Home loading skeleton. Mobile mirrors screens-states-loading.jsx 1:1;
// desktop approximates the dashboard grid.
import { T } from '../../theme/tokens'
import { SkBox, SkLine, SkCircle, SkEyebrow, SkCard } from '../../components/ui'
import { Container } from '../../shell/Container'

const PULSE = 'skPulse 1.6s ease-in-out infinite'

function HomeSkeletonMobile() {
  return (
    <div style={{ background: T.paper, minHeight: '100%', paddingBottom: 100 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px 0' }}>
        <SkBox w={110} h={22} r={4} />
        <div style={{ display: 'flex', gap: 10 }}><SkCircle size={36} /><SkCircle size={36} /></div>
      </div>
      <div style={{ padding: '28px 24px 0' }}>
        <SkEyebrow />
        <div style={{ marginTop: 14 }}>
          <SkLine w="80%" h={28} />
          <div style={{ marginTop: 10 }}><SkLine w="60%" h={28} /></div>
        </div>
        <div style={{ marginTop: 8, height: 140, borderRadius: 4, background: T.paper2, opacity: 0.5, animation: PULSE }} />
      </div>
      <div style={{ padding: '8px 20px 0' }}>
        <SkCard p={14} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <SkCircle size={28} />
          <div style={{ flex: 1 }}><SkLine w={80} h={9} /><div style={{ marginTop: 6 }}><SkLine w="70%" h={12} /></div></div>
        </SkCard>
      </div>
      <div style={{ padding: '16px 20px 0' }}>
        <SkCard p={4}>
          <div style={{ display: 'flex', gap: 12, padding: 14 }}>
            <div style={{ flex: 1 }}><SkLine w={40} h={9} /><div style={{ marginTop: 6 }}><SkLine w={80} h={20} /></div></div>
            <div style={{ flex: 1 }}><SkLine w={40} h={9} /><div style={{ marginTop: 6 }}><SkLine w={80} h={20} /></div></div>
          </div>
          <div style={{ height: 1, background: T.line, margin: '0 12px' }} />
          <div style={{ display: 'flex', gap: 12, padding: 14 }}>
            <div style={{ flex: 1 }}><SkLine w={50} h={9} /><div style={{ marginTop: 6 }}><SkLine w="80%" h={14} /></div></div>
            <div style={{ flex: 1 }}><SkLine w={50} h={9} /><div style={{ marginTop: 6 }}><SkLine w="80%" h={14} /></div></div>
          </div>
          <div style={{ height: 52, margin: '4px 0 0', borderRadius: 4, background: T.paper3, opacity: 0.55, animation: PULSE }} />
        </SkCard>
      </div>
      <div style={{ padding: '28px 0 0' }}>
        <div style={{ padding: '0 20px 12px' }}>
          <SkEyebrow />
          <div style={{ marginTop: 6 }}><SkLine w="60%" h={18} /></div>
        </div>
        <div style={{ display: 'flex', gap: 12, padding: '0 20px', overflow: 'hidden' }}>
          {[0, 1].map((i) => (
            <SkCard key={i} p={16} style={{ minWidth: 246 }}>
              <SkLine w={90} h={10} />
              <div style={{ marginTop: 10 }}><SkLine w={120} h={22} /></div>
              <div style={{ marginTop: 6 }}><SkLine w="80%" h={10} /></div>
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${T.line}`, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <div><SkLine w={60} h={9} /><div style={{ marginTop: 4 }}><SkLine w={70} h={20} /></div></div>
                <SkBox w={64} h={22} r={3} />
              </div>
            </SkCard>
          ))}
        </div>
      </div>
      <div style={{ padding: '28px 0 0' }}>
        <div style={{ padding: '0 20px 12px' }}>
          <SkEyebrow />
          <div style={{ marginTop: 6 }}><SkLine w="55%" h={18} /></div>
        </div>
        <div style={{ display: 'flex', gap: 12, padding: '0 20px', overflow: 'hidden' }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ minWidth: 168, background: T.paper, border: `1px solid ${T.line}`, borderRadius: 6, overflow: 'hidden' }}>
              <div style={{ height: 96, background: T.paper2, opacity: 0.5, animation: PULSE }} />
              <div style={{ padding: 14 }}>
                <SkLine w="70%" h={14} />
                <div style={{ marginTop: 6 }}><SkLine w="90%" h={10} /></div>
                <div style={{ marginTop: 8 }}><SkLine w={60} h={14} /></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: '28px 20px 0' }}>
        <SkEyebrow />
        <div style={{ marginTop: 12, padding: 16, borderRadius: 6, background: T.paper3, opacity: 0.5, animation: PULSE, height: 116 }} />
      </div>
    </div>
  )
}

function HomeSkeletonDesktop() {
  return (
    <div style={{ background: T.canvas, minHeight: '100%', paddingBottom: 70 }}>
      <Container max={1320} style={{ paddingTop: 52 }}>
        <SkEyebrow />
        <div style={{ margin: '16px 0 28px' }}>
          <SkLine w="55%" h={48} />
        </div>
        <div style={{ height: 80, borderRadius: 12, background: T.paper, border: `1px solid ${T.line2}`, opacity: 0.6, animation: PULSE }} />
      </Container>
      <Container max={1320} style={{ paddingTop: 44 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 40, alignItems: 'start' }}>
          <div>
            <SkEyebrow />
            <div style={{ marginTop: 8, marginBottom: 18 }}><SkLine w="40%" h={26} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[0, 1].map((i) => (
                <SkCard key={i} p={20} style={{ borderRadius: 8 }}>
                  <SkLine w={120} h={10} />
                  <div style={{ marginTop: 14 }}><SkLine w={160} h={28} /></div>
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${T.line}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div><SkLine w={70} h={9} /><div style={{ marginTop: 6 }}><SkLine w={90} h={24} /></div></div>
                    <SkBox w={96} h={34} r={3} />
                  </div>
                </SkCard>
              ))}
            </div>
            <div style={{ marginTop: 44, marginBottom: 18 }}><SkEyebrow /><div style={{ marginTop: 8 }}><SkLine w="35%" h={26} /></div></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {[0, 1, 2].map((i) => (
                <SkCard key={i} p={0} style={{ borderRadius: 8, overflow: 'hidden' }}>
                  <div style={{ height: 120, background: T.paper2, opacity: 0.5, animation: PULSE }} />
                  <div style={{ padding: 16 }}><SkLine w="70%" h={16} /><div style={{ marginTop: 8 }}><SkLine w="90%" h={11} /></div><div style={{ marginTop: 10 }}><SkLine w={60} h={16} /></div></div>
                </SkCard>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <SkCard p={20} style={{ borderRadius: 10, height: 96 }} />
            <SkCard p={22} style={{ borderRadius: 10, height: 170, background: T.paper3, opacity: 0.5 }} />
            <SkCard p={18} style={{ borderRadius: 10, height: 72 }} />
            <SkCard p={18} style={{ borderRadius: 10, height: 72 }} />
          </div>
        </div>
      </Container>
    </div>
  )
}

export function HomeSkeleton({ desktop = false }: { desktop?: boolean }) {
  return desktop ? <HomeSkeletonDesktop /> : <HomeSkeletonMobile />
}
