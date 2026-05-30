// Fetch wrapper for the OpenFly API: attaches the Bearer access token, and on a
// 401 does a single-flight refresh + one retry (refresh tokens are single-use /
// rotated server-side, so concurrent 401s must share one refresh — same fix as
// apps/web). Base URL from NEXT_PUBLIC_API_URL (apps/admin/.env.local).
import { session } from "./session";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

let refreshing: Promise<boolean> | null = null;

function tryRefresh(): Promise<boolean> {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    const rt = session.getRefresh();
    if (!rt) return false;
    try {
      const res = await fetch(`${BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: rt }),
      });
      if (!res.ok) {
        session.clear();
        return false;
      }
      const data = await res.json();
      session.setAccess(data.accessToken);
      session.setRefresh(data.refreshToken);
      return true;
    } catch {
      return false;
    }
  })();
  const done = refreshing;
  done.finally(() => {
    if (refreshing === done) refreshing = null;
  });
  return done;
}

export interface ApiOpts {
  method?: string;
  body?: unknown;
  signal?: AbortSignal;
}

export async function apiFetch<T = unknown>(path: string, opts: ApiOpts = {}): Promise<T> {
  const doFetch = () =>
    fetch(`${BASE}${path}`, {
      method: opts.method ?? "GET",
      headers: {
        "Content-Type": "application/json",
        ...(session.getAccess() ? { Authorization: `Bearer ${session.getAccess()}` } : {}),
      },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: opts.signal,
    });

  let res = await doFetch();
  if (res.status === 401 && session.getRefresh()) {
    const ok = await tryRefresh();
    if (ok) res = await doFetch();
  }

  if (!res.ok) {
    let message = "Đã có lỗi xảy ra, vui lòng thử lại.";
    try {
      const err = await res.json();
      message = Array.isArray(err.message) ? err.message[0] : (err.message ?? message);
    } catch {
      /* keep default */
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return null as T;
  return res.json() as Promise<T>;
}
