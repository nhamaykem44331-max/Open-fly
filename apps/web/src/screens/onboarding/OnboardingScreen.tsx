// OpenFly — Onboarding + Auth. Ported from screens-onboarding.jsx.
// ADAPT (Q-7): the design's SĐT + OTP auth is replaced by Google Sign-In for Phase 1;
// the phone path is kept as a disabled "Phase 2" affordance. The carousel + welcome are
// faithful. NOTE: the Google button here is a MOCK — it advances the UI only. Production
// must run a real Google OAuth flow and create the session from the backend response.
import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { T } from '../../theme/tokens'
import { Eyebrow, Sunmark, Ic } from '../../components/ui'
import { apiEnabled } from '../../lib/api/client'
import { useAuthStore } from '../../stores/auth'
import { GoogleSignInButton } from './GoogleSignInButton'

type Phase = 'carousel' | 'auth' | 'done'
type Visual = 'route' | 'sol' | 'radar'

const SLIDES: { eyebrow: string; title: string; body: string; accent: string; visual: Visual }[] = [
  { eyebrow: '01 · Đặt vé', title: 'Mọi chuyến bay, một nơi.', body: 'Tìm và đặt vé cho mọi hãng bay Việt Nam. Giá minh bạch — không phí ẩn, không hứa quá.', accent: T.rust, visual: 'route' },
  { eyebrow: '02 · Sol AI', title: 'Trợ lý du lịch riêng cho bạn.', body: 'Sol tư vấn, đặt vé hộ, và nhắc nhở chủ động. Cứ hỏi như nói chuyện với một người bạn am hiểu.', accent: T.ink, visual: 'sol' },
  { eyebrow: '03 · Săn vé tự động', title: 'Để bot làm việc cho bạn.', body: 'Sol săn giá 24/7 và báo qua Telegram, Email, hoặc Zalo ngay khi tìm được vé đúng ý.', accent: T.rust, visual: 'radar' },
]

