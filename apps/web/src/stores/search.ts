// OpenFly — current search query (Zustand). Set by the Search form, read by useResults.
// Mirrors the API's SearchParamsDto. Defaults to the standard HAN→DAD demo route so
// /results renders standalone (e.g. on refresh) before a form submit.
import { create } from 'zustand'
import { DEFAULT_SEARCH } from '../data/mock'

export interface SearchQuery {
  origin: string
  destination: string
  date: string // YYYY-MM-DD
  paxAdt: number
  paxChd: number
  paxInf: number
}

interface SearchState extends SearchQuery {
  setSearch: (q: Partial<SearchQuery>) => void
}

export const useSearchStore = create<SearchState>((set) => ({
  origin: DEFAULT_SEARCH.from,
  destination: DEFAULT_SEARCH.to,
  date: DEFAULT_SEARCH.date,
  paxAdt: DEFAULT_SEARCH.pax,
  paxChd: 0,
  paxInf: 0,
  setSearch: (q) => set(q),
}))
