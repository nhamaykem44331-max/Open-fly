import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from './shell/AppShell'
import { HomeRoute } from './screens/home/HomeRoute'
import { SearchRoute } from './screens/search/SearchRoute'
import { ResultsRoute } from './screens/results/ResultsRoute'
import { DetailRoute } from './screens/detail/DetailRoute'
import { HunterListRoute } from './screens/hunter/HunterListRoute'
import { HunterCreateRoute } from './screens/hunter/HunterCreateRoute'
import { HunterDetailRoute } from './screens/hunter/HunterDetailRoute'
import { HunterNotifsRoute } from './screens/hunter/HunterNotifsRoute'
import { BookingRoute, BookingReviewRoute } from './screens/booking/BookingRoute'
import { PaymentSePay } from './screens/payment/PaymentSePay'
import { PaymentSuccess } from './screens/payment/PaymentSuccess'
import { TripsRoute, BookingDetailRoute } from './screens/trips/TripsRoute'
import { ProfileRoute } from './screens/profile/ProfileRoute'
import { DealsRoute } from './screens/deals/DealsRoute'
import { SolPlaceholder } from './screens/sol/SolPlaceholder'
import { InboxRoute } from './screens/inbox/InboxRoute'
import { OnboardingScreen } from './screens/onboarding/OnboardingScreen'
import Kitchen from './dev/Kitchen'

// M1 routes. Home ('/') becomes the real dashboard in the next step; the rest are
// editorial placeholders so the shell is fully navigable for verification.
export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <HomeRoute /> },
      { path: '/search', element: <SearchRoute /> },
      { path: '/results', element: <ResultsRoute /> },
      { path: '/detail/:id', element: <DetailRoute /> },
      { path: '/booking/:flightId', element: <BookingRoute /> },
      { path: '/booking/:flightId/review', element: <BookingReviewRoute /> },
      { path: '/payment/:bookingId', element: <PaymentSePay /> },
      { path: '/success', element: <PaymentSuccess /> },
      { path: '/hunter', element: <HunterListRoute /> },
      { path: '/hunter/create', element: <HunterCreateRoute /> },
      { path: '/hunter/notifs', element: <HunterNotifsRoute /> },
      { path: '/hunter/:id', element: <HunterDetailRoute /> },
      { path: '/trips', element: <TripsRoute /> },
      { path: '/trips/:id', element: <BookingDetailRoute /> },
      { path: '/deals', element: <DealsRoute /> },
      { path: '/profile', element: <ProfileRoute /> },
      { path: '/sol', element: <SolPlaceholder /> },
      { path: '/inbox', element: <InboxRoute /> },
    ],
  },
  // Pre-login / full-screen routes (no app chrome).
  { path: '/onboarding', element: <OnboardingScreen /> },
  { path: '/dev/kitchen', element: <Kitchen /> },
])
