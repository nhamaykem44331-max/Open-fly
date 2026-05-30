// OpenFly — typed fetch wrapper for the OpenFly API.
// Env-gated: if VITE_API_URL is set the app talks to the real backend; otherwise
// `apiEnabled` is false and callers fall back to mock data. On a 401 for an
// authenticated call it transparently refreshes the access token once, then retries.
import { session } from './session'
import type { RefreshResponse } from './types'

export const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')
export const apiEnabled = API_URL.length > 0
const BASE = `${API_URL}/api/v1`

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
    this.name = 'ApiError'
  }
}

interface RequestOpts {
  method?: string
  body?: unknown
  auth?: boolean
  retried?: boolean
  idempotencyKey?: string
  signal?: AbortSignal
}

function rawFetch(path: string, opts: RequestOpts): Promise<Response> {
  const headers: Record<string, string> = {}
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json'
  if (opts.auth) {
    const token = session.getAccess()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }
  if (opts.idempotencyKey) headers['Idempotency-Key'] = opts.idempotencyKey
  return fetch(`${BASE}${path}`, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
  })
}

async function doRefresh(): Promise<boolean> {
  const refreshToken = session.getRefresh()
  if (!refreshToken) return false
  const res = await rawFetch('/auth/refresh', { method: 'POST', body: { refreshToken } })
  if (!res.ok) {
    session.clear()
    return false
  }
  const data = (await res.json()) as RefreshResponse
  session.setAccess(data.accessToken)
  session.setRefresh(data.refreshToken)
  return true
}

// Single-flight: concurrent 401s must share ONE refresh. Refresh tokens are single-use
// (the backend rotates them), so parallel refreshes would invalidate each other and log
// the user out. The first caller starts it; the rest await the same promise.
let refreshInFlight: Promise<boolean> | null = null
function tryRefresh(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = doRefresh().finally(() => {
      refreshInFlight = null
    })
  }
  return refreshInFlight
}

export async function apiFetch<T>(path: string, opts: RequestOpts = {}): Promise<T> {
  let res = await rawFetch(path, opts)
  if (res.status === 401 && opts.auth && !opts.retried) {
    if (await tryRefresh()) res = await rawFetch(path, { ...opts, retried: true })
  }
  if (!res.ok) {
    let message = `HTTP ${res.status}`
    try {
      const err = (await res.json()) as { message?: string | string[] }
      if (err.message) message = Array.isArray(err.message) ? err.message.join(', ') : err.message
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(res.status, message)
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}
