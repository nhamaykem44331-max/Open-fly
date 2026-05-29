import { Logger } from '@nestjs/common';
import { MuadiSessionMaintenanceCron } from '../muadi-session-maintenance.cron';
import { MuadiSessionPoolService } from '../muadi-session-pool.service';

describe('MuadiSessionMaintenanceCron', () => {
  it('gọi reactivateStale mỗi lần chạy', async () => {
    const sessionPool = { reactivateStale: jest.fn().mockResolvedValue(2) };
    const cron = new MuadiSessionMaintenanceCron(
      sessionPool as unknown as MuadiSessionPoolService,
    );

    await cron.reactivateStaleSessions();

    expect(sessionPool.reactivateStale).toHaveBeenCalledTimes(1);
  });

  it('nuốt lỗi, không throw ra ngoài (cron không crash)', async () => {
    const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    const sessionPool = {
      reactivateStale: jest.fn().mockRejectedValue(new Error('db down')),
    };
    const cron = new MuadiSessionMaintenanceCron(
      sessionPool as unknown as MuadiSessionPoolService,
    );

    await expect(cron.reactivateStaleSessions()).resolves.toBeUndefined();
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
