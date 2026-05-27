import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import {
  GoogleIdTokenPayload,
  IGoogleAuthService,
} from './google-auth-provider.interface';

const VALID_GOOGLE_ISSUERS = ['accounts.google.com', 'https://accounts.google.com'];

@Injectable()
export class GoogleAuthService implements IGoogleAuthService {
  private readonly client = new OAuth2Client();

  constructor(private readonly config: ConfigService) {}

  async verifyIdToken(idToken: string): Promise<GoogleIdTokenPayload> {
    const googleClientId = this.config.get<string>('GOOGLE_CLIENT_ID');
    if (!googleClientId) {
      throw new Error('GOOGLE_CLIENT_ID is required');
    }

    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: googleClientId,
      });
      const payload = ticket.getPayload();

      if (!payload?.sub || !payload.email || !payload.aud || !payload.iss) {
        throw new UnauthorizedException('Google token không hợp lệ');
      }

      if (payload.aud !== googleClientId) {
        throw new UnauthorizedException('Google token không hợp lệ');
      }

      if (!VALID_GOOGLE_ISSUERS.includes(payload.iss)) {
        throw new UnauthorizedException('Google token không hợp lệ');
      }

      if (payload.email_verified !== true) {
        throw new UnauthorizedException('Email Google chưa được xác minh');
      }

      return {
        sub: payload.sub,
        email: payload.email,
        email_verified: payload.email_verified,
        name: payload.name,
        picture: payload.picture,
        aud: payload.aud,
        iss: payload.iss,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Google token không hợp lệ');
    }
  }
}
