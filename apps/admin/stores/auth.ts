// Admin auth store (Zustand, §5.8). Holds the signed-in admin + auth status,
// and the login/logout/bootstrap actions. Tokens live in lib/api/session.
import { create } from "zustand";
import { apiFetch } from "@/lib/api/client";
import { session } from "@/lib/api/session";

export interface AdminUser {
  id: string;
  email: string | null;
  fullName: string | null;
  role: string;
  avatarUrl: string | null;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AdminUser;
}

type AuthStatus = "loading" | "authed" | "anon";

interface AuthState {
  user: AdminUser | null;
  status: AuthStatus;
  bootstrap: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  status: "loading",

  // Restore the session on load: with a stored refresh token, GET /me (the
  // client auto-refreshes the access token on the first 401).
  bootstrap: async () => {
    if (!session.getRefresh()) {
      set({ status: "anon", user: null });
      return;
    }
    try {
      const me = await apiFetch<AdminUser>("/me");
      set({ user: me, status: "authed" });
    } catch {
      session.clear();
      set({ status: "anon", user: null });
    }
  },

  login: async (email, password) => {
    const data = await apiFetch<LoginResponse>("/auth/admin/login", {
      method: "POST",
      body: { email, password },
    });
    session.set({ accessToken: data.accessToken, refreshToken: data.refreshToken });
    set({ user: data.user, status: "authed" });
  },

  logout: () => {
    session.clear();
    set({ user: null, status: "anon" });
  },
}));
