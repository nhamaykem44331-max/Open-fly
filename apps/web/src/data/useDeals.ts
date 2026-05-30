import { useQuery } from '@tanstack/react-query'
import { MY_VOUCHERS, FLASH_DEALS } from './mock'
import type { MyVoucher, FlashDeal } from './mock'
import { apiEnabled, apiFetch } from '../lib/api/client'
import { adaptUserVoucher } from '../lib/api/adapters'
import type { ApiVoucherList } from '../lib/api/types'

export interface DealsData { vouchers: MyVoucher[]; flash: FlashDeal[] }

// GET /vouchers → the user's owned vouchers (`mine`). Flash deals have no backend in Phase 1
// (no promo engine yet), so they're empty in API mode — the screens hide that section — and
// only appear with mock/design data.
async function fetchDealsApi(): Promise<DealsData> {
  const res = await apiFetch<ApiVoucherList>('/vouchers', { auth: true })
  return { vouchers: res.mine.map(adaptUserVoucher), flash: [] }
}

export function useDeals() {
  return useQuery({
    queryKey: ['deals'],
    queryFn: () =>
      apiEnabled
        ? fetchDealsApi()
        : new Promise<DealsData>((resolve) => setTimeout(() => resolve({ vouchers: MY_VOUCHERS, flash: FLASH_DEALS }), 500)),
  })
}
