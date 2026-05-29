import { NotificationChannel, NotificationKind } from '@prisma/client';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationContentService } from '../notification-content.service';
import {
  NotifierService,
  quietHoursDeferMs,
} from '../notifier.service';
import { TelegramService } from '../telegram.service';

// VN 23:00 = 16:00Z (trong khung 22:00-07:00); VN 12:00 = 05:00Z (ngoài khung).
const NIGHT = new Date('2026-06-10T16:00:00Z');
const NOON = new Date('2026-06-10T05:00:00Z');

describe('quietHoursDeferMs', () => {
  it('trong khung qua nửa đêm (22:00-07:00) lúc 23:00 VN -> hoãn > 0', () => {
    expect(quietHoursDeferMs('22:00', '07:00', NIGHT)).toBeGreaterThan(0);
  });

  it('ngoài khung lúc 12:00 VN -> 0', () => {
    expect(quietHoursDeferMs('22:00', '07:00', NOON)).toBe(0);
  });

  it('thiếu cấu hình -> 0', () => {
    expect(quietHoursDeferMs(null, '07:00', NIGHT)).toBe(0);
  });
});

describe('NotifierService', () => {
  let prisma: {
    notification: {
      create: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    notificationPreference: { findUnique: jest.Mock };
    user: { findUnique: jest.Mock };
  };
  let telegram: { sendMessage: jest.Mock };
  let queue: { add: jest.Mock };
  let service: NotifierService;

  beforeEach(() => {
    prisma = {
      notification: {
        create: jest.fn().mockResolvedValue({ id: 'n1' }),
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
      },
      notificationPreference: { findUnique: jest.fn() },
      user: { findUnique: jest.fn().mockResolvedValue({ fullName: null }) },
    };
    telegram = { sendMessage: jest.fn().mockResolvedValue(true) };
    queue = { add: jest.fn().mockResolvedValue({}) };
    service = new NotifierService(
      prisma as unknown as PrismaService,
      telegram as unknown as TelegramService,
      new NotificationContentService(),
      queue as unknown as Queue,
    );
  });

  it('enqueue: tạo Notification (IN_APP + TELEGRAM) + xếp job dispatch', async () => {
    prisma.notificationPreference.findUnique.mockResolvedValue({
      telegramEnabled: true,
      telegramChatId: '123',
      pushEnabled: false,
      emailEnabled: false,
      zaloEnabled: false,
      zaloUserId: null,
      quietHoursStart: null,
      quietHoursEnd: null,
    });

    await service.enqueue({
      userId: 'u1',
      kind: NotificationKind.HUNT_FOUND,
      payload: { autoHeld: false, route: 'HAN-SGN', price: 1_490_000 },
      requestedChannels: ['telegram', 'in_app'],
    });

    const data = prisma.notification.create.mock.calls[0][0].data;
    expect(data.channelsAttempted).toEqual(
      expect.arrayContaining([
        NotificationChannel.IN_APP,
        NotificationChannel.TELEGRAM,
      ]),
    );
    expect(data.channelsSucceeded).toEqual([NotificationChannel.IN_APP]);
    expect(queue.add).toHaveBeenCalledWith(
      'dispatch',
      { notificationId: 'n1' },
      expect.any(Object),
    );
  });

  it('dispatch HUNT_FOUND (khẩn) trong quiet hours -> vẫn gửi Telegram', async () => {
    prisma.notification.findUnique.mockResolvedValue({
      id: 'n1',
      userId: 'u1',
      kind: NotificationKind.HUNT_FOUND,
      title: 'Tìm thấy vé',
      body: 'x',
      ctaUrl: null,
      channelsAttempted: [NotificationChannel.IN_APP, NotificationChannel.TELEGRAM],
      channelsSucceeded: [NotificationChannel.IN_APP],
    });
    prisma.notificationPreference.findUnique.mockResolvedValue({
      telegramEnabled: true,
      telegramChatId: '123',
      pushEnabled: false,
      emailEnabled: false,
      zaloEnabled: false,
      zaloUserId: null,
      quietHoursStart: '22:00',
      quietHoursEnd: '07:00',
    });

    const result = await service.dispatch('n1', NIGHT);

    expect(result.deferUntilMs).toBe(0);
    expect(telegram.sendMessage).toHaveBeenCalledWith('123', expect.any(String));
    expect(prisma.notification.update).toHaveBeenCalled();
  });

  it('dispatch HUNT_PROGRESS (không khẩn) trong quiet hours -> hoãn, không gửi', async () => {
    prisma.notification.findUnique.mockResolvedValue({
      id: 'n2',
      userId: 'u1',
      kind: NotificationKind.HUNT_PROGRESS,
      title: 'Giá giảm',
      body: 'x',
      ctaUrl: null,
      channelsAttempted: [NotificationChannel.IN_APP, NotificationChannel.TELEGRAM],
      channelsSucceeded: [NotificationChannel.IN_APP],
    });
    prisma.notificationPreference.findUnique.mockResolvedValue({
      telegramEnabled: true,
      telegramChatId: '123',
      pushEnabled: false,
      emailEnabled: false,
      zaloEnabled: false,
      zaloUserId: null,
      quietHoursStart: '22:00',
      quietHoursEnd: '07:00',
    });

    const result = await service.dispatch('n2', NIGHT);

    expect(result.deferUntilMs).toBeGreaterThan(0);
    expect(telegram.sendMessage).not.toHaveBeenCalled();
  });

  it('dispatch HUNT_PROGRESS ngoài quiet hours -> gửi Telegram', async () => {
    prisma.notification.findUnique.mockResolvedValue({
      id: 'n3',
      userId: 'u1',
      kind: NotificationKind.HUNT_PROGRESS,
      title: 'Giá giảm',
      body: 'x',
      ctaUrl: null,
      channelsAttempted: [NotificationChannel.IN_APP, NotificationChannel.TELEGRAM],
      channelsSucceeded: [NotificationChannel.IN_APP],
    });
    prisma.notificationPreference.findUnique.mockResolvedValue({
      telegramEnabled: true,
      telegramChatId: '123',
      pushEnabled: false,
      emailEnabled: false,
      zaloEnabled: false,
      zaloUserId: null,
      quietHoursStart: '22:00',
      quietHoursEnd: '07:00',
    });

    const result = await service.dispatch('n3', NOON);

    expect(result.deferUntilMs).toBe(0);
    expect(telegram.sendMessage).toHaveBeenCalled();
  });
});
