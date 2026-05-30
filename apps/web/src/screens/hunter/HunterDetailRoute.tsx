// OpenFly — Hunt detail route: hunt by :id, layout by breakpoint, loading/error.
import { useParams, useNavigate } from 'react-router-dom'
import { useViewport } from '../../shell/useViewport'
import { useHunt } from '../../data/useHunts'
import { HunterDetailMobile } from './HunterDetailMobile'
import { HunterDetailDesktop } from './HunterDetailDesktop'
import { HunterDetailSkeleton } from './HunterDetailSkeleton'
import { GenericError } from '../states/GenericError'

export function HunterDetailRoute() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isDesktop } = useViewport()
  const { data, isLoading, isError, refetch } = useHunt(id)

  if (isLoading) return <HunterDetailSkeleton desktop={isDesktop} />
  if (isError || !data) return <GenericError onRetry={() => refetch()} onContactSol={() => navigate('/hunter')} />

  return isDesktop ? <HunterDetailDesktop hunt={data} /> : <HunterDetailMobile hunt={data} />
}
