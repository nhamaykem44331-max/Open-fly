export const GOOGLE_AUTH_PROVIDER = Symbol('GOOGLE_AUTH_PROVIDER');

export interface GoogleIdTokenPayload {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
  aud: string;
  iss: string;
}

export interface IGoogleAuthService {
  verifyIdToken(idToken: string): Promise<GoogleIdTokenPayload>;
}
