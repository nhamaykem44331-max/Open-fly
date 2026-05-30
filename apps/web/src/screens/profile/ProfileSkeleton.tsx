// OpenFly — Profile loading skeleton (mobile + desktop).
import { T } from '../../theme/tokens'
import { SkBox, SkLine, SkCircle, SkEyebrow, SkCard } from '../../components/ui'
import { Container } from '../../shell/Container'

export function ProfileSkeleton({ desktop = false }: { desktop?: boolean }) {
  if (desktop) {
    return (
      <div style={{ background: T.canvas, minHeight: '100%' }}>
        <Container max={1100} style={{ paddingTop: 48 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, padding: 32, borderRadius: 16, background: T.inkBlock, marginBottom: 28 }}>
            <SkCircle size={76} />
            <div style={{ flex: 1 }}>
              <SkLine w={200} h={28} />
              <div style={{ marginTop: 10 }}><SkLine w={260} h={12} /></div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>
            {[0, 1].map((card) => (
              <SkCard key={card} p={26} style={{ borderRadius: 12 }}>
                <SkLine w={120} h={12} />
                <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {[0, 1, 2].map((i) => (
                    <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                      <SkCircle size={40} />
                      <div style={{ flex: 1 }}><SkLine w="60%" h={14} /></div>
                    </div>
                  ))}
                </div>
              </SkCard>
            ))}
          </div>
        </Container>
      </div>
    )
  }
  return (
    <div style={{ background: T.paper, minHeight: '100%', padding: '14px 20px 0' }}>
      <SkEyebrow />
      <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <SkCircle size={76} />
        <SkLine w={140} h={22} />
        <SkLine w={180} h={12} />
      </div>
      <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', border: `1px solid ${T.line}`, borderRadius: 6, overflow: 'hidden' }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ padding: '16px 12px', display: 'flex', justifyContent: 'center', borderLeft: i > 0 ? `1px solid ${T.line}` : 'none' }}>
            <SkLine w={40} h={22} />
          </div>
        ))}
      </div>
      <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[0, 1, 2].map((i) => (
          <SkCard key={i}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <SkBox w={30} h={30} r={4} />
              <div style={{ flex: 1 }}><SkLine w="50%" h={14} /></div>
            </div>
          </SkCard>
        ))}
      </div>
    </div>
  )
}
