// Admin session tokens. Access token kept in memory (per tab); refresh token in
// localStorage so a reload can restore the session. Mirrors apps/web's model.
const REFRESH_KEY = "openfly-admin-refresh";

let accessToken: string | null = null;

export const session = {
  getAccess: () => accessToken,
  setAccess: (token: string | null) => {
    accessToken = token;
  },
  getRefresh: (): string | null => {
    try {
      return localStorage.getItem(REFRESH_KEY);
    } catch {
      return null;
    }
  },
  setRefresh: (token: string | null) => {
    try {
      if (token) localStorage.setItem(REFRESH_KEY, token);
      else localStorage.removeItem(REFRESH_KEY);
    } catch {
      /* ignore */
    }
  },
  set: ({ accessToken: a, refreshToken: r }: { accessToken: string; refreshToken: string }) => {
    accessToken = a;
    session.setRefresh(r);
  },
  clear: () => {
    accessToken = null;
    session.setRefresh(null);
  },
};
