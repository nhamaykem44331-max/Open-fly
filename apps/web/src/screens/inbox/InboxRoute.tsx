// OpenFly — Inbox route: holds read-state (no async fetch), layout by breakpoint.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useViewport } from '../../shell/useViewport'
import { INBOX_ITEMS } from '../../data/mock'
import type { InboxItem } from '../../data/mock'
import { InboxMobile } from './InboxMobile'
import { InboxDesktop } from './InboxDesktop'

export function InboxRoute() {
  const navigate = useNavigate()
  const { isDesktop } = useViewport()
  const [items, setItems] = useState<InboxItem[]>(INBOX_ITEMS)
  const unreadCount = items.filter((x) => x.unread).length

  const markAllRead = () => setItems((it) => it.map((x) => ({ ...x, unread: false })))
  const tap = (n: InboxItem) => {
    setItems((it) => it.map((x) => (x.id === n.id ? { ...x, unread: false } : x)))
    if (n.cta) navigate(n.cta.href)
  }

  return isDesktop
    ? <InboxDesktop items={items} unreadCount={unreadCount} onMarkAllRead={markAllRead} onTap={tap} />
    : <InboxMobile items={items} unreadCount={unreadCount} onMarkAllRead={markAllRead} onTap={tap} />
}
