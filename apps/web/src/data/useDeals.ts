import { useQuery } from '@tanstack/react-query'
import { MY_VOUCHERS, FLASH_DEALS } from './mock'
import type { MyVoucher, FlashDeal } from './mock'

export interface DealsData { vouchers: MyVoucher[]; flash: FlashDeal[] }

// Mock-first stand-in for GET /vouchers/mine + GET /vouchers/available (deals).
export function useDeals() {
  return useQuery({
    queryKey: ['deals'],
    queryFn: () => new Promise<DealsData>((resolve) => setTimeout(() => resolve({ vouchers: MY_VOUCHERS, flash: FLASH_DEALS }), 500)),
  })
}
