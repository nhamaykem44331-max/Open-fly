// OpenFly — Results route: one data hook, layout by breakpoint, loading/error/empty wired.
import { useNavigate } from 'react-router-dom'
import { useViewport } from '../../shell/useViewport'
import { useResults, isSearchTimeout } from '../../data/useResults'
import { useSearchStore } from '../../stores/search'
import { viDateLabel } from '../../lib/api/adapters'
import { ResultsMobile } from './ResultsMobile'
import { ResultsDesktop } from './ResultsDesktop'
import { ResultsSkeleton } from './ResultsSkeleton'
import { NoResults } from './NoResults'
import { SearchTimeout } from '../states/SearchTimeout'
import { GenericError } from '../states/GenericError'

export function ResultsRoute() {
  const navigate = useNavigate()
  const { isDesktop } = useViewport()
  const q = useSearchStore()
  const { data, isLoading, isError, error, refetch } = useResults()

  if (isLoading) return <ResultsSkeleton desktop={isDesktop} />
  if (isError || !data) {
    if (isSearchTimeout(error)) {
      const pax = q.paxAdt + q.paxChd + q.paxInf
      return (
        <SearchTimeout
          from={q.origin}
          to={q.destination}
          dateLabel={viDateLabel(q.date)}
          paxLabel={`${pax} khách`}
          onWaitMore={() => refetch()}
          onCancel={() => navigate('/search')}
        />
      )
    }
    return <GenericError onRetry={() => refetch()} onContactSol={() => navigate('/sol')} />
  }
  if (data.flights.length === 0) return <NoResults onChangeDate={() => navigate('/search')} onCreateHunt={() => navigate('/hunter')} />

  return isDesktop ? <ResultsDesktop data={data} /> : <ResultsMobile data={data} />
}
