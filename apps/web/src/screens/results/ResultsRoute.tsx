// OpenFly — Results route: one data hook, layout by breakpoint, loading/error/empty wired.
import { useNavigate } from 'react-router-dom'
import { useViewport } from '../../shell/useViewport'
import { useResults } from '../../data/useResults'
import { ResultsMobile } from './ResultsMobile'
import { ResultsDesktop } from './ResultsDesktop'
import { ResultsSkeleton } from './ResultsSkeleton'
import { NoResults } from './NoResults'
import { GenericError } from '../states/GenericError'

export function ResultsRoute() {
  const navigate = useNavigate()
  const { isDesktop } = useViewport()
  const { data, isLoading, isError, refetch } = useResults()

  if (isLoading) return <ResultsSkeleton desktop={isDesktop} />
  if (isError || !data) return <GenericError onRetry={() => refetch()} onContactSol={() => navigate('/sol')} />
  if (data.flights.length === 0) return <NoResults onChangeDate={() => navigate('/search')} onCreateHunt={() => navigate('/hunter')} />

  return isDesktop ? <ResultsDesktop data={data} /> : <ResultsMobile data={data} />
}
