import { MembershipTier } from '@prisma/client';

/**
 * Hạn mức Fare Hunter theo membership tier (KEHOACH 6.2, Q-54).
 * - maxActiveHunts: số hunt đang HUNTING tối đa cùng lúc.
 * - minIntervalMinutes: tần suất quét tối thiểu (chống spam tài nguyên Muadi).
 */
export interface TierLimit {
  maxActiveHunts: number;
  minIntervalMinutes: number;
}

export const TIER_LIMITS: Record<MembershipTier, TierLimit> = {
  STANDARD: { maxActiveHunts: 3, minIntervalMinutes: 120 },
  PREMIUM: { maxActiveHunts: 10, minIntervalMinutes: 60 },
  AGENT: { maxActiveHunts: 50, minIntervalMinutes: 30 },
};

export function tierLimit(tier: MembershipTier): TierLimit {
  return TIER_LIMITS[tier] ?? TIER_LIMITS.STANDARD;
}

/**
 * Số booking auto-hold đang chờ thanh toán tối đa cùng lúc cho 1 user (Q-54).
 * Chống lạm dụng giữ chỗ free.
 */
export const AUTO_HOLD_CONCURRENCY: Record<MembershipTier, number> = {
  STANDARD: 1,
  PREMIUM: 3,
  AGENT: 10,
};

export function autoHoldConcurrency(tier: MembershipTier): number {
  return AUTO_HOLD_CONCURRENCY[tier] ?? AUTO_HOLD_CONCURRENCY.STANDARD;
}
