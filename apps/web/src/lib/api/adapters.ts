// OpenFly — map backend API shapes onto the web's view models.
// CRITICAL: API prices are FULL VND (Q-45); the web's Price/fmtVnd components expect
// "k" units (value × 1000), so divide by 1000 here at the boundary — never downstream.
import type { Flight } from '../../data/mock'
import type { ApiFlightOffer } from './types'

export const vndToK = (vnd: number): number => vnd / 1000

const hhmm = (iso: string): string => iso.slice(11, 16) // "...T16:40:00+07:00" → "16:40"

export const fmtDurationMin = (min: number): string => `${Math.floor(min / 60)}g ${min % 60}p`

const VI_DOW = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
export function viDateLabel(date: string): string {
  const d = new Date(`${date}T00:00:00+07:00`)
  if (Number.isNaN(d.getTime())) return date
  return `${VI_DOW[d.getDay()]}, ${d.getDate()} thg ${d.getMonth() + 1}`
}

const refundLabel = (refundable?: boolean): string =>
  refundable ? 'Có thể đổi/hoàn (theo điều kiện vé)' : 'Không hoàn, đổi có phí'

// One API offer → one web Flight. Uses the cheapest fare class for the price breakdown.
export function adaptOffer(offer: ApiFlightOffer, date: string): Flight {
  const first = offer.segments[0]
  const last = offer.segments[offer.segments.length - 1]
  const fare = offer.fareClasses[0]
  return {
    id: offer.id,
    airline: offer.airline.code,
    number: offer.flightNumber,
    aircraft: first?.aircraft || '—',
    depart: first ? hhmm(first.departTime) : '',
    arrive: last ? hhmm(last.arriveTime) : '',
    duration: fmtDurationMin(offer.durationMinutes),
    stops: offer.isDirect ? 0 : Math.max(0, offer.segments.length - 1),
    from: first?.from.code ?? '',
    to: last?.to.code ?? '',
    date,
    price: vndToK(offer.cheapestPriceVnd),
    basePrice: fare ? vndToK(fare.baseFareVnd) : vndToK(offer.cheapestPriceVnd),
    tax: fare ? vndToK(fare.taxesFeesVnd) : 0,
    fee: 0,
    cabin: fare?.name ?? 'Phổ thông',
    baggage: { carry: '7kg', check: fare?.baggage ?? '—' },
    refundable: refundLabel(fare?.refundable),
    insight: null,
  }
}
