// OpenFly — Home route: one data hook, chrome/layout chosen by breakpoint,
// loading / error / empty states wired (§5.8).
import { useNavigate } from 'react-router-dom'
import { useViewport } from '../../shell/useViewport'
import { useHomeData } from '../../data/useHomeData'
import { HomeMobile } from './HomeMobile'
import { HomeDesktop } from './HomeDesktop'
import { HomeSkeleton } from './HomeSkeleton'
import { GenericError } from '../states/GenericError'
import { EmptyHome } from '../states/EmptyHome'

export function HomeRoute() {
  const navigate = useNavigate()
  const { isDesktop } = useViewport()
  const { data, isLoading, isError, refetch } = useHomeData()

  if (isLoading) return <HomeSkeleton desktop={isDesktop} />
  if (isError || !data) return <GenericError onRetry={() => refetch()} onContactSol={() => navigate('/sol')} />

  const empty = data.activeHunts.length === 0 && data.vouchers.length === 0 && data.destinations.length === 0
  if (empty) return <EmptyHome onSearch={() => navigate('/search')} onCreateHunt={() => navigate('/hunter')} />

  return isDesktop ? <HomeDesktop data={data} /> : <HomeMobile data={data} />
}
