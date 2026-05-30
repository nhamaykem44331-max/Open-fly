// OpenFly — auth session token holder.
// Access token lives in memory (short-lived, 15 min); refresh token persists in
// localStorage so the session survives reloads. Kept separate from the Zustand auth
// store to avoid a client ↔ store import cycle (the API client reads tokens from here).
const REFRESH_KEY = 'openfly-refresh'

let accessToken: string | null = null

export const session = {
  getAccess: (): string | null => accessToken,
  setAccess: (t: string | null) => {
    accessToken = t
  },
  getRefresh: (): string | null => localStorage.getItem(REFRESH_KEY),
  setRefresh: (t: string | null) => {
    if (t) localStorage.setItem(REFRESH_KEY, t)
    else localStorage.removeItem(REFRESH_KEY)
  },
  clear: () => {
    accessToken = null
    localStorage.removeItem(REFRESH_KEY)
  },
}
