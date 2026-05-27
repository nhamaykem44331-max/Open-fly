import { Injectable, UnauthorizedException } from '@nestjs/common';
import {
  GoogleIdTokenPayload,
  IGoogleAuthService,
} from './google-auth-provider.interface';

@Injectable()
export class MockGoogleAuthService implements IGoogleAuthService {
  async verifyIdToken(idToken: string): Promise<GoogleIdTokenPayload> {
    if (idToken !== 'mock-valid-token') {
      throw new UnauthorizedException('Google token không hợp lệ');
    }

    return {
      sub: 'mock-google-sub-001',
      email: 'mock.user@example.com',
      email_verified: true,
      name: 'Mock Google User',
      picture: 'https://example.com/mock-google-user.png',
      aud: process.env.GOOGLE_CLIENT_ID ?? 'test-google-client-id',
      iss: 'https://accounts.google.com',
    };
  }
}
