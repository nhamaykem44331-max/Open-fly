import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import { MuadiSessionPoolService } from '../muadi-session-pool.service';

describe('MuadiSessionPoolService', () => {
  let prisma: {
    muadiSession: {
      findFirst: jest.Mock;
      updateMany: jest.Mock;
      update: jest.Mock;
      count: jest.Mock;
    };
  };
  let config: { get: jest.Mock };
  let pool: MuadiSessionPoolService;

  beforeEach(() => {
    prisma = {
      muadiSession: {
        findFirst: jest.fn(),
        updateMany: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
    };
    // get() trả undefined -> dùng default: reserved=1, maxFailures=3.
    config = { get: jest.fn().mockReturnValue(undefined) };
    pool = new MuadiSessionPoolService(
      prisma as unknown as PrismaService,
      config as unknown as ConfigService,
    );
  });

  it('acquireForHunter trả null khi số session rảnh <= reserved (chừa cho real-time)', async () => {
    prisma.muadiSession.count.mockResolvedValue(1); // reserved mặc định = 1

    const result = await pool.acquireForHunter();

    expect(result).toBeNull();
    expect(prisma.muadiSession.findFirst).not.toHaveBeenCalled();
    expect(prisma.muadiSession.updateMany).not.toHaveBeenCalled();
  });

  it('acquireForHunter khoá được session khi số rảnh > reserved', async () => {
    prisma.muadiSession.count.mockResolvedValue(2);
    prisma.muadiSession.findFirst.mockResolvedValue({ id: 's1' });
    prisma.muadiSession.updateMany.mockResolvedValue({ count: 1 });

    const result = await pool.acquireForHunter();

    expect(result).toEqual({ id: 's1' });
    expect(prisma.muadiSession.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 's1', active: true, busy: false },
        data: expect.objectContaining({ busy: true }),
      }),
    );
  });

  it('acquireForHunter trả null khi thua race lúc khoá (lock count !== 1)', async () => {
    prisma.muadiSession.count.mockResolvedValue(2);
    prisma.muadiSession.findFirst.mockResolvedValue({ id: 's1' });
    prisma.muadiSession.updateMany.mockResolvedValue({ count: 0 });

    const result = await pool.acquireForHunter();

    expect(result).toBeNull();
  });

  it('acquireForRealtime khoá được session ngay cả khi chỉ còn 1 session rảnh (real-time không đói)', async () => {
    prisma.muadiSession.findFirst.mockResolvedValue({ id: 's1' });
    prisma.muadiSession.updateMany.mockResolvedValue({ count: 1 });

    const result = await pool.acquireForRealtime();

    expect(result).toEqual({ id: 's1' });
    // Real-time KHÔNG kiểm tra headroom -> không gọi count.
    expect(prisma.muadiSession.count).not.toHaveBeenCalled();
  });

  it('acquireForRealtime throw khi hết session rảnh', async () => {
    prisma.muadiSession.findFirst.mockResolvedValue(null);

    await expect(pool.acquireForRealtime()).rejects.toThrow(
      'Muadi session chưa được cấu hình hoặc đang bận',
    );
  });

  it('release(.,false) tăng failureCount; chạm ngưỡng thì ngắt session (active=false)', async () => {
    prisma.muadiSession.update
      .mockResolvedValueOnce({ id: 's1', failureCount: 3, active: true })
      .mockResolvedValueOnce({ id: 's1', failureCount: 3, active: false });

    await pool.release('s1', false);

    expect(prisma.muadiSession.update).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: { id: 's1' },
        data: { busy: false, failureCount: { increment: 1 } },
      }),
    );
    expect(prisma.muadiSession.update).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: { id: 's1' },
        data: { active: false },
      }),
    );
  });

  it('release(.,false) chưa chạm ngưỡng thì KHÔNG ngắt session', async () => {
    prisma.muadiSession.update.mockResolvedValue({
      id: 's1',
      failureCount: 1,
      active: true,
    });

    await pool.release('s1', false);

    expect(prisma.muadiSession.update).toHaveBeenCalledTimes(1);
  });

  it('release(.,true) reset failureCount = 0', async () => {
    prisma.muadiSession.update.mockResolvedValue({ id: 's1', failureCount: 0 });

    await pool.release('s1', true);

    expect(prisma.muadiSession.update).toHaveBeenCalledTimes(1);
    expect(prisma.muadiSession.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 's1' },
        data: { busy: false, failureCount: 0 },
      }),
    );
  });
});
