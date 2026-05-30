// Notification mockups — static, no fetch.
import { useViewport } from '../../shell/useViewport'
import { HunterNotifsMobile } from './HunterNotifsMobile'
import { HunterNotifsDesktop } from './HunterNotifsDesktop'

export function HunterNotifsRoute() {
  const { isDesktop } = useViewport()
  return isDesktop ? <HunterNotifsDesktop /> : <HunterNotifsMobile />
}
