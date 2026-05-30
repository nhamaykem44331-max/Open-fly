import { useQuery } from '@tanstack/react-query'
import { HUNTS } from './mock'
import type { Hunt } from './mock'

// Mock-first stand-ins for GET /hunts and GET /hunts/:id.
export function useHunts() {
  return useQuery({
    queryKey: ['hunts'],
    queryFn: () => new Promise<Hunt[]>((resolve) => setTimeout(() => resolve(HUNTS), 600)),
  })
}

export function useHunt(id: string | undefined) {
  return useQuery({
    queryKey: ['hunt', id],
    enabled: !!id,
    queryFn: () => new Promise<Hunt | undefined>((resolve) => setTimeout(() => resolve(HUNTS.find((h) => h.id === id)), 500)),
  })
}
