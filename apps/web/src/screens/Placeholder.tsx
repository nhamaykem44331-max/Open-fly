import { T } from '../theme/tokens'
import { Sunmark, Eyebrow } from '../components/ui'

// Editorial "coming soon" placeholder for routes not yet built this milestone.
export function Placeholder({ title, body = 'Màn hình này sẽ được dựng trong các bước tiếp theo.', star = false }: { title: string; body?: string; star?: boolean }) {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 40px', textAlign: 'center' }}>
      <div style={{ opacity: 0.4 }}><Sunmark size={64} /></div>
      <Eyebrow dash={false} color={star ? T.rust : undefined} style={{ marginTop: 28 }}>
        {star ? 'Tính năng trọng tâm' : 'Sắp ra mắt'}
      </Eyebrow>
      <h2 style={{ fontFamily: T.serif, fontSize: 28, fontWeight: 400, letterSpacing: '-1px', color: T.ink, margin: '14px 0 12px', lineHeight: 1.1 }}>{title}</h2>
      <p style={{ fontFamily: T.serif, fontSize: 14, color: T.ink3, lineHeight: 1.55, margin: 0, fontStyle: 'italic', maxWidth: 320 }}>{body}</p>
    </div>
  )
}
