// OpenFly — shared status pill meta for the Fare Hunter list + detail cards.
// Backend has 5 statuses; the view-model collapses them to 3 (found / hunting / paused).
import { T } from '../../theme/tokens'
import type { HuntStatus } from '../../data/mock'

export interface HuntStatusMeta {
  label: string
  dot: string
  text: string
  pulse: boolean
}

export function huntStatusMeta(status: HuntStatus): HuntStatusMeta {
  if (status === 'found') return { label: 'Đã tìm thấy giá tốt', dot: T.green, text: T.green, pulse: false }
  if (status === 'paused') return { label: 'Đã tạm dừng', dot: T.ink3, text: T.ink3, pulse: false }
  return { label: 'Đang săn', dot: T.amber, text: T.ink3, pulse: true }
}
