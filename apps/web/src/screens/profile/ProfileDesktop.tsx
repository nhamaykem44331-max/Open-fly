// OpenFly — Profile (desktop), ported from desktop-account.jsx ProfilePage.
// Adapt: payment methods → SePay-linked banks; theme toggle bound to the Zustand store.
// Identity, saved passengers and notification toggles are wired to the API (useProfile).
import { useNavigate } from 'react-router-dom'
import { T } from '../../theme/tokens'
import { Eyebrow, Btn, Toggle, Ic, ChannelIcon } from '../../components/ui'
import { Container } from '../../shell/Container'
import { useThemeStore } from '../../theme/theme'
import { useAuthStore } from '../../stores/auth'
import { CHANNELS } from '../../data/mock'
import { useSavedPassengers, useNotifPrefs, useUpdateNotifPrefs, tierLabel, DEFAULT_PREFS } from '../../data/useProfile'

const SEPAY_BANKS: [string, string, string][] = [
  ['VCB', 'Vietcombank', 'Tài khoản đã liên kết · ··· 6478 · mặc định'],
  ['TCB', 'Techcombank', 'Chuyển khoản QR · ··· 1234'],
  ['MB', 'MB Bank', 'Chuyển khoản QR'],
]
const SETTINGS: [string, string][] = [
  ['Ngôn ngữ', 'Tiếng Việt'], ['Đơn vị tiền tệ', 'VND đ'], ['Trung tâm trợ giúp', ''], ['Điều khoản & bảo mật', ''], ['Đăng xuất', ''],
]
const SETTING_ICON = [Ic.sun, Ic.gift, Ic.info, Ic.shield, Ic.user]

