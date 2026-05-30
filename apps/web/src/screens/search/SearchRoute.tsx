// Search form reads only local catalog/calendar (no async fetch) → no loading state.
import { useViewport } from '../../shell/useViewport'
import { SearchMobile } from './SearchMobile'
import { SearchDesktop } from './SearchDesktop'

export function SearchRoute() {
  const { isDesktop } = useViewport()
  return isDesktop ? <SearchDesktop /> : <SearchMobile />
}
