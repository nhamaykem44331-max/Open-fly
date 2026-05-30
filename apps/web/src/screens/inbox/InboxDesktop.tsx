// OpenFly — Notification inbox (desktop). Ported from desktop-account.jsx InboxPage,
// driven by the shared INBOX_ITEMS model (kind → icon/accent).
import { T } from '../../theme/tokens'
import { Eyebrow, Ic } from '../../components/ui'
import { Container } from '../../shell/Container'
import type { InboxItem } from '../../data/mock'
import { KindIcon } from './kindMeta'

export function InboxDesktop({ items, unreadCount, onMarkAllRead, onTap }: { items: InboxItem[]; unreadCount: number; onMarkAllRead: () => void; onTap: (n: InboxItem) => void }) {
  return (
    <div style={{ background: T.canvas, minHeight: '100%', paddingBottom: 70 }}>
      <Container max={760} style={{ paddingTop: 48 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <Eyebrow>Hộp thư</Eyebrow>
            <h1 style={{ fontFamily: T.serif, fontSize: 40, fontWeight: 300, letterSpacing: '-1.6px', color: T.ink, margin: '14px 0 0' }}>Thông báo</h1>
          </div>
          {unreadCount > 0 && (
            <button onClick={onMarkAllRead} style={{ padding: '8px 14px', borderRadius: 100, background: 'transparent', border: `1px solid ${T.line2}`, fontFamily: T.sans, fontSize: 11, fontWeight: 500, color: T.ink2, letterSpacing: 0.4, cursor: 'pointer' }}>
              Đánh dấu tất cả đã đọc
            </button>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 26 }}>
          {items.map((n) => (
            <div key={n.id} onClick={() => onTap(n)} style={{ display: 'flex', gap: 16, padding: 20, borderRadius: 12, cursor: 'pointer', background: n.unread ? T.paper : T.paper2, border: `1px solid ${n.unread ? T.line2 : T.line}` }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: n.kind === 'sol' ? T.inkBlock : T.paper2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <KindIcon kind={n.kind} size={19} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: T.serif, fontSize: 16.5, fontWeight: 500, color: T.ink }}>{n.title}</span>
                  {n.unread && <span style={{ width: 7, height: 7, borderRadius: '50%', background: T.rust, flexShrink: 0 }} />}
                </div>
                <div style={{ fontFamily: T.serif, fontSize: 14, color: T.ink2, fontStyle: 'italic', marginTop: 4, lineHeight: 1.5 }}>{n.body}</div>
                <div style={{ fontFamily: T.sans, fontSize: 11.5, color: T.ink3, marginTop: 6 }}>{n.when}{n.cta ? ` · ${n.cta.label}` : ''}</div>
              </div>
              <Ic.chevron size={16} stroke={T.ink3} />
            </div>
          ))}
        </div>
      </Container>
    </div>
  )
}
