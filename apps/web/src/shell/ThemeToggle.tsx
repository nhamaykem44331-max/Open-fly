import { T } from '../theme/tokens'
import { useThemeStore } from '../theme/theme'
import { Ic } from '../components/ui'

// Round sun/moon toggle, used in both the mobile and desktop chrome.
// `onInk` adapts the border/icon for placement on a dark Ink bar.
export function ThemeToggle({ onInk = false }: { onInk?: boolean }) {
  const resolved = useThemeStore((s) => s.resolved)
  const toggle = useThemeStore((s) => s.toggle)
  const color = onInk ? T.onInk : T.ink

  return (
    <button
      onClick={toggle}
      title="Đổi giao diện"
      aria-label="Đổi giao diện sáng/tối"
      style={{
        width: 40, height: 40, borderRadius: '50%',
        background: 'transparent',
        border: `1px solid ${onInk ? 'rgba(245,241,234,0.22)' : T.line2}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        transition: 'all 0.15s', flexShrink: 0,
      }}
    >
      {resolved === 'dark' ? <Ic.sun size={17} stroke={color} /> : <Ic.moon size={17} stroke={color} />}
    </button>
  )
}
