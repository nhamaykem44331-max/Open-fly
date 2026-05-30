// Profile reads static mock (no async fetch) → layout by breakpoint only.
import { useViewport } from '../../shell/useViewport'
import { ProfileMobile } from './ProfileMobile'
import { ProfileDesktop } from './ProfileDesktop'

export function ProfileRoute() {
  const { isDesktop } = useViewport()
  return isDesktop ? <ProfileDesktop /> : <ProfileMobile />
}