export function OnboardingScreen() {
  const navigate = useNavigate()
  const [phase, setPhase] = useState<Phase>('carousel')
  const [slide, setSlide] = useState(0)
  const [authError, setAuthError] = useState<string | null>(null)
  const [signingIn, setSigningIn] = useState(false)
  // Public Web OAuth client id. Set → real Google Sign-In (GIS); unset → dev stub.
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

  const next = () => {
    if (slide < SLIDES.length - 1) setSlide((s) => s + 1)
    else setPhase('auth')
  }
  const finish = useCallback(() => {
    setPhase('done')
    setTimeout(() => navigate('/', { replace: true }), 1500)
  }, [navigate])
  const handleGoogle = async () => {
    if (!apiEnabled) {
      finish() // mock/design mode — no backend configured
      return
    }
    setAuthError(null)
    setSigningIn(true)
    try {
      // DEV stub: the backend (NODE_ENV=test) accepts 'mock-valid-token'. Real Google
      // Identity Services supplies a genuine idToken here once GOOGLE_CLIENT_ID is set.
      await useAuthStore.getState().signInGoogle('mock-valid-token')
      finish()
    } catch (e) {
      setAuthError(e instanceof Error ? e.message : 'Đăng nhập thất bại, thử lại sau.')
      setSigningIn(false)
    }
  }

  // Real Google (GIS): the credential GIS returns is the idToken the backend verifies.
  const handleCredential = useCallback(
    async (idToken: string) => {
      setSigningIn(true)
      setAuthError(null)
      try {
        await useAuthStore.getState().signInGoogle(idToken)
        finish()
      } catch (e) {
        setAuthError(e instanceof Error ? e.message : 'Đăng nhập thất bại, thử lại sau.')
        setSigningIn(false)
      }
    },
    [finish],
  )
  const handleGisError = useCallback((e: Error) => setAuthError(e.message), [])

  // Full-screen page; content constrained to an app-width column (centered on desktop).
  const Page = ({ children }: { children: React.ReactNode }) => (
    <div style={{ minHeight: '100vh', background: T.paper, color: T.ink, display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 460, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>{children}</div>
    </div>
  )

  if (phase === 'carousel') {
    const s = SLIDES[slide]
    return (
      <Page>
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 24px 0' }}>
          <button onClick={() => setPhase('auth')} style={{ padding: '6px 14px', borderRadius: 100, background: 'transparent', border: `1px solid ${T.line2}`, cursor: 'pointer', fontFamily: T.sans, fontSize: 11, fontWeight: 500, color: T.ink2, letterSpacing: 0.3 }}>Bỏ qua</button>
        </div>
        <div style={{ flex: 1, padding: '24px 32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <OnboardingVisual kind={s.visual} accent={s.accent} />
        </div>
        <div style={{ padding: '0 32px' }}>
          <Eyebrow>{s.eyebrow}</Eyebrow>
          <h1 style={{ fontFamily: T.serif, fontSize: 30, fontWeight: 400, letterSpacing: '-1.1px', lineHeight: 1.1, color: T.ink, margin: '14px 0 12px' }}>{s.title}</h1>
          <p style={{ fontFamily: T.serif, fontSize: 14, color: T.ink3, fontStyle: 'italic', margin: 0, lineHeight: 1.55 }}>{s.body}</p>
        </div>
        <div style={{ padding: '32px 32px 36px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {SLIDES.map((_, i) => (
              <button key={i} onClick={() => setSlide(i)} style={{ width: i === slide ? 22 : 6, height: 6, borderRadius: 100, background: i === slide ? T.ink : T.line2, border: 'none', cursor: 'pointer', transition: 'all 0.2s', padding: 0 }} />
            ))}
          </div>
          <div style={{ flex: 1 }} />
          <button onClick={next} style={{ padding: '14px 22px', borderRadius: 4, background: T.ink, color: T.paper, border: 'none', cursor: 'pointer', fontFamily: T.serif, fontSize: 14, fontWeight: 500, letterSpacing: '-0.2px', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            {slide === SLIDES.length - 1 ? 'Bắt đầu' : 'Tiếp'} <Ic.arrow size={14} stroke={T.paper} />
          </button>
        </div>
      </Page>
    )
  }

  if (phase === 'auth') {
    return (
      <Page>
        <div style={{ padding: '16px 24px 0' }}>
          <button onClick={() => setPhase('carousel')} style={{ width: 36, height: 36, borderRadius: '50%', background: 'transparent', border: `1px solid ${T.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Ic.back size={16} stroke={T.ink} />
          </button>
        </div>
        <div style={{ padding: '40px 32px 0' }}>
          <Sunmark size={36} />
          <Eyebrow style={{ marginTop: 28 }}>Đăng nhập / Đăng ký</Eyebrow>
          <h1 style={{ fontFamily: T.serif, fontSize: 28, fontWeight: 400, letterSpacing: '-1px', lineHeight: 1.1, color: T.ink, margin: '14px 0 8px' }}>
            Chào mừng đến <em style={{ color: T.rust, fontWeight: 500 }}>OpenFly</em>.
          </h1>
          <p style={{ fontFamily: T.serif, fontSize: 14, color: T.ink3, fontStyle: 'italic', margin: '0 0 28px', lineHeight: 1.5 }}>
            Tiếp tục với Google để đặt vé, săn giá và nhận thông báo từ Sol.
          </p>

          {/* Real Google (GIS) when VITE_GOOGLE_CLIENT_ID is set; dev stub button otherwise. */}
          {googleClientId ? (
            <div style={{ minHeight: 44, display: 'flex', justifyContent: 'center' }}>
              <GoogleSignInButton clientId={googleClientId} onCredential={handleCredential} onError={handleGisError} />
            </div>
          ) : (
            <button onClick={handleGoogle} disabled={signingIn} style={{ width: '100%', padding: '15px 18px', background: T.paper, border: `1px solid ${T.line2}`, borderRadius: 6, cursor: signingIn ? 'default' : 'pointer', opacity: signingIn ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, fontFamily: T.serif, fontSize: 15, fontWeight: 500, color: T.ink, letterSpacing: '-0.2px' }}>
              <GoogleG size={20} /> {signingIn ? 'Đang đăng nhập…' : 'Tiếp tục với Google'}
            </button>
          )}
          {authError && <p style={{ margin: '12px 2px 0', fontFamily: T.sans, fontSize: 12, color: T.red, lineHeight: 1.45 }}>{authError}</p>}

          {/* Phone path — kept for Phase 2 (Q-7: OTP deferred) */}
          <button disabled style={{ width: '100%', marginTop: 12, padding: '15px 18px', background: 'transparent', border: `1px dashed ${T.line2}`, borderRadius: 6, cursor: 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontFamily: T.serif, fontSize: 14, fontWeight: 500, color: T.ink4, letterSpacing: '-0.2px' }}>
            <Ic.user size={16} stroke={T.ink4} /> Số điện thoại · sắp có
          </button>

          <div style={{ marginTop: 18, padding: '12px 14px', borderRadius: 6, background: T.paper2, display: 'flex', alignItems: 'flex-start', gap: 8, border: `1px solid ${T.line}` }}>
            <Ic.info size={13} stroke={T.ink3} />
            <p style={{ margin: 0, fontFamily: T.serif, fontSize: 12, color: T.ink3, fontStyle: 'italic', lineHeight: 1.5 }}>
              Tiếp tục đồng nghĩa bạn đồng ý với <span style={{ color: T.ink2, fontWeight: 500 }}>Điều khoản</span> và <span style={{ color: T.ink2, fontWeight: 500 }}>Chính sách bảo mật</span> của OpenFly.
            </p>
          </div>
        </div>
        <div style={{ flex: 1 }} />
      </Page>
    )
  }

  // done
  return (
    <Page>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 40px' }}>
        <div style={{ width: 84, height: 84, borderRadius: '50%', background: T.inkBlock, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', marginBottom: 28 }}>
          <Ic.check size={36} stroke={T.rustSoft} sw={2} />
          <div style={{ position: 'absolute', inset: -10, borderRadius: '50%', border: `1px solid ${T.line2}` }} />
        </div>
        <Eyebrow dash={false} style={{ marginBottom: 12 }}>Chào mừng</Eyebrow>
        <h1 style={{ fontFamily: T.serif, fontSize: 28, fontWeight: 400, letterSpacing: '-1px', lineHeight: 1.1, color: T.ink, margin: '0 0 10px', textAlign: 'center' }}>
          Chào <em style={{ color: T.rust, fontWeight: 500 }}>Andy</em>.
        </h1>
        <p style={{ fontFamily: T.serif, fontSize: 14, color: T.ink3, fontStyle: 'italic', margin: 0, textAlign: 'center' }}>Đang đưa bạn vào hành trình...</p>
      </div>
    </Page>
  )
}

// Google "G" mark for the sign-in button.
function GoogleG({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ display: 'block', flexShrink: 0 }}>
      <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z" />
      <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z" />
      <path fill="#FBBC05" d="M11.69 28.18c-.44-1.32-.69-2.73-.69-4.18s.25-2.86.69-4.18v-5.7H4.34A21.99 21.99 0 0 0 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z" />
      <path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z" />
    </svg>
  )
}

// ─── Onboarding marketing visuals (route / sol / radar) ──────────
function OnboardingVisual({ kind, accent }: { kind: Visual; accent: string }) {
  if (kind === 'route') {
    return (
      <svg viewBox="0 0 280 200" width="100%" height="200" style={{ maxWidth: 340 }}>
        <g stroke={T.line2} strokeWidth="0.7" fill="none" strokeDasharray="2 4">
          <ellipse cx="140" cy="220" rx="200" ry="60" />
          <ellipse cx="140" cy="210" rx="180" ry="40" />
        </g>
        <path d="M 40 150 Q 140 20 240 150" stroke={T.ink2} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <circle cx="40" cy="150" r="5" fill={T.ink} />
        <circle cx="40" cy="150" r="11" fill="none" stroke={T.ink} strokeWidth="1" opacity="0.3" />
        <circle cx="240" cy="150" r="5" fill={T.ink} />
        <circle cx="240" cy="150" r="11" fill="none" stroke={T.ink} strokeWidth="1" opacity="0.3" />
        <g transform="translate(140 55)">
          <path d="M-8 0 L8 0 M5 -3 L8 0 L5 3" stroke={accent} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <circle r="3.5" fill={accent} />
        </g>
        <text x="40" y="172" textAnchor="middle" style={{ fontFamily: T.sans, fontSize: 10, fontWeight: 600, letterSpacing: 1.5, fill: T.ink3 }}>HAN</text>
        <text x="240" y="172" textAnchor="middle" style={{ fontFamily: T.sans, fontSize: 10, fontWeight: 600, letterSpacing: 1.5, fill: T.ink3 }}>DAD</text>
      </svg>
    )
  }
  if (kind === 'sol') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 320 }}>
        <div style={{ padding: '12px 14px', borderRadius: '14px 14px 14px 4px', background: T.paper2, border: `1px solid ${T.line}`, fontFamily: T.serif, fontSize: 13, color: T.ink, fontStyle: 'italic', lineHeight: 1.45, alignSelf: 'flex-start', maxWidth: '85%' }}>“Tuần sau bay HAN-DAD dưới 1 triệu, sáng sớm có không?”</div>
        <div style={{ padding: '12px 14px', borderRadius: '14px 14px 4px 14px', background: T.inkBlock, color: T.onInk, fontFamily: T.serif, fontSize: 13, lineHeight: 1.45, alignSelf: 'flex-end', maxWidth: '85%' }}>
          <span style={{ color: T.rustSoft, fontStyle: 'italic' }}>Sol</span> · Có 3 chuyến phù hợp. Mình thích VJ513 nhất — 07:25, 890.000đ. Đặt nhé?
        </div>
        <div style={{ display: 'flex', gap: 6, alignSelf: 'flex-end' }}>
          <span style={{ padding: '6px 10px', borderRadius: 100, background: accent, color: T.paper, fontFamily: T.sans, fontSize: 11, fontWeight: 500 }}>Đặt ngay</span>
          <span style={{ padding: '6px 10px', borderRadius: 100, background: T.paper, border: `1px solid ${T.line2}`, color: T.ink2, fontFamily: T.sans, fontSize: 11, fontWeight: 500 }}>Xem thêm</span>
        </div>
      </div>
    )
  }
  // radar
  return (
    <svg viewBox="0 0 240 200" width="100%" height="200" style={{ maxWidth: 320 }}>
      <g transform="translate(120 100)">
        <circle r="86" stroke={T.line2} strokeWidth="0.8" fill="none" />
        <circle r="60" stroke={T.line2} strokeWidth="0.8" fill="none" />
        <circle r="34" stroke={T.line2} strokeWidth="0.8" fill="none" />
        <line x1="0" y1="0" x2="86" y2="-30" stroke={accent} strokeWidth="1.4" strokeLinecap="round" opacity="0.8" />
        <circle r="4" fill={accent} />
        <g>
          <circle cx="-45" cy="-22" r="3" fill={accent} />
          <text x="-45" y="-32" textAnchor="middle" style={{ fontFamily: T.sans, fontSize: 9, fontWeight: 600, fill: accent, letterSpacing: 0.3 }}>890.000</text>
        </g>
        <g>
          <circle cx="58" cy="-46" r="3" fill={T.ink2} />
          <text x="58" y="-56" textAnchor="middle" style={{ fontFamily: T.sans, fontSize: 9, fontWeight: 600, fill: T.ink3 }}>980.000</text>
        </g>
        <g>
          <circle cx="-30" cy="55" r="3" fill={T.ink2} />
          <text x="-30" y="68" textAnchor="middle" style={{ fontFamily: T.sans, fontSize: 9, fontWeight: 600, fill: T.ink3 }}>1.150.000</text>
        </g>
      </g>
    </svg>
  )
}
