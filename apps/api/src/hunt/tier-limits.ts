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
