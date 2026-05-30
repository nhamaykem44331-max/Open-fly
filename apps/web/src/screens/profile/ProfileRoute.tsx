// Profile fetches saved passengers + notification prefs → loading/error per §5.8.
import { useNavigate } from 'react-router-dom'
import { useViewport } from '../../shell/useViewport'
import { useSavedPassengers, useNotifPrefs } from '../../data/useProfile'
import { ProfileMobile } from './ProfileMobile'
import { ProfileDesktop } from './ProfileDesktop'
import { ProfileSkeleton } from './ProfileSkeleton'
import { GenericError } from '../states/GenericError'

export function ProfileRoute() {
  const navigate = useNavigate()
  const { isDesktop } = useViewport()
  const passengers = useSavedPassengers()
  const prefs = useNotifPrefs()

  if (passengers.isLoading || prefs.isLoading) return <ProfileSkeleton desktop={isDesktop} />
  if (passengers.isError || prefs.isError) {
    return (
      <GenericError
        onRetry={() => {
          void passengers.refetch()
          void prefs.refetch()
        }}
        onContactSol={() => navigate('/sol')}
      />
    )
  }
  return isDesktop ? <ProfileDesktop /> : <ProfileMobile />
}
