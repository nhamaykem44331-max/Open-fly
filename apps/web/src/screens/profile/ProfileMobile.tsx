// OpenFly — Profile (mobile), ported from screens-profile.jsx. Adapt: payment → SePay,
// + a manual dark-mode toggle (M1 decision: system + manual). Identity/stats/passengers/
// notification toggles are wired to the API (useProfile + useBookings + useHunts).
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { T, fmtVnd } from '../../theme/tokens'
import { Eyebrow, Sunmark, Ic } from '../../components/ui'
import { useThemeStore } from '../../theme/theme'
import { useAuthStore } from '../../stores/auth'
import { useBookings } from '../../data/useBookings'
import { useHunts } from '../../data/useHunts'
import { useSavedPassengers, useNotifPrefs, useUpdateNotifPrefs, tierLabel, DEFAULT_PREFS } from '../../data/useProfile'

function StatColumn({ value, label, left }: { value: string; label: string; left?: boolean }) {
  return (
    <div style={{ padding: '16px 12px', textAlign: 'center', borderLeft: left ? `1px solid ${T.line}` : 'none' }}>
      <div style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 500, color: T.ink, letterSpacing: '-0.5px' }}>{value}</div>
      <div style={{ fontFamily: T.sans, fontSize: 9.5, color: T.ink3, marginTop: 3, letterSpacing: 0.6, textTransform: 'uppercase', fontWeight: 500 }}>{label}</div>
    </div>
  )
}

function Card({ children }: { children: ReactNode }) {
  return <div style={{ marginTop: 12, background: T.paper, border: `1px solid ${T.line}`, borderRadius: 6, overflow: 'hidden' }}>{children}</div>
}

