// OpenFly — Booking routes. Mobile = 2 steps (passenger → review); desktop = one page.
import { useParams, useNavigate } from 'react-router-dom'
import { useViewport } from '../../shell/useViewport'
import { FLIGHTS } from '../../data/mock'
import { BookingPassengerMobile } from './BookingPassengerMobile'
import { BookingReviewMobile } from './BookingReviewMobile'
import { BookingDesktop } from './BookingDesktop'
import { GenericError } from '../states/GenericError'

function useFlight() {
  const { flightId } = useParams()
  return FLIGHTS.find((f) => f.id === flightId)
}

export function BookingRoute() {
  const flight = useFlight()
  const navigate = useNavigate()
  const { isDesktop } = useViewport()
  if (!flight) return <GenericError onRetry={() => navigate('/results')} onContactSol={() => navigate('/sol')} />
  return isDesktop ? <BookingDesktop flight={flight} /> : <BookingPassengerMobile flight={flight} />
}

export function BookingReviewRoute() {
  const flight = useFlight()
  const navigate = useNavigate()
  const { isDesktop } = useViewport()
  if (!flight) return <GenericError onRetry={() => navigate('/results')} onContactSol={() => navigate('/sol')} />
  // Desktop folds review into the single booking page.
  return isDesktop ? <BookingDesktop flight={flight} /> : <BookingReviewMobile flight={flight} />
}
