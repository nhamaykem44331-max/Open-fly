import { Body, Controller, HttpCode, Post, Req } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import {
  extractClientIp,
  isIpAllowed,
  SepayWebhookPayload,
  verifyAuth,
} from '../integrations/sepay/sepay.provider';
import { SepayService } from './sepay.service';

@Controller('webhooks/sepay')
export class SepayWebhookController {
  constructor(private readonly sepayService: SepayService) {}

  @Public()
  @Post()
  @HttpCode(200)
  async handleWebhook(
    @Body() payload: SepayWebhookPayload,
    @Req() req: { headers: Record<string, string | string[] | undefined> },
  ) {
    const ip = extractClientIp(req.headers);
    if (!isIpAllowed(ip)) {
      return {
        status: 'REJECTED',
        reason: 'IP_NOT_ALLOWED',
      };
    }
    if (!verifyAuth(req.headers)) {
      return {
        status: 'REJECTED',
        reason: 'AUTH_FAILED',
      };
    }

    return this.sepayService.handleWebhook(payload);
  }
}
