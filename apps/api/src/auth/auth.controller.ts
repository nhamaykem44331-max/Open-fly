import { Body, Controller, Headers, HttpCode, HttpStatus, Ip, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { OtpVerifyDto } from './dto/otp-verify.dto';
import { PhoneRequestDto } from './dto/phone-request.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { VoiceOtpDto } from './dto/voice-otp.dto';

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
  async verifyOtp(
    @Body() dto: OtpVerifyDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.authService.verifyOtp(dto, ip, userAgent);
  }

  @Public()
  @Post('otp/voice')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 2, ttl: 600_000 } })
  async requestVoiceOtp(@Body() dto: VoiceOtpDto, @Ip() ip: string) {
    return this.authService.requestVoiceOtp(dto, ip);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.authService.refresh(dto, ip, userAgent);
  }
}
