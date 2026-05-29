import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { MembershipTier } from '@prisma/client';
import { Queue } from 'bullmq';
import { RedisService } from '../../integrations/redis/redis.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateHuntDto } from '../dto/create-hunt.dto';
import { HuntActor, HuntService } from '../hunt.service';

const STANDARD: HuntActor = { id: 'u1', tier: MembershipTier.STANDARD };

function baseDto(overrides: Partial<CreateHuntDto> = {}): CreateHuntDto {
  return {
    fromCode: 'HAN',
    toCode: 'SGN',
    flexibility: 'EXACT_DATE',
    windowStart: '2026-06-10',
    windowEnd: '2026-06-12',
    targetPrice: 1_500_000,
    ...overrides,
  } as CreateHuntDto;
}

describe('HuntService', () => {
  let prisma: {
    hunt: {
      count: jest.Mock;
      create: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    auditLog: { create: jest.Mock };
  };
  let redis: { setNx: jest.Mock; get: jest.Mock; set: jest.Mock; del: jest.Mock };
  let queue: { add: jest.Mock };
  let service: HuntService;

  beforeEach(() => {
    prisma = {
      hunt: {
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({ id: 'h1', ...data }),
        ),
        findUnique: jest.fn(),
        update: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({ id: 'h1', userId: 'u1', ...data }),
        ),
        delete: jest.fn().mockResolvedValue({ id: 'h1' }),
      },
      auditLog: { create: jest.fn().mockResolvedValue({}) },
    };
    redis = {
      setNx: jest.fn().mockResolvedValue(true),
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };
    queue = { add: jest.fn().mockResolvedValue({}) };
    service = new HuntService(
      prisma as unknown as PrismaService,
      redis as unknown as RedisService,
      queue as unknown as Queue,
    );
  });

  it('tạo hunt khi dưới quota: lưu DB + enqueue lần quét đầu + ghi audit', async () => {
    const hunt = await service.create(STANDARD, baseDto());

    expect(hunt.id).toBe('h1');
    expect(prisma.hunt.create).toHaveBeenCalledTimes(1);
    expect(queue.add).toHaveBeenCalledWith(
      'scan',
      { huntId: 'h1' },
      expect.objectContaining({ delay: 1000 }),
    );
    expect(prisma.auditLog.create).toHaveBeenCalled();
  });

  it('chuẩn hoá fromCode/toCode hoa và từ chối trùng điểm', async () => {
    await expect(
      service.create(STANDARD, baseDto({ fromCode: 'han', toCode: 'HAN' })),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('từ chối khi windowEnd < windowStart', async () => {
    await expect(
      service.create(
        STANDARD,
        baseDto({ windowStart: '2026-06-12', windowEnd: '2026-06-10' }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('chặn vượt quota theo tier (STANDARD max 3)', async () => {
    prisma.hunt.count.mockResolvedValue(3);

    await expect(service.create(STANDARD, baseDto())).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(prisma.hunt.create).not.toHaveBeenCalled();
  });

  it('ép intervalMinutes về tối thiểu của tier (STANDARD 120) khi yêu cầu nhỏ hơn', async () => {
    await service.create(STANDARD, baseDto({ intervalMinutes: 30 }));

    expect(prisma.hunt.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ intervalMinutes: 120 }),
      }),
    );
  });

  it('giữ intervalMinutes khi lớn hơn tối thiểu', async () => {
    await service.create(STANDARD, baseDto({ intervalMinutes: 180 }));

    expect(prisma.hunt.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ intervalMinutes: 180 }),
      }),
    );
  });

  it('bật auto-hold mà thiếu hành khách người lớn → BadRequest', async () => {
    await expect(
      service.create(
        STANDARD,
        baseDto({
          autoHoldEnabled: true,
          autoHoldPassengers: [
            { title: 'MSTR', firstName: 'BE', lastName: 'NGUYEN', type: 'CHD' },
          ],
          autoHoldContactPhone: '+84903271845',
          autoHoldContactEmail: 'a@b.com',
        }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('bật auto-hold mà thiếu liên hệ → BadRequest', async () => {
    await expect(
      service.create(
        STANDARD,
        baseDto({
          autoHoldEnabled: true,
          autoHoldPassengers: [
            { title: 'MR', firstName: 'KIEN', lastName: 'NGUYEN', type: 'ADT' },
          ],
        }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rollback (xoá hunt) khi enqueue lần đầu thất bại', async () => {
    queue.add.mockRejectedValue(new Error('redis down'));

    await expect(service.create(STANDARD, baseDto())).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(prisma.hunt.delete).toHaveBeenCalledWith({ where: { id: 'h1' } });
  });

  it('cancel của người không sở hữu → NotFound', async () => {
    prisma.hunt.findUnique.mockResolvedValue({ id: 'h1', userId: 'other' });

    await expect(service.cancel('u1', 'h1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('runNow khi hunt không HUNTING → Conflict', async () => {
    prisma.hunt.findUnique.mockResolvedValue({
      id: 'h1',
      userId: 'u1',
      status: 'PAUSED',
    });

    await expect(service.runNow('u1', 'h1')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('runNow bị chặn khi vừa quét (lock chưa nhả)', async () => {
    prisma.hunt.findUnique.mockResolvedValue({
      id: 'h1',
      userId: 'u1',
      status: 'HUNTING',
    });
    redis.setNx.mockResolvedValue(false);

    await expect(service.runNow('u1', 'h1')).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(queue.add).not.toHaveBeenCalled();
  });

  it('runNow hợp lệ → enqueue ngay (delay 0)', async () => {
    prisma.hunt.findUnique.mockResolvedValue({
      id: 'h1',
      userId: 'u1',
      status: 'HUNTING',
    });
    redis.setNx.mockResolvedValue(true);

    const result = await service.runNow('u1', 'h1');

    expect(result).toEqual({ enqueued: true });
    expect(queue.add).toHaveBeenCalledWith(
      'scan',
      { huntId: 'h1' },
      expect.objectContaining({ delay: 0 }),
    );
  });
});
