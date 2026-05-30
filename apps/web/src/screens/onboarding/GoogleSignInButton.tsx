// OpenFly — real Google Sign-In via Google Identity Services (GIS). Renders Google's own
// button (the supported way to obtain an idToken on click); the credential is the idToken the
// backend verifies at POST /auth/google. Only mounted when VITE_GOOGLE_CLIENT_ID is set —
// otherwise the onboarding falls back to the dev stub.
import { useEffect, useRef } from 'react'

const GIS_SRC = 'https://accounts.google.com/gsi/client'

// Minimal typings for the id-token flow we use (the GIS lib ships no types here).
interface GoogleIdApi {
  initialize(cfg: { client_id: string; callback: (res: { credential: string }) => void }): void
  renderButton(el: HTMLElement, opts: Record<string, string | number>): void
}
declare global {
  interface Window {
    google?: { accounts: { id: GoogleIdApi } }
  }
}

function loadGis(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve()
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SRC}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Không tải được Google Sign-In')))
      return
    }
    const s = document.createElement('script')
    s.src = GIS_SRC
    s.async = true
    s.defer = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Không tải được Google Sign-In'))
    document.head.appendChild(s)
  })
}

export function GoogleSignInButton({
  clientId,
  onCredential,
  onError,
}: {
  clientId: string
  onCredential: (idToken: string) => void
  onError: (e: Error) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let cancelled = false
    loadGis()
      .then(() => {
        if (cancelled || !ref.current || !window.google) return
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (res) => onCredential(res.credential),
        })
        window.google.accounts.id.renderButton(ref.current, {
          theme: 'outline',
          size: 'large',
          width: 320,
          text: 'continue_with',
          shape: 'rectangular',
          locale: 'vi',
        })
      })
      .catch((e) => {
        if (!cancelled) onError(e instanceof Error ? e : new Error('Lỗi Google Sign-In'))
      })
    return () => {
      cancelled = true
    }
  }, [clientId, onCredential, onError])
  return <div ref={ref} style={{ display: 'flex', justifyContent: 'center' }} />
}
