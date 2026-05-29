import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import {
  NotificationChannel,
  NotificationKind,
  Prisma,
} from '@prisma/client';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from './telegram.service';

export const NOTIFY_QUEUE = 'notify.dispatch';

// Các loại thông báo khẩn — BỎ QUA quiet hours (khách cần biết ngay).
const URGENT_KINDS = new Set<NotificationKind>([
  NotificationKind.HUNT_FOUND,
  NotificationKind.BOOKING_CONFIRMED,
  NotificationKind.BOOKING_TICKETED,
  NotificationKind.PAYMENT_SUCCESS,
  NotificationKind.PAYMENT_FAILED,
]);

const CHANNEL_BY_STRING: Record<string, NotificationChannel> = {
  telegram: NotificationChannel.TELEGRAM,
  email: NotificationChannel.EMAIL,
  push: NotificationChannel.PUSH,
  zalo: NotificationChannel.ZALO,
  in_app: NotificationChannel.IN_APP,
};

export interface NotifyInput {
  userId: string;
  kind: NotificationKind;
  title: string;
  body: string;
  huntId?: string;
  bookingId?: string;
  ctaUrl?: string;
  ctaLabel?: string;
  payload?: Prisma.InputJsonValue;
  requestedChannels?: string[]; // hunt.channels; rỗng -> tất cả kênh user bật
}

interface PrefsView {
  pushEnabled: boolean;
  telegramEnabled: boolean;
  emailEnabled: boolean;
  zaloEnabled: boolean;
  telegramChatId: string | null;
  zaloUserId: string | null;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
}

const DEFAULT_PREFS: PrefsView = {
  pushEnabled: true,
  telegramEnabled: false,
  emailEnabled: true,
  zaloEnabled: false,
  telegramChatId: null,
  zaloUserId: null,
  quietHoursStart: null,
  quietHoursEnd: null,
};

@Injectable()
export class NotifierService {
  private readonly logger = new Logger(NotifierService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly telegram: TelegramService,
    @InjectQueue(NOTIFY_QUEUE) private readonly queue: Queue,
  ) {}

  /** Tạo Notification (IN_APP giao ngay) + xếp job dispatch cho kênh ngoài. */
  async enqueue(input: NotifyInput): Promise<string> {
    const prefs = await this.loadPrefs(input.userId);
    const attempted = this.resolveChannels(prefs, input.requestedChannels);

    const notification = await this.prisma.notification.create({
      data: {
        userId: input.userId,
        kind: input.kind,
        title: input.title,
        body: input.body,
        ctaUrl: input.ctaUrl ?? null,
        ctaLabel: input.ctaLabel ?? null,
        payload: input.payload ?? Prisma.JsonNull,
        huntId: input.huntId ?? null,
        bookingId: input.bookingId ?? null,
        channelsAttempted: attempted,
        channelsSucceeded: attempted.includes(NotificationChannel.IN_APP)
          ? [NotificationChannel.IN_APP]
          : [],
      },
    });

    await this.queue.add(
      'dispatch',
      { notificationId: notification.id },
      { removeOnComplete: true },
    );

    return notification.id;
  }

