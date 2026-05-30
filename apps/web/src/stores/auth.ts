// OpenFly — auth store (Zustand). Holds the signed-in user for the UI; tokens live in
// `session` (access in memory, refresh in localStorage). bootstrap() restores a session
// from a stored refresh token on app load. When the API is disabled (no VITE_API_URL)
// the app is treated as anonymous and screens keep using mock data.
import { create } from 'zustand'
import { apiEnabled, apiFetch } from '../lib/api/client'
import { session } from '../lib/api/session'
import type { ApiUser, AuthResponse } from '../lib/api/types'

type AuthStatus = 'loading' | 'authed' | 'anon'

interface AuthState {
  status: AuthStatus
  user: ApiUser | null
  signInGoogle: (idToken: string) => Promise<void>
  signOut: () => void
  bootstrap: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  user: null,

  async signInGoogle(idToken) {
    const res = await apiFetch<AuthResponse>('/auth/google', { method: 'POST', body: { idToken } })
    session.setAccess(res.accessToken)
    session.setRefresh(res.refreshToken)
    set({ status: 'authed', user: res.user })
  },

  signOut() {
    session.clear()
    set({ status: 'anon', user: null })
  },

  async bootstrap() {
    if (!apiEnabled || !session.getRefresh()) {
      set({ status: 'anon', user: null })
      return
    }
    try {
      // No access token yet → /me returns 401 → apiFetch refreshes via the stored
      // refresh token and retries automatically.
      const me = await apiFetch<ApiUser>('/me', { auth: true })
      set({ status: 'authed', user: me })
    } catch {
      session.clear()
      set({ status: 'anon', user: null })
    }
  },
}))
