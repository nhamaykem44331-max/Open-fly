import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { MembershipTier, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { VoucherActor, VoucherService } from '../voucher.service';

const STANDARD: VoucherActor = { id: 'u1', tier: MembershipTier.STANDARD };

function tpl(overrides: Record<string, unknown> = {}) {
  const now = Date.now();
  return {
    id: 't1',
    code: 'OPENFLY150',
    active: true,
    type: 'AMOUNT',
    value: 150_000,
    validFrom: new Date(now - 86_400_000),
    validUntil: new Date(now + 86_400_000),
    tierFilter: [] as MembershipTier[],
    totalQuantity: null as number | null,
    ...overrides,
  };
}

describe('VoucherService.claim', () => {
  let prisma: {
    voucherTemplate: { findUnique: jest.Mock; findMany: jest.Mock };
    userVoucher: { findMany: jest.Mock; count: jest.Mock; create: jest.Mock };
  };
  let service: VoucherService;

  beforeEach(() => {
    prisma = {
      voucherTemplate: { findUnique: jest.fn(), findMany: jest.fn() },
      userVoucher: {
        findMany: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockResolvedValue({ id: 'uv1' }),
      },
    };
    service = new VoucherService(prisma as unknown as PrismaService);
  });

  it('mã không tồn tại/không active -> NotFound', async () => {
    prisma.voucherTemplate.findUnique.mockResolvedValue(null);
    await expect(service.claim(STANDARD, 'X')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('hết hạn -> Conflict', async () => {
    prisma.voucherTemplate.findUnique.mockResolvedValue(
      tpl({ validUntil: new Date(Date.now() - 1000) }),
    );
    await expect(service.claim(STANDARD, 'X')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('không đủ tier -> Forbidden', async () => {
    prisma.voucherTemplate.findUnique.mockResolvedValue(
      tpl({ tierFilter: [MembershipTier.PREMIUM, MembershipTier.AGENT] }),
    );
    await expect(service.claim(STANDARD, 'X')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('hết lượt (totalQuantity) -> Conflict', async () => {
    prisma.voucherTemplate.findUnique.mockResolvedValue(
      tpl({ totalQuantity: 5 }),
    );
    prisma.userVoucher.count.mockResolvedValue(5);
    await expect(service.claim(STANDARD, 'X')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('hợp lệ -> tạo UserVoucher ACTIVE', async () => {
    prisma.voucherTemplate.findUnique.mockResolvedValue(tpl());
    const result = await service.claim(STANDARD, 'openfly150');
    expect(prisma.userVoucher.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { userId: 'u1', templateId: 't1', status: 'ACTIVE' },
      }),
    );
    expect(result).toEqual({ id: 'uv1' });
  });

  it('đã nhận rồi (P2002) -> Conflict', async () => {
    prisma.voucherTemplate.findUnique.mockResolvedValue(tpl());
    prisma.userVoucher.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('dup', {
        code: 'P2002',
        clientVersion: '5.22.0',
      }),
    );
    await expect(service.claim(STANDARD, 'X')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('list: available loại voucher đã sở hữu / sai tier / hết lượt', async () => {
    prisma.userVoucher.findMany.mockResolvedValue([
      { templateId: 'owned', createdAt: new Date(), template: {} },
    ]);
    prisma.voucherTemplate.findMany.mockResolvedValue([
      { ...tpl({ id: 'owned' }), _count: { userVouchers: 0 } },
      { ...tpl({ id: 'ok' }), _count: { userVouchers: 0 } },
      {
        ...tpl({ id: 'wrongtier', tierFilter: [MembershipTier.AGENT] }),
        _count: { userVouchers: 0 },
      },
      {
        ...tpl({ id: 'full', totalQuantity: 2 }),
        _count: { userVouchers: 2 },
      },
    ]);

    const result = await service.list(STANDARD);
    const ids = result.available.map((t) => t.id);
    expect(ids).toEqual(['ok']);
  });
});
