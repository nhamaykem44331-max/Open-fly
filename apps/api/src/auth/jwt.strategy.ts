// Port from apg-manager/apps/api/src/auth/strategies/jwt.strategy.ts
import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserPublicDto } from '../common/dto/user-public.dto';
import { PrismaService } from '../prisma/prisma.service';

interface JwtPayload {
  sub: string;
  phone?: string;
  role: string;
  tier: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secret = config.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is required');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('Tài khoản không tồn tại');
    }

    if (!user.active) {
      throw new ForbiddenException('Tài khoản đã bị vô hiệu hóa');
    }

    if (user.blocked) {
      throw new ForbiddenException(
        `Tài khoản đã bị khóa: ${user.blockReason ?? 'vi phạm điều khoản'}`,
      );
    }

    return UserPublicDto.fromPrisma(user);
  }
}
