import { Injectable } from '@nestjs/common';
import { NotificationChannel, NotificationKind } from '@prisma/client';

export interface RenderedContent {
  title: string;
  body: string;
  ctaUrl?: string | null;
  ctaLabel?: string | null;
}

export interface ContentUser {
  fullName?: string | null;
}

/**
 * Sol Phase 1 — "trợ lý thông báo" bằng template TĨNH cá nhân hoá (chưa dùng AI,
 * Q-59). Nguồn nội dung notification duy nhất: render theo kind + payload + user,
 * giọng văn ấm áp, đủ dấu, không phóng đại (theo design system voice).
 * Channel hiện render giống nhau; tham số channel để mở rộng sau.
 */
@Injectable()
export class NotificationContentService {
  render(
    kind: NotificationKind | string,
    payload: Record<string, unknown> = {},
    user: ContentUser | null = null,
    _channel: NotificationChannel | 'in_app' = 'in_app',
  ): RenderedContent {
    const hi = greeting(user);
    switch (kind) {
      case 'HUNT_FOUND': {
        const route = str(payload.route);
        const price = vnd(payload.price);
        if (payload.autoHeld) {
          const deadline = dateText(payload.deadline);
          return {
            title: 'OpenFly đã giữ chỗ cho bạn',
            body: `${hi}OpenFly vừa giữ chỗ ${route} với giá ${price}. Thanh toán trước ${deadline} để giữ vé nhé.`,
            ctaLabel: 'Thanh toán',
          };
        }
        return {
          title: 'Tìm thấy vé đúng giá',
          body: `${hi}đã có vé ${route} giá ${price} — đúng mức bạn mong. Đặt sớm để giữ giá.`,
          ctaLabel: 'Đặt ngay',
        };
      }
      case 'HUNT_PROGRESS': {
        const route = str(payload.route);
        const price = payload.price != null ? vnd(payload.price) : 'mức mới';
        return {
          title: 'Giá đang giảm',
          body: `${hi}giá ${route} hiện còn ${price}. Mình vẫn đang theo dõi tiếp cho bạn.`,
        };
      }
      case 'SYSTEM':
        return {
          title: str(payload.title) || 'Thông báo từ OpenFly',
          body: `${hi}${str(payload.body)}`.trim(),
        };
      default:
        return {
          title: str(payload.title) || 'Thông báo',
          body: str(payload.body),
        };
    }
  }
}

// Lời chào theo tên gọi (token cuối của họ tên VN), có thì "An ơi, ", không thì "".
function greeting(user: ContentUser | null): string {
  const full = user?.fullName?.trim();
  if (!full) return '';
  const given = full.split(/\s+/).pop();
  if (!given) return '';
  // Title-case tên gọi cho thân thiện (tên lưu thường viết HOA).
  const nice = given.charAt(0).toUpperCase() + given.slice(1).toLowerCase();
  return `${nice} ơi, `;
}

function vnd(value: unknown): string {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? `${n.toLocaleString('vi-VN')}đ` : 'giá tốt';
}

function dateText(value: unknown): string {
  if (!value) return 'hạn quy định';
  const d = new Date(value as string);
  return Number.isNaN(d.getTime()) ? 'hạn quy định' : d.toLocaleString('vi-VN');
}

function str(value: unknown): string {
  return value == null ? '' : String(value);
}
