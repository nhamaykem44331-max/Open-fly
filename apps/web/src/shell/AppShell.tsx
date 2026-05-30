import { Outlet, useLocation } from 'react-router-dom'
import { T } from '../theme/tokens'
import { useViewport } from './useViewport'
import { TopNav } from './TopNav'
import { Footer } from './Footer'
import { BottomNav } from './BottomNav'

// Routes that show the marketing footer on desktop (mirrors desktop-app.jsx).
const FOOTER_ROUTES = ['/', '/deals', '/profile', '/trips']

// Layout route: same routes + data, chrome swapped at the desktop breakpoint.
export function AppShell() {
  const { isDesktop } = useViewport()
  const { pathname } = useLocation()

  if (isDesktop) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: T.canvas, color: T.ink }}>
        <TopNav />
        <main style={{ flex: 1 }} key={pathname}>
          <div className="of-anim"><Outlet /></div>
        </main>
        {FOOTER_ROUTES.includes(pathname) && <Footer />}
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: T.paper, color: T.ink }}>
      <div key={pathname} className="of-anim" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 72px)' }}>
        <Outlet />
      </div>
      <BottomNav />
    </div>
  )
}
