// BookingStatus (Prisma enum) → Vietnamese label + chip tone. Shared by the
// lookup table, detail drawer, and future booking screens.
export type ChipTone = "green" | "amber" | "red" | "rust" | "neutral";

export const BOOKING_STATUS: Record<string, { label: string; tone: ChipTone }> = {
  DRAFT: { label: "Nháp", tone: "neutral" },
  HELD: { label: "Giữ chỗ", tone: "amber" },
  PAYMENT_PENDING: { label: "Chờ thanh toán", tone: "amber" },
  PAID: { label: "Đã thanh toán", tone: "rust" },
  PRICING_PENDING: { label: "Chờ định giá", tone: "amber" },
  TICKETED: { label: "Đã xuất vé", tone: "green" },
  ISSUE_FAILED: { label: "Xuất vé lỗi", tone: "red" },
  EXPIRED: { label: "Hết hạn", tone: "neutral" },
  CANCELLED: { label: "Đã hủy", tone: "neutral" },
  REFUNDED: { label: "Đã hoàn", tone: "amber" },
  FAILED: { label: "Thất bại", tone: "red" },
};

export function bookingStatus(s: string): { label: string; tone: ChipTone } {
  return BOOKING_STATUS[s] ?? { label: s, tone: "neutral" };
}
