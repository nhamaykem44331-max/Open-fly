import { useLocation, useNavigate } from 'react-router-dom'
import { T } from '../theme/tokens'
import { Ic, Wordmark } from '../components/ui'
import { Container } from './Container'
import { ThemeToggle } from './ThemeToggle'

// Desktop top navigation — a dark Ink bar (always inkBlock, both themes).
// Ported from desktop-shell.jsx; wired to react-router.
const ITEMS = [
  { id: 'home', label: 'Trang chủ', path: '/' },
  { id: 'search', label: 'Tìm vé', path: '/search' },
  { id: 'hunter', label: 'Săn vé', path: '/hunter', star: true },
  { id: 'trips', label: 'Chuyến của tôi', path: '/trips' },
  { id: 'deals', label: 'Ưu đãi', path: '/deals' },
]

export function TopNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const active = (path: string) => (path === '/' ? pathname === '/' : pathname.startsWith(path))

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 50, background: T.inkBlock, borderBottom: '1px solid rgba(245,241,234,0.10)' }}>
      <Container max={1320}>
        <div style={{ display: 'flex', alignItems: 'center', height: 66, gap: 8 }}>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginRight: 18 }}>
            <Wordmark size={21} onInk />
          </button>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {ITEMS.map((it) => {
              const on = active(it.path)
              return (
                <button
                  key={it.id}
                  onClick={() => navigate(it.path)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: '8px 14px', borderRadius: 100, position: 'relative',
                    fontFamily: T.sans, fontSize: 13.5, fontWeight: 500, letterSpacing: 0.1,
                    color: on ? T.onInk : 'rgba(245,241,234,0.62)',
                    display: 'flex', alignItems: 'center', gap: 6, transition: 'color 0.15s',
                  }}
                >
                  {it.star && <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.rustSoft }} />}
                  {it.label}
                  {on && <span style={{ position: 'absolute', left: 14, right: 14, bottom: -1, height: 2, background: T.rustSoft, borderRadius: 2 }} />}
                </button>
              )
            })}
          </nav>
          <div style={{ flex: 1 }} />
          <button
            onClick={() => navigate('/sol')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 9, padding: '8px 16px 8px 9px',
              borderRadius: 100, background: 'rgba(245,241,234,0.06)', border: '1px solid rgba(245,241,234,0.16)',
              cursor: 'pointer', marginRight: 4,
            }}
          >
            <span style={{ width: 26, height: 26, borderRadius: '50%', background: T.rust, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.serif, fontSize: 14, color: T.onInk, fontStyle: 'italic', fontWeight: 600 }}>S</span>
            <span style={{ fontFamily: T.serif, fontSize: 14, color: T.onInk, fontStyle: 'italic' }}>Hỏi Sol</span>
          </button>
          <ThemeToggle onInk />
          <button
            onClick={() => navigate('/inbox')}
            title="Thông báo"
            aria-label="Thông báo"
            style={{ width: 40, height: 40, borderRadius: '50%', position: 'relative', background: 'transparent', border: '1px solid rgba(245,241,234,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <Ic.bell size={17} stroke={T.onInk} />
            <span style={{ position: 'absolute', top: -3, right: -3, minWidth: 17, height: 17, padding: '0 4px', borderRadius: 100, background: T.rust, color: T.onInk, fontFamily: T.sans, fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${T.inkBlock}`, lineHeight: 1 }}>2</span>
          </button>
          <button
            onClick={() => navigate('/profile')}
            aria-label="Tài khoản"
            style={{ width: 40, height: 40, borderRadius: '50%', padding: 0, cursor: 'pointer', background: 'rgba(245,241,234,0.10)', border: '1px solid rgba(245,241,234,0.22)', fontFamily: T.serif, fontSize: 15, color: T.onInk, fontWeight: 500, fontStyle: 'italic' }}
          >
            An
          </button>
        </div>
      </Container>
    </header>
  )
}
