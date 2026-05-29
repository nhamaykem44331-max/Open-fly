import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Gửi tin nhắn Telegram qua Bot API. Có timeout (AbortController) theo CLAUDE.md 5.7.
 * Nếu thiếu TELEGRAM_BOT_TOKEN -> bỏ qua (log) để dev/test không phụ thuộc mạng.
 */
@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly timeoutMs = 5000;

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(this.config.get<string>('TELEGRAM_BOT_TOKEN'));
  }

  async sendMessage(chatId: string, text: string): Promise<boolean> {
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token) {
      this.logger.warn('TELEGRAM_BOT_TOKEN chưa cấu hình — bỏ qua gửi Telegram');
      return false;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await fetch(
        `https://api.telegram.org/bot${token}/sendMessage`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text,
            parse_mode: 'HTML',
            disable_web_page_preview: true,
          }),
          signal: controller.signal,
        },
      );
      if (!response.ok) {
        this.logger.warn(`Telegram gửi thất bại HTTP ${response.status}`);
        return false;
      }

      return true;
    } catch (error) {
      this.logger.warn(
        `Telegram gửi lỗi: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    } finally {
      clearTimeout(timer);
    }
  }
}
