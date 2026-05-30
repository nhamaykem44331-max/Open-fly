// OpenFly — Inbox loading skeleton (mobile + desktop).
import { T } from '../../theme/tokens'
import { SkLine, SkCircle, SkEyebrow } from '../../components/ui'
import { Container } from '../../shell/Container'

function RowSk() {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '14px 16px', border: `1px solid ${T.line}`, borderRadius: 6 }}>
      <SkCircle size={32} />
      <div style={{ flex: 1 }}>
        <SkLine w="70%" h={14} />
        <div style={{ marginTop: 8 }}><SkLine w="90%" h={11} /></div>
      </div>
    </div>
  )
}

export function InboxSkeleton({ desktop = false }: { desktop?: boolean }) {
  const rows = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {[0, 1, 2, 3].map((i) => <RowSk key={i} />)}
    </div>
  )
  if (desktop) {
    return (
      <div style={{ background: T.canvas, minHeight: '100%' }}>
        <Container max={780} style={{ paddingTop: 40 }}>
          <SkEyebrow />
          <div style={{ margin: '14px 0 24px' }}><SkLine w="50%" h={36} /></div>
          {rows}
        </Container>
      </div>
    )
  }
  return (
    <div style={{ background: T.paper, minHeight: '100%', padding: '14px 20px 0' }}>
      <SkEyebrow />
      <div style={{ margin: '16px 0 22px' }}><SkLine w="70%" h={28} /></div>
      {rows}
    </div>
  )
}
