// OpenFly — Flight Detail route. Uses the offer picked in results (real, via the
// selected-flight store); falls back to mock by :id for design mode / deep links.
import { useParams, useNavigate } from 'react-router-dom'
import { useViewport } from '../../shell/useViewport'
import { FLIGHTS } from '../../data/mock'
import { useSelectedFlight } from '../../stores/selectedFlight'
import { DetailMobile } from './DetailMobile'
import { DetailDesktop } from './DetailDesktop'
import { GenericError } from '../states/GenericError'

export function DetailRoute() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isDesktop } = useViewport()
  const selected = useSelectedFlight((s) => s.flight)
  const flight = selected && selected.id === id ? selected : FLIGHTS.find((f) => f.id === id)
  if (!flight) return <GenericError onRetry={() => navigate('/results')} onContactSol={() => navigate('/sol')} />
  return isDesktop ? <DetailDesktop flight={flight} /> : <DetailMobile flight={flight} />
}