function SettingsRow({ icon, label, sub, onTap, last }: { icon: ReactNode; label: string; sub?: string; onTap?: () => void; last?: boolean }) {
  return (
    <button onClick={onTap} style={{ width: '100%', padding: '14px 18px', borderBottom: last ? 'none' : `1px solid ${T.line}`, background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', textAlign: 'left' }}>
      <div style={{ width: 30, height: 30, borderRadius: 4, background: T.paper2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: T.serif, fontSize: 14, fontWeight: 500, color: T.ink, letterSpacing: '-0.2px' }}>{label}</div>
        {sub && <div style={{ fontFamily: T.sans, fontSize: 11, color: T.ink3, marginTop: 1 }}>{sub}</div>}
      </div>
      <Ic.chevron size={12} stroke={T.ink3} />
    </button>
  )
}

function Switch({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} role="switch" aria-checked={on} style={{ width: 40, height: 22, borderRadius: 100, position: 'relative', background: on ? T.ink : T.paper3, border: `1px solid ${on ? T.ink : T.line2}`, cursor: 'pointer', transition: 'all 0.15s', padding: 0, flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 2, left: on ? 20 : 2, width: 16, height: 16, borderRadius: '50%', background: T.paper, transition: 'left 0.15s', boxShadow: '0 1px 2px rgba(0,0,0,0.15)' }} />
    </button>
  )
}

function ToggleRow({ icon, label, on, onToggle, last }: { icon: ReactNode; label: string; on: boolean; onToggle: () => void; last?: boolean }) {
  return (
    <div style={{ width: '100%', padding: '14px 18px', borderBottom: last ? 'none' : `1px solid ${T.line}`, display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 30, height: 30, borderRadius: 4, background: T.paper2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1 }}><div style={{ fontFamily: T.serif, fontSize: 14, fontWeight: 500, color: T.ink, letterSpacing: '-0.2px' }}>{label}</div></div>
      <Switch on={on} onClick={onToggle} />
    </div>
  )
}

export function ProfileMobile() {
  const navigate = useNavigate()
  const resolved = useThemeStore((s) => s.resolved)
  const toggleTheme = useThemeStore((s) => s.toggle)
  const user = useAuthStore((s) => s.user)
  const passengers = useSavedPassengers().data ?? []
  const prefs = useNotifPrefs().data ?? DEFAULT_PREFS
  const updatePrefs = useUpdateNotifPrefs()
  const bookings = useBookings().data ?? []
  const hunts = useHunts().data ?? []

  const name = user?.fullName || 'Khách'
  const email = user?.email || user?.googleEmail || ''
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '·'
  const savingsK = hunts.filter((h) => h.status === 'found').reduce((s, h) => s + (h.target - h.best), 0)

  return (
    <div style={{ background: T.paper, minHeight: '100%' }}>
      <div style={{ padding: '14px 20px 0' }}><Eyebrow>Tài khoản</Eyebrow></div>
      <div style={{ padding: '20px 20px 0', textAlign: 'center' }}>
        <div style={{ width: 76, height: 76, borderRadius: '50%', background: T.inkBlock, margin: '0 auto 14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.serif, fontSize: 28, color: T.rustSoft, fontStyle: 'italic', fontWeight: 500 }}>{initials}</div>
        <h2 style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 500, color: T.ink, letterSpacing: '-0.6px', margin: '0 0 4px' }}>{name}</h2>
        <p style={{ fontFamily: T.serif, fontSize: 13, color: T.ink3, fontStyle: 'italic', margin: 0 }}>{email}</p>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 100, background: T.inkBlock, color: T.onInk, marginTop: 14 }}>
          <Sunmark size={14} color={T.rustLt} />
          <span style={{ fontFamily: T.sans, fontSize: 10, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', color: T.rustSoft }}>{tierLabel(user?.tier)} · {(user?.milesBalance ?? 0).toLocaleString('vi-VN')} dặm</span>
        </div>
      </div>

      <div style={{ padding: '24px 20px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', background: T.paper, border: `1px solid ${T.line}`, borderRadius: 6 }}>
          <StatColumn value={String(bookings.length)} label="Chuyến bay" />
          <StatColumn value={String(hunts.length)} label="Săn vé" left />
          <StatColumn value={`${fmtVnd(savingsK)}đ`} label="Tiết kiệm" left />
        </div>
      </div>

      <div style={{ padding: '24px 20px 0' }}>
        <Eyebrow>Cá nhân</Eyebrow>
        <Card>
          <SettingsRow icon={<Ic.user size={16} stroke={T.ink2} />} label="Thông tin cá nhân" sub="Họ tên, ngày sinh, giấy tờ" />
          <SettingsRow icon={<Ic.bag size={16} stroke={T.ink2} />} label="Hành khách đã lưu" sub={`${passengers.length} người · để đặt vé nhanh hơn`} />
          <SettingsRow icon={<Ic.spark size={16} stroke={T.ink2} />} label="Sở thích bay" sub="Khung giờ, hãng, ghế ưu tiên" last />
        </Card>
      </div>

      <div style={{ padding: '20px 20px 0' }}>
        <Eyebrow>Thanh toán & ưu đãi</Eyebrow>
        <Card>
          <SettingsRow icon={<Ic.ticket size={16} stroke={T.ink2} />} label="Phương thức thanh toán" sub="SePay · chuyển khoản ngân hàng (VCB)" />
          <SettingsRow icon={<Ic.spark size={16} stroke={T.ink2} />} label="Mã ưu đãi của tôi" sub="Xem ưu đãi của bạn" onTap={() => navigate('/deals')} last />
        </Card>
      </div>

      <div style={{ padding: '20px 20px 0' }}>
        <Eyebrow>Thông báo</Eyebrow>
        <Card>
          <ToggleRow icon={<Ic.bell size={16} stroke={T.ink2} />} label="Push trong app" on={prefs.pushEnabled} onToggle={() => updatePrefs.mutate({ pushEnabled: !prefs.pushEnabled })} />
          <ToggleRow icon={<Ic.send size={16} stroke={T.ink2} />} label="Email" on={prefs.emailEnabled} onToggle={() => updatePrefs.mutate({ emailEnabled: !prefs.emailEnabled })} />
          <ToggleRow icon={<Ic.chat size={16} stroke={T.ink2} />} label="Zalo OA" on={prefs.zaloEnabled} onToggle={() => updatePrefs.mutate({ zaloEnabled: !prefs.zaloEnabled })} />
          <ToggleRow icon={<Ic.plane size={16} stroke={T.ink2} />} label="Telegram bot" on={prefs.telegramEnabled} onToggle={() => updatePrefs.mutate({ telegramEnabled: !prefs.telegramEnabled })} last />
        </Card>
      </div>

      <div style={{ padding: '20px 20px 0' }}>
        <Eyebrow>Hỗ trợ</Eyebrow>
        <Card>
          <SettingsRow icon={<Ic.chat size={16} stroke={T.ink2} />} label="Chat với Sol" sub="Phản hồi trong 1 phút" onTap={() => navigate('/sol')} />
          <SettingsRow icon={<Ic.info size={16} stroke={T.ink2} />} label="Trung tâm trợ giúp" sub="Câu hỏi thường gặp" />
          <SettingsRow icon={<Ic.user size={16} stroke={T.ink2} />} label="Liên hệ qua điện thoại" sub="1900 OPENFLY · 24/7" last />
        </Card>
      </div>

      <div style={{ padding: '20px 20px 0' }}>
        <Eyebrow>Khác</Eyebrow>
        <Card>
          {/* manual dark-mode toggle (M1: system + manual) */}
          <div style={{ width: '100%', padding: '14px 18px', borderBottom: `1px solid ${T.line}`, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 30, height: 30, borderRadius: 4, background: T.paper2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{resolved === 'dark' ? <Ic.moon size={16} stroke={T.ink2} /> : <Ic.sun size={16} stroke={T.ink2} />}</div>
            <div style={{ flex: 1 }}><div style={{ fontFamily: T.serif, fontSize: 14, fontWeight: 500, color: T.ink, letterSpacing: '-0.2px' }}>Giao diện tối</div><div style={{ fontFamily: T.sans, fontSize: 11, color: T.ink3, marginTop: 1 }}>{resolved === 'dark' ? 'Đang bật' : 'Đang tắt'}</div></div>
            <Switch on={resolved === 'dark'} onClick={toggleTheme} />
          </div>
          <SettingsRow icon={<Ic.sun size={16} stroke={T.ink2} />} label="Ngôn ngữ" sub="Tiếng Việt" />
          <SettingsRow icon={<Ic.info size={16} stroke={T.ink2} />} label="Điều khoản & bảo mật" sub="·" last />
        </Card>
      </div>

      <div style={{ padding: '20px 20px 0' }}>
        <button onClick={() => { useAuthStore.getState().signOut(); navigate('/onboarding') }} style={{ width: '100%', padding: '14px 18px', background: 'transparent', border: `1px solid ${T.line2}`, borderRadius: 6, fontFamily: T.serif, fontSize: 14, fontWeight: 500, color: T.red, letterSpacing: '-0.2px', cursor: 'pointer' }}>
          Đăng xuất
        </button>
      </div>
      <div style={{ padding: '24px 24px 16px', textAlign: 'center' }}>
        <Eyebrow dash={false} style={{ color: T.ink4 }}>OpenFly · phiên bản 1.0.0</Eyebrow>
      </div>
    </div>
  )
}
