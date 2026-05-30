// OpenFly — Flight Detail route: flight by :id (mock, sync), layout by breakpoint.
import { useParams, useNavigate } from 'react-router-dom'
import { useViewport } from '../../shell/useViewport'
import { FLIGHTS } from '../../data/mock'
import { DetailMobile } from './DetailMobile'
import { DetailDesktop } from './DetailDesktop'
import { GenericError } from '../states/GenericError'

export function DetailRoute() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isDesktop } = useViewport()
  const flight = FLIGHTS.find((f) => f.id === id)
  if (!flight) return <GenericError onRetry={() => navigate('/results')} onContactSol={() => navigate('/sol')} />
  return isDesktop ? <DetailDesktop flight={flight} /> : <DetailMobile flight={flight} />
}
