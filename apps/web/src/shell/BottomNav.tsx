import type { ComponentType } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { T } from '../theme/tokens'
import { Ic } from '../components/ui'
import type { IconProps } from '../components/ui/icons'

// Mobile bottom nav (ported from app.jsx). The prototype's iOS bezel/PhoneStage
// is a canvas-only mockup and is intentionally NOT shipped — the PWA fills the
// device, with safe-area padding under the nav.
interface NavItem {
  id: string
  label: string
  path: string
  icon: ComponentType<IconProps>
  feature?: boolean
}

const ITEMS: NavItem[] = [
  { id: 'home', label: 'Trang chủ', path: '/', icon: Ic.home },
  { id: 'search', label: 'Tìm vé', path: '/search', icon: Ic.search },
  { id: 'hunter', label: 'Săn vé', path: '/hunter', icon: Ic.radar, feature: true },
  { id: 'trips', label: 'Chuyến', path: '/trips', icon: Ic.ticket },
  { id: 'profile', label: 'Bạn', path: '/profile', icon: Ic.user },
]

export function BottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const isActive = (path: string) => (path === '/' ? pathname === '/' : pathname.startsWith(path))

  return (
    <nav
      style={{
        position: 'fixed', left: 0, right: 0, bottom: 0,
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 10px)', paddingTop: 6,
        background: T.paper, borderTop: `1px solid ${T.line}`,
        display: 'flex', justifyContent: 'space-around', zIndex: 40,
      }}
    >
      {ITEMS.map((it) => {
        const active = isActive(it.path)
        const Icon = it.icon
        return (
          <button
            key={it.id}
            onClick={() => navigate(it.path)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '6px 10px 4px', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 3, minWidth: 56, position: 'relative',
            }}
          >
            {it.feature && (
              <div style={{
                position: 'absolute', top: -2, left: '50%', transform: 'translateX(-50%)',
                width: 26, height: 26, borderRadius: '50%', background: T.rust,
                opacity: active ? 0 : 0.12, transition: 'opacity 0.2s',
              }} />
            )}
            <div style={{ position: 'relative', zIndex: 1 }}>
              <Icon size={20} stroke={active ? T.ink : it.feature ? T.rust : T.ink3} sw={active ? 1.8 : 1.5} />
            </div>
            <span style={{
              fontFamily: T.sans, fontSize: 9.5, fontWeight: active ? 600 : 500,
              color: active ? T.ink : T.ink3, letterSpacing: 0.3, position: 'relative', zIndex: 1,
            }}>
              {it.label}
            </span>
            {active && (
              <div style={{
                position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                width: 18, height: 2, borderRadius: 1, background: T.rust,
              }} />
            )}
          </button>
        )
      })}
    </nav>
  )
}
