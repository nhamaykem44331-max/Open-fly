// OpenFly — Notification inbox (mobile). Ported from screens-polish.jsx InboxScreen.
import { useNavigate } from 'react-router-dom'
import { T } from '../../theme/tokens'
import { Eyebrow, Ic } from '../../components/ui'
import type { InboxItem } from '../../data/mock'
import { KIND_ACCENT, KindIcon } from './kindMeta'

function SectionDivider({ label }: { label: string }) {
  return (
    <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontFamily: T.sans, fontSize: 10, fontWeight: 600, letterSpacing: 1.8, textTransform: 'uppercase', color: T.ink3 }}>— {label}</span>
      <div style={{ flex: 1, height: 1, background: T.line }} />
    </div>
  )
}

function InboxRow({ n, onTap, first, last }: { n: InboxItem; onTap: () => void; first: boolean; last: boolean }) {
  const accent = KIND_ACCENT[n.kind]
  const ctaColor = accent === T.ink2 ? T.ink : accent
  return (
    <button
      onClick={onTap}
      style={{
        width: '100%', padding: '14px 16px',
        background: n.unread ? T.paper : T.paper2,
        border: `1px solid ${T.line}`,
        borderTop: first ? `1px solid ${T.line}` : 'none',
        borderRadius: first && last ? 6 : first ? '6px 6px 0 0' : last ? '0 0 6px 6px' : 0,
        display: 'flex', gap: 12, alignItems: 'flex-start',
        cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s', position: 'relative',
      }}
    >
      {n.unread && <div style={{ position: 'absolute', left: 0, top: 14, bottom: 14, width: 2, background: T.rust, borderRadius: 100 }} />}
      <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: n.kind === 'sol' ? T.inkBlock : T.paper, border: `1px solid ${T.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <KindIcon kind={n.kind} size={16} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <div style={{ flex: 1, fontFamily: T.serif, fontSize: 14, color: T.ink, fontWeight: n.unread ? 500 : 400, letterSpacing: '-0.2px', lineHeight: 1.3 }}>{n.title}</div>
          <div style={{ fontFamily: T.sans, fontSize: 10, color: T.ink3, letterSpacing: 0.3, flexShrink: 0 }}>{n.when}</div>
        </div>
        <div style={{ fontFamily: T.serif, fontSize: 12.5, color: T.ink3, fontStyle: 'italic', marginTop: 4, lineHeight: 1.45 }}>{n.body}</div>
        {n.cta && (
          <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: T.sans, fontSize: 10, fontWeight: 600, color: ctaColor, letterSpacing: 1, textTransform: 'uppercase' }}>
            {n.cta.label} <Ic.arrow size={10} stroke={ctaColor} />
          </div>
        )}
      </div>
    </button>
  )
}

export function InboxMobile({ items, unreadCount, onMarkAllRead, onTap }: { items: InboxItem[]; unreadCount: number; onMarkAllRead: () => void; onTap: (n: InboxItem) => void }) {
  const navigate = useNavigate()
  const today = items.filter((x) => x.group === 'today')
  const earlier = items.filter((x) => x.group === 'earlier')
  return (
    <div style={{ background: T.paper, minHeight: '100%', paddingBottom: 24 }}>
      <div style={{ padding: '14px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate(-1)} style={{ width: 36, height: 36, borderRadius: '50%', background: 'transparent', border: `1px solid ${T.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Ic.back size={16} stroke={T.ink} />
          </button>
          <div style={{ flex: 1 }}><Eyebrow dash={false}>Hộp thư</Eyebrow></div>
          {unreadCount > 0 && (
            <button onClick={onMarkAllRead} style={{ padding: '6px 12px', borderRadius: 100, background: 'transparent', border: `1px solid ${T.line2}`, fontFamily: T.sans, fontSize: 10, fontWeight: 500, color: T.ink2, letterSpacing: 0.4, cursor: 'pointer' }}>
              Đánh dấu đã đọc
            </button>
          )}
        </div>
        <h1 style={{ fontFamily: T.serif, fontSize: 30, fontWeight: 400, letterSpacing: '-1.1px', lineHeight: 1.05, color: T.ink, margin: '18px 0 6px' }}>
          {unreadCount > 0 ? (
            <>Bạn có <em style={{ color: T.rust, fontWeight: 500 }}>{unreadCount} tin mới</em>.</>
          ) : (
            <>Mọi thứ đã <em style={{ color: T.rust, fontWeight: 500 }}>được xem qua</em>.</>
          )}
        </h1>
        <p style={{ fontFamily: T.serif, fontSize: 13, color: T.ink3, fontStyle: 'italic', margin: '0 0 20px', lineHeight: 1.5 }}>
          Sol và các cập nhật từ chuyến bay của bạn — một nơi duy nhất.
        </p>
      </div>

      {today.length > 0 && (
        <>
          <SectionDivider label="Hôm nay" />
          <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 1 }}>
            {today.map((n, i) => <InboxRow key={n.id} n={n} onTap={() => onTap(n)} first={i === 0} last={i === today.length - 1} />)}
          </div>
        </>
      )}

      {earlier.length > 0 && (
        <>
          <SectionDivider label="Trước đó" />
          <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 1 }}>
            {earlier.map((n, i) => <InboxRow key={n.id} n={n} onTap={() => onTap(n)} first={i === 0} last={i === earlier.length - 1} />)}
          </div>
        </>
      )}

      <div style={{ padding: '28px 20px 0' }}>
        <button onClick={() => navigate('/profile')} style={{ width: '100%', padding: '14px 18px', background: T.paper, border: `1px solid ${T.line}`, borderRadius: 6, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left' }}>
          <Ic.bell size={16} stroke={T.ink2} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: T.serif, fontSize: 13, fontWeight: 500, color: T.ink, letterSpacing: '-0.2px' }}>Cài đặt thông báo</div>
            <div style={{ fontFamily: T.sans, fontSize: 11, color: T.ink3, marginTop: 1 }}>Quản lý Telegram, Email, Zalo, Push</div>
          </div>
          <Ic.chevron size={12} stroke={T.ink3} />
        </button>
      </div>

      <div style={{ padding: '28px 24px 16px', textAlign: 'center' }}>
        <Eyebrow dash={false} style={{ color: T.ink4 }}>Một biểu tượng thầm lặng</Eyebrow>
      </div>
    </div>
  )
}
