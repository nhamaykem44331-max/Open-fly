import { useQuery } from '@tanstack/react-query'
import { FLIGHTS } from './mock'
import type { Flight } from './mock'
import { useSearchStore } from '../stores/search'
import type { SearchQuery } from '../stores/search'
import { apiEnabled, apiFetch } from '../lib/api/client'
import { adaptOffer, viDateLabel } from '../lib/api/adapters'
import type { ApiSearchResponse } from '../lib/api/types'

export interface ResultsData {
  flights: Flight[]
  route: { from: string; to: string }
  dateLabel: string
  pax: number
  cabin: string
}

const paxTotal = (q: SearchQuery) => q.paxAdt + q.paxChd + q.paxInf

// A search that runs longer than this is surfaced as a timeout (the multi-airline aggregator
// is slow), not a generic error. Tunable once real Muadi search latency is known.
const SEARCH_TIMEOUT_MS = 20_000

export class SearchTimeoutError extends Error {
  constructor() {
    super('SEARCH_TIMEOUT')
    this.name = 'SearchTimeoutError'
  }
}
export const isSearchTimeout = (e: unknown): boolean => e instanceof SearchTimeoutError

// Real path: POST /flights/search → adapt offers (full VND → "k" at the boundary). Aborts after
// SEARCH_TIMEOUT_MS and rethrows a SearchTimeoutError so the route can show the timeout screen.
async function fetchResultsApi(q: SearchQuery): Promise<ResultsData> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS)
  try {
    const res = await apiFetch<ApiSearchResponse>('/flights/search', {
      method: 'POST',
      signal: controller.signal,
      body: {
        origin: q.origin,
        destination: q.destination,
        date: q.date,
        paxAdt: q.paxAdt,
        paxChd: q.paxChd,
        paxInf: q.paxInf,
      },
    })
    return {
      flights: res.offers.map((o) => adaptOffer(o, res.query.date)),
      route: { from: res.query.origin, to: res.query.destination },
      dateLabel: viDateLabel(res.query.date),
      pax: paxTotal(res.query),
      cabin: 'Phổ thông',
    }
  } catch (e) {
    if (controller.signal.aborted) throw new SearchTimeoutError()
    throw e
  } finally {
    clearTimeout(timer)
  }
}

// Mock fallback (no VITE_API_URL). Route/date reflect the form; flights stay the demo set.
function fetchResultsMock(q: SearchQuery): Promise<ResultsData> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        flights: FLIGHTS,
        route: { from: q.origin, to: q.destination },
        dateLabel: viDateLabel(q.date),
        pax: paxTotal(q),
        cabin: 'Phổ thông',
      })
    }, 700)
  })
}

export function useResults() {
  const q = useSearchStore()
  return useQuery({
    queryKey: ['results', q.origin, q.destination, q.date, q.paxAdt, q.paxChd, q.paxInf],
    queryFn: () => (apiEnabled ? fetchResultsApi(q) : fetchResultsMock(q)),
  })
}
