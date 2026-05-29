import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MuadiSession } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Quản lý pool session Muadi đa-account: cấp phát, nhả, và circuit breaker per-session.
 *
 * Hai cơ chế acquire tách biệt cố ý:
 * - acquireForRealtime: cho search/booking của khách — KHÔNG bị giới hạn headroom,
 *   lấy được cả session cuối nên real-time không bao giờ bị đói.
 * - acquireForHunter: cho job quét giá nền — "soft reservation", luôn chừa
 *   >= HUNTER_RESERVED_REALTIME session rảnh cho real-time; hết headroom thì
 *   trả null (không throw) để caller requeue.
 */
@Injectable()
export class MuadiSessionPoolService {
  private readonly logger = new Logger(MuadiSessionPoolService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Cấp session cho request real-time. Chọn session active + rảnh, ưu tiên
   * session lâu chưa dùng nhất (lastUsedAt asc), khoá atomic. Throw nếu hết.
   */
  async acquireForRealtime(): Promise<MuadiSession> {
    const session = await this.findFreeSession();
    if (!session) {
      throw new Error('Muadi session chưa được cấu hình hoặc đang bận');
    }

    const locked = await this.lock(session.id);
    if (!locked) {
      throw new Error('Muadi session vừa được dùng bởi request khác');
    }

    return session;
  }

  /**
   * Cấp session cho Hunter. Chỉ khoá nếu số session rảnh > reserved (luôn chừa
   * chỗ cho real-time). Trả null nếu không còn headroom hoặc thua race khi khoá.
   */
  async acquireForHunter(): Promise<MuadiSession | null> {
    const reserved = this.getReservedRealtime();
    const free = await this.prisma.muadiSession.count({
      where: { active: true, busy: false },
    });
    if (free <= reserved) {
      return null;
    }

    const session = await this.findFreeSession();
    if (!session) {
      return null;
    }

    const locked = await this.lock(session.id);
    if (!locked) {
      return null;
    }

    return session;
  }

  /**
   * Nhả session sau khi dùng xong. success=true reset failureCount;
   * success=false tăng failureCount và tự ngắt session (active=false) khi
   * chạm MUADI_SESSION_MAX_FAILURES — circuit breaker per-session.
   */
  async release(sessionId: string, success: boolean): Promise<void> {
    if (success) {
      await this.prisma.muadiSession.update({
        where: { id: sessionId },
        data: { busy: false, failureCount: 0 },
      });
      return;
    }

    const updated = await this.prisma.muadiSession.update({
      where: { id: sessionId },
      data: { busy: false, failureCount: { increment: 1 } },
    });

    if (updated.failureCount >= this.getMaxFailures()) {
      await this.prisma.muadiSession.update({
        where: { id: sessionId },
        data: { active: false },
      });
      this.logger.warn(
        `Muadi session ${sessionId} bị ngắt tự động sau ${updated.failureCount} lần lỗi liên tiếp — cần kiểm tra tài khoản đại lý`,
      );
    }
  }

  /**
   * Tự kích hoạt lại (half-open) các session đã bị circuit breaker ngắt
   * sau khi quá cooldown, để pool tự hồi phục mà không cần can thiệp tay.
   *
   * Dựa vào updatedAt làm mốc "thời điểm bị ngắt": session đã ngắt không bị
   * update nào khác chạm tới (acquire lọc active:true, release chỉ chạm session
   * đang giữ) nên updatedAt giữ nguyên cho tới lần reactivate này. KHÔNG đụng
   * busy/token — ensureValidSession sẽ login lại lazy ở lần acquire kế tiếp.
   */
  async reactivateStale(): Promise<number> {
    const cutoff = new Date(
      Date.now() - this.getReactivateCooldownMinutes() * 60_000,
    );
    const result = await this.prisma.muadiSession.updateMany({
      where: {
        active: false,
        updatedAt: { lte: cutoff },
      },
      data: {
        active: true,
        failureCount: 0,
      },
    });

    if (result.count > 0) {
      this.logger.log(
        `Reactivate ${result.count} Muadi session sau cooldown để thử lại`,
      );
    }

    return result.count;
  }

  private findFreeSession(): Promise<MuadiSession | null> {
    return this.prisma.muadiSession.findFirst({
      where: { active: true, busy: false },
      orderBy: { lastUsedAt: 'asc' },
    });
  }

  private async lock(sessionId: string): Promise<boolean> {
    const lock = await this.prisma.muadiSession.updateMany({
      where: { id: sessionId, active: true, busy: false },
      data: { busy: true, lastUsedAt: new Date() },
    });

    return lock.count === 1;
  }

  private getReservedRealtime(): number {
    const value = Number(this.config.get<string>('HUNTER_RESERVED_REALTIME'));
    return Number.isInteger(value) && value >= 0 ? value : 1;
  }

  private getMaxFailures(): number {
    const value = Number(this.config.get<string>('MUADI_SESSION_MAX_FAILURES'));
    return Number.isInteger(value) && value >= 1 ? value : 3;
  }

  private getReactivateCooldownMinutes(): number {
    const value = Number(
      this.config.get<string>('MUADI_SESSION_REACTIVATE_COOLDOWN_MINUTES'),
    );
    return Number.isInteger(value) && value >= 1 ? value : 10;
  }
}
