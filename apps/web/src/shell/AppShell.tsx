import { Outlet, useLocation } from 'react-router-dom'
import { T } from '../theme/tokens'
import { useViewport } from './useViewport'
import { useOnline } from './useOnline'
import { TopNav } from './TopNav'
import { Footer } from './Footer'
import { BottomNav } from './BottomNav'

// Routes that show the marketing footer on desktop (mirrors desktop-app.jsx).
const FOOTER_ROUTES = ['/', '/deals', '/profile', '/trips']

function OfflineBanner() {
  const online = useOnline()
  if (online) return null
  return (
    <div style={{ background: T.ink, color: T.paper, padding: '7px 16px', textAlign: 'center', fontFamily: T.sans, fontSize: 12, fontWeight: 500, letterSpacing: 0.2, position: 'sticky', top: 0, zIndex: 200 }}>
      Đang ngoại tuyến — đang dùng dữ liệu đã lưu; thao tác cần mạng sẽ tạm dừng.
    </div>
  )
}

// Layout route: same routes + data, chrome swapped at the desktop breakpoint.
export function AppShell() {
  const { isDesktop } = useViewport()
  const { pathname } = useLocation()

  if (isDesktop) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: T.canvas, color: T.ink }}>
        <OfflineBanner />
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
      <OfflineBanner />
      <div key={pathname} className="of-anim" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 72px)' }}>
        <Outlet />
      </div>
      <BottomNav />
    </div>
  )
}
