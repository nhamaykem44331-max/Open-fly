// Inbox notification kind → accent colour + glyph. Shared by mobile + desktop.
import { T } from '../../theme/tokens'
import { Ic } from '../../components/ui'
import type { InboxKind } from '../../data/mock'

export const KIND_ACCENT: Record<InboxKind, string> = {
  'hunt-found': T.green,
  booking: T.amber,
  sol: T.rust,
  price: T.ink2,
  voucher: T.rust,
  checkin: T.ink2,
}

export function KindIcon({ kind, size = 16 }: { kind: InboxKind; size?: number }) {
  const a = KIND_ACCENT[kind]
  switch (kind) {
    case 'hunt-found':
      return <Ic.radar size={size} stroke={a} sw={1.6} />
    case 'booking':
      return <Ic.ticket size={size} stroke={a} sw={1.6} />
    case 'sol':
      return <span style={{ fontFamily: T.serif, fontSize: size * 0.8, color: a, fontStyle: 'italic', fontWeight: 600, marginTop: -1 }}>S</span>
    case 'price':
      return <Ic.trend size={size} stroke={a} sw={1.6} />
    case 'voucher':
      return <Ic.spark size={size} stroke={a} sw={1.6} />
    case 'checkin':
      return <Ic.check size={size} stroke={a} sw={1.6} />
  }
}
