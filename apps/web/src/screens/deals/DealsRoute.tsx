// OpenFly — Deals route: data hook, layout by breakpoint, loading/error.
import { useNavigate } from 'react-router-dom'
import { T } from '../../theme/tokens'
import { Container } from '../../shell/Container'
import { useViewport } from '../../shell/useViewport'
import { useDeals } from '../../data/useDeals'
import { DealsMobile } from './DealsMobile'
import { DealsDesktop } from './DealsDesktop'
import { DealsEmpty } from './DealsEmpty'
import { GenericError } from '../states/GenericError'

const PULSE = 'skPulse 1.6s ease-in-out infinite'
function DealsSkeleton({ desktop }: { desktop: boolean }) {
  const body = (
    <>
      <div style={{ height: desktop ? 160 : 140, borderRadius: 8, background: T.paper3, opacity: 0.5, animation: PULSE }} />
      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>{[0, 1, 2].map((i) => <div key={i} style={{ height: 88, borderRadius: 8, background: T.paper3, opacity: 0.4, animation: PULSE }} />)}</div>
    </>
  )
  return desktop
    ? <div style={{ background: T.canvas, minHeight: '100%' }}><Container max={1200} style={{ paddingTop: 48 }}>{body}</Container></div>
    : <div style={{ background: T.paper, minHeight: '100%', padding: '20px 20px 0' }}>{body}</div>
}

export function DealsRoute() {
  const navigate = useNavigate()
  const { isDesktop } = useViewport()
  const { data, isLoading, isError, refetch } = useDeals()
  if (isLoading) return <DealsSkeleton desktop={isDesktop} />
  if (isError || !data) return <GenericError onRetry={() => refetch()} onContactSol={() => navigate('/sol')} />
  if (data.flash.length === 0 && data.vouchers.length === 0) return <DealsEmpty onBrowse={() => navigate('/search')} />
  return isDesktop ? <DealsDesktop data={data} /> : <DealsMobile data={data} />
}
