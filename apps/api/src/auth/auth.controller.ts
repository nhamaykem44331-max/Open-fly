import { Body, Controller, Headers, HttpCode, HttpStatus, Ip, Post } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { GoogleSignInDto } from './dto/google-signin.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Phone OTP disabled per Task 6 decision; service code retained for future.

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

  @Public()
  @Post('google')
  @HttpCode(HttpStatus.OK)
  async googleSignIn(
    @Body() dto: GoogleSignInDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.authService.googleSignIn(dto, ip, userAgent);
  }
}