export function ProfileDesktop() {
  const navigate = useNavigate()
  const resolved = useThemeStore((s) => s.resolved)
  const toggleTheme = useThemeStore((s) => s.toggle)
  const user = useAuthStore((s) => s.user)
  const passengers = useSavedPassengers().data ?? []
  const prefs = useNotifPrefs().data ?? DEFAULT_PREFS
  const updatePrefs = useUpdateNotifPrefs()

  const name = user?.fullName || 'Khách'
  const email = user?.email || user?.googleEmail || ''
  const phone = user?.phone
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '·'
  const chOn = (id: string): boolean =>
    id === 'telegram' ? prefs.telegramEnabled : id === 'email' ? prefs.emailEnabled : id === 'zalo' ? prefs.zaloEnabled : prefs.pushEnabled
  const chToggle = (id: string) => {
    if (id === 'telegram') updatePrefs.mutate({ telegramEnabled: !prefs.telegramEnabled })
    else if (id === 'email') updatePrefs.mutate({ emailEnabled: !prefs.emailEnabled })
    else if (id === 'zalo') updatePrefs.mutate({ zaloEnabled: !prefs.zaloEnabled })
    else updatePrefs.mutate({ pushEnabled: !prefs.pushEnabled })
  }

  return (
    <div style={{ background: T.canvas, minHeight: '100%', paddingBottom: 70 }}>
      <Container max={1100} style={{ paddingTop: 48 }}>
        <div style={{ background: T.inkBlock, color: T.onInk, borderRadius: 16, padding: 32, display: 'flex', alignItems: 'center', gap: 24, marginBottom: 28 }}>
          <div style={{ width: 76, height: 76, borderRadius: '50%', background: 'rgba(245,241,234,0.1)', border: '1px solid rgba(245,241,234,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.serif, fontSize: 30, color: T.rustSoft, fontStyle: 'italic', fontWeight: 600, flexShrink: 0 }}>{initials}</div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontFamily: T.serif, fontSize: 32, fontWeight: 400, letterSpacing: '-1px', color: T.onInk, margin: 0 }}>{name}</h1>
            <div style={{ fontFamily: T.sans, fontSize: 13.5, color: 'rgba(245,241,234,0.6)', marginTop: 4 }}>{email}{phone ? ` · ${phone}` : ''}</div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginTop: 12, padding: '5px 14px', borderRadius: 100, background: 'rgba(245,241,234,0.08)', border: '1px solid rgba(245,241,234,0.18)', fontFamily: T.sans, fontSize: 12, fontWeight: 600, letterSpacing: 0.5, color: T.rustSoft }}><Ic.spark size={13} stroke={T.rustSoft} />Thành viên {tierLabel(user?.tier)}</span>
          </div>
          <Btn onClick={toggleTheme} style={{ background: 'rgba(245,241,234,0.08)', color: T.onInk, border: '1px solid rgba(245,241,234,0.25)' }} icon={resolved === 'dark' ? <Ic.sun size={16} stroke={T.onInk} /> : <Ic.moon size={16} stroke={T.onInk} />}>{resolved === 'dark' ? 'Giao diện sáng' : 'Giao diện tối'}</Btn>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22, alignItems: 'start' }}>
          <div style={{ background: T.paper, border: `1px solid ${T.line}`, borderRadius: 12, padding: 26 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}><Eyebrow dash={false}>Hành khách đã lưu</Eyebrow><button style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontFamily: T.sans, fontSize: 12.5, fontWeight: 500, color: T.rust }}><Ic.plus size={14} stroke={T.rust} />Thêm</button></div>
            {passengers.length === 0 ? (
              <div style={{ fontFamily: T.serif, fontSize: 14, color: T.ink3, fontStyle: 'italic', padding: '8px 0' }}>Chưa có hành khách nào. Thêm để đặt vé nhanh hơn.</div>
            ) : passengers.map((p, i) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 0', borderBottom: i < passengers.length - 1 ? `1px solid ${T.line}` : 'none' }}>
                <span style={{ width: 40, height: 40, borderRadius: '50%', background: T.paper2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.serif, fontSize: 15, color: T.ink2, fontStyle: 'italic', fontWeight: 600 }}>{p.initials}</span>
                <div style={{ flex: 1 }}><div style={{ fontFamily: T.serif, fontSize: 16, fontWeight: 500, color: T.ink }}>{p.name}{p.primary && <span style={{ fontFamily: T.sans, fontSize: 10, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: T.rust, marginLeft: 8 }}>Chính</span>}</div><div style={{ fontFamily: T.sans, fontSize: 12, color: T.ink3, marginTop: 2 }}>{p.gender} · {p.dob}{p.child ? ' · Trẻ em' : ''}</div></div>
                <Ic.edit size={16} stroke={T.ink3} />
              </div>
            ))}
          </div>
          <div style={{ background: T.paper, border: `1px solid ${T.line}`, borderRadius: 12, padding: 26 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}><Eyebrow dash={false}>Thanh toán · SePay</Eyebrow><button style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontFamily: T.sans, fontSize: 12.5, fontWeight: 500, color: T.rust }}><Ic.plus size={14} stroke={T.rust} />Thêm</button></div>
            {SEPAY_BANKS.map(([emblem, name, desc], i) => (
              <div key={emblem} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 0', borderBottom: i < SEPAY_BANKS.length - 1 ? `1px solid ${T.line}` : 'none' }}>
                <span style={{ width: 44, height: 32, borderRadius: 6, background: T.paper2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.sans, fontSize: 11, fontWeight: 700, color: T.ink2 }}>{emblem}</span>
                <div style={{ flex: 1 }}><div style={{ fontFamily: T.serif, fontSize: 15.5, fontWeight: 500, color: T.ink }}>{name}</div><div style={{ fontFamily: T.sans, fontSize: 12, color: T.ink3, marginTop: 1 }}>{desc}</div></div>
              </div>
            ))}
          </div>
          <div style={{ background: T.paper, border: `1px solid ${T.line}`, borderRadius: 12, padding: 26, gridColumn: '1 / -1' }}>
            <Eyebrow dash={false} style={{ marginBottom: 16 }}>Cài đặt thông báo</Eyebrow>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {Object.entries(CHANNELS).map(([id, c]) => (
                <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 10, background: T.paper2 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 8, background: T.paper, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${T.line}` }}><ChannelIcon kind={id} size={17} active={chOn(id)} /></div>
                  <div style={{ flex: 1 }}><div style={{ fontFamily: T.serif, fontSize: 15.5, fontWeight: 500, color: T.ink }}>{c.name}</div><div style={{ fontFamily: T.sans, fontSize: 12, color: T.ink3, marginTop: 1 }}>{c.user}</div></div>
                  <Toggle on={chOn(id)} onClick={() => chToggle(id)} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ background: T.paper, border: `1px solid ${T.line}`, borderRadius: 12, marginTop: 22, overflow: 'hidden' }}>
          {SETTINGS.map(([t, v], i) => {
            const Icon = SETTING_ICON[i]
            const isLogout = t === 'Đăng xuất'
            return (
              <div key={t} onClick={isLogout ? () => { useAuthStore.getState().signOut(); navigate('/onboarding') } : undefined} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 24px', borderBottom: i < SETTINGS.length - 1 ? `1px solid ${T.line}` : 'none', cursor: 'pointer' }}>
                <Icon size={18} stroke={isLogout ? T.red : T.ink2} />
                <span style={{ flex: 1, fontFamily: T.serif, fontSize: 16, color: isLogout ? T.red : T.ink }}>{t}</span>
                {v && <span style={{ fontFamily: T.sans, fontSize: 13, color: T.ink3 }}>{v}</span>}
                {!isLogout && <Ic.chevron size={16} stroke={T.ink3} />}
              </div>
            )
          })}
        </div>
      </Container>
    </div>
  )
}
