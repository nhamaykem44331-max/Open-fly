// OpenFly — Trips routes: list + booking detail, layout by breakpoint, loading/error/empty.
import { useParams, useNavigate } from 'react-router-dom'
import { useViewport } from '../../shell/useViewport'
import { useBookings, useBooking } from '../../data/useBookings'
import { TripsListMobile } from './TripsListMobile'
import { TripsListDesktop } from './TripsListDesktop'
import { BookingDetailMobile } from './BookingDetailMobile'
import { BookingDetailDesktop } from './BookingDetailDesktop'
import { TripsListSkeleton, BookingDetailSkeleton } from './TripsSkeleton'
import { TripsListEmpty } from './TripsListEmpty'
import { GenericError } from '../states/GenericError'

export function TripsRoute() {
  const navigate = useNavigate()
  const { isDesktop } = useViewport()
  const { data, isLoading, isError, refetch } = useBookings()
  if (isLoading) return <TripsListSkeleton desktop={isDesktop} />
  if (isError || !data) return <GenericError onRetry={() => refetch()} onContactSol={() => navigate('/sol')} />
  if (data.length === 0) return <TripsListEmpty onBrowse={() => navigate('/search')} />
  return isDesktop ? <TripsListDesktop bookings={data} /> : <TripsListMobile bookings={data} />
}

export function BookingDetailRoute() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isDesktop } = useViewport()
  const { data, isLoading, isError, refetch } = useBooking(id)
  if (isLoading) return <BookingDetailSkeleton desktop={isDesktop} />
  if (isError || !data) return <GenericError onRetry={() => refetch()} onContactSol={() => navigate('/trips')} />
  return isDesktop ? <BookingDetailDesktop booking={data} /> : <BookingDetailMobile booking={data} />
}
