// OpenFly — Inbox route: fetches /notifications, wires mark-read / mark-all-read.
import { useNavigate } from 'react-router-dom'
import { useViewport } from '../../shell/useViewport'
import { useNotifications, useMarkRead, useMarkAllRead } from '../../data/useInbox'
import type { InboxItem } from '../../data/mock'
import { InboxMobile } from './InboxMobile'
import { InboxDesktop } from './InboxDesktop'
import { InboxSkeleton } from './InboxSkeleton'
import { GenericError } from '../states/GenericError'

export function InboxRoute() {
  const navigate = useNavigate()
  const { isDesktop } = useViewport()
  const q = useNotifications()
  const markRead = useMarkRead()
  const markAllRead = useMarkAllRead()

  if (q.isLoading || !q.data) return <InboxSkeleton desktop={isDesktop} />
  if (q.isError) return <GenericError onRetry={() => q.refetch()} onContactSol={() => navigate('/sol')} />

  const { items, unreadCount } = q.data
  const onMarkAllRead = () => markAllRead.mutate()
  const onTap = (n: InboxItem) => {
    if (n.unread) markRead.mutate(n.id)
    if (n.cta) navigate(n.cta.href)
  }

  return isDesktop
    ? <InboxDesktop items={items} unreadCount={unreadCount} onMarkAllRead={onMarkAllRead} onTap={onTap} />
    : <InboxMobile items={items} unreadCount={unreadCount} onMarkAllRead={onMarkAllRead} onTap={onTap} />
}
