// OpenFly — Fare Hunter list route: data hook, layout by breakpoint, loading/error/empty.
import { useNavigate } from 'react-router-dom'
import { useViewport } from '../../shell/useViewport'
import { useHunts } from '../../data/useHunts'
import { HunterListMobile } from './HunterListMobile'
import { HunterListDesktop } from './HunterListDesktop'
import { HunterListSkeleton } from './HunterListSkeleton'
import { HunterListEmpty } from './HunterListEmpty'
import { GenericError } from '../states/GenericError'

export function HunterListRoute() {
  const navigate = useNavigate()
  const { isDesktop } = useViewport()
  const { data, isLoading, isError, refetch } = useHunts()

  if (isLoading) return <HunterListSkeleton desktop={isDesktop} />
  if (isError || !data) return <GenericError onRetry={() => refetch()} onContactSol={() => navigate('/sol')} />
  if (data.length === 0) return <HunterListEmpty onCreate={() => navigate('/hunter/create')} />

  return isDesktop ? <HunterListDesktop hunts={data} /> : <HunterListMobile hunts={data} />
}
