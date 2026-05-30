// Create form — local catalog only, no async fetch.
import { useViewport } from '../../shell/useViewport'
import { HunterCreateMobile } from './HunterCreateMobile'
import { HunterCreateDesktop } from './HunterCreateDesktop'

export function HunterCreateRoute() {
  const { isDesktop } = useViewport()
  return isDesktop ? <HunterCreateDesktop /> : <HunterCreateMobile />
}