  /**
   * Gửi tới các kênh ngoài. Trả deferUntilMs > 0 nếu cần hoãn (quiet hours,
   * thông báo không khẩn) — processor sẽ xếp lại job với delay đó.
   */
  async dispatch(
    notificationId: string,
    now: Date = new Date(),
  ): Promise<{ deferUntilMs: number }> {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });
    if (!notification) {
      return { deferUntilMs: 0 };
    }

    const externals = notification.channelsAttempted.filter(
      (c) => c !== NotificationChannel.IN_APP,
    );
    if (externals.length === 0) {
      return { deferUntilMs: 0 };
    }

    const prefs = await this.loadPrefs(notification.userId);
    if (!URGENT_KINDS.has(notification.kind)) {
      const deferMs = quietHoursDeferMs(
        prefs.quietHoursStart,
        prefs.quietHoursEnd,
        now,
      );
      if (deferMs > 0) {
        return { deferUntilMs: deferMs };
      }
    }

    const succeeded = new Set<NotificationChannel>(
      notification.channelsSucceeded,
    );
    const text = formatMessage(
      notification.title,
      notification.body,
      notification.ctaUrl,
    );

    for (const channel of externals) {
      if (channel === NotificationChannel.TELEGRAM) {
        if (prefs.telegramChatId) {
          const ok = await this.telegram.sendMessage(prefs.telegramChatId, text);
          if (ok) succeeded.add(NotificationChannel.TELEGRAM);
        }
      } else {
        // PUSH / EMAIL / ZALO: chưa hỗ trợ ở Sprint 3 (stub) — bỏ qua.
        this.logger.debug(`Kênh ${channel} chưa hỗ trợ (stub), bỏ qua`);
      }
    }

    await this.prisma.notification.update({
      where: { id: notificationId },
      data: { channelsSucceeded: Array.from(succeeded) },
    });

    return { deferUntilMs: 0 };
  }

  private async loadPrefs(userId: string): Promise<PrefsView> {
    const prefs = await this.prisma.notificationPreference.findUnique({
      where: { userId },
    });

    return prefs ?? DEFAULT_PREFS;
  }

  private resolveChannels(
    prefs: PrefsView,
    requested: string[] | undefined,
  ): NotificationChannel[] {
    const enabled = new Set<NotificationChannel>([NotificationChannel.IN_APP]);
    if (prefs.telegramEnabled && prefs.telegramChatId) {
      enabled.add(NotificationChannel.TELEGRAM);
    }
    if (prefs.pushEnabled) enabled.add(NotificationChannel.PUSH);
    if (prefs.emailEnabled) enabled.add(NotificationChannel.EMAIL);
    if (prefs.zaloEnabled && prefs.zaloUserId) {
      enabled.add(NotificationChannel.ZALO);
    }

    if (!requested || requested.length === 0) {
      return Array.from(enabled);
    }

    const requestedEnums = new Set<NotificationChannel>(
      [NotificationChannel.IN_APP],
    );
    for (const raw of requested) {
      const mapped = CHANNEL_BY_STRING[raw.toLowerCase()];
      if (mapped && enabled.has(mapped)) {
        requestedEnums.add(mapped);
      }
    }

    return Array.from(requestedEnums);
  }
}

function formatMessage(
  title: string,
  body: string,
  ctaUrl: string | null,
): string {
  const parts = [`<b>${escapeHtml(title)}</b>`, escapeHtml(body)];
  if (ctaUrl) {
    parts.push(ctaUrl);
  }

  return parts.join('\n');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Trả số ms cần hoãn nếu `now` đang trong khung quiet hours (giờ địa phương VN
 * +07), ngược lại 0. Hỗ trợ khung qua nửa đêm (vd 22:00 -> 07:00).
 */
export function quietHoursDeferMs(
  start: string | null,
  end: string | null,
  now: Date,
): number {
  if (!start || !end) {
    return 0;
  }
  const startMin = parseHhMm(start);
  const endMin = parseHhMm(end);
  if (startMin == null || endMin == null || startMin === endMin) {
    return 0;
  }

  // Phút trong ngày theo giờ VN (+07).
  const vn = new Date(now.getTime() + 7 * 60 * 60_000);
  const nowMin = vn.getUTCHours() * 60 + vn.getUTCMinutes();

  const inQuiet =
    startMin < endMin
      ? nowMin >= startMin && nowMin < endMin
      : nowMin >= startMin || nowMin < endMin; // qua nửa đêm

  if (!inQuiet) {
    return 0;
  }

  let minutesUntilEnd = endMin - nowMin;
  if (minutesUntilEnd <= 0) {
    minutesUntilEnd += 24 * 60;
  }

  return minutesUntilEnd * 60_000;
}

function parseHhMm(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) {
    return null;
  }
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h > 23 || m > 59) {
    return null;
  }

  return h * 60 + m;
}
