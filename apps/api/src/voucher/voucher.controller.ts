import { Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserPublicDto } from '../common/dto/user-public.dto';
import { VoucherService } from './voucher.service';

@Controller('vouchers')
export class VoucherController {
  constructor(private readonly voucherService: VoucherService) {}

  @Get()
  list(@CurrentUser() user: UserPublicDto) {
    return this.voucherService.list({ id: user.id, tier: user.tier });
  }

  @Post(':code/claim')
  @HttpCode(200)
  claim(@Param('code') code: string, @CurrentUser() user: UserPublicDto) {
    return this.voucherService.claim({ id: user.id, tier: user.tier }, code);
  }
}
