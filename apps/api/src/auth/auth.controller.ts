import { Body, Controller, HttpCode, HttpStatus, Ip, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { OtpVerifyDto } from './dto/otp-verify.dto';
import { PhoneRequestDto } from './dto/phone-request.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('otp/request')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 600_000 } })
  async requestOtp(@Body() dto: PhoneRequestDto, @Ip() ip: string) {
    return this.authService.requestOtp(dto, ip);
  }

  @Public()
  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() dto: OtpVerifyDto) {
    return this.authService.verifyOtp(dto);
  }
}
