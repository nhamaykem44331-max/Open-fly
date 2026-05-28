import { ConfigService } from '@nestjs/config';
import { MuadiSession } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  buildBookingProtectionVerify,
  MuadiClientService,
} from '../muadi-client.service';

type SessionFreshProbe = {
  isSessionFresh(
    state: {
      accessToken: string | null;
      refreshToken: string | null;
      serverDiff: number;
      expiresAt: Date | null;
    },
    record: MuadiSession,
  ): boolean;
};

describe('MuadiClientService token freshness', () => {
  it('treats recent opaque tokens as fresh within the assumed TTL', () => {
    const service = createService();
    const record = createSession({
      lastRefreshedAt: minutesAgo(5),
      lastUsedAt: minutesAgo(5),
    });

    expect(
      service.isSessionFresh(
        {
          accessToken: 'opaque-access-token',
          refreshToken: 'opaque-refresh-token',
          serverDiff: 0,
          expiresAt: null,
        },
        record,
      ),
    ).toBe(true);
  });

  it('treats old opaque tokens as stale after the assumed TTL', () => {
    const service = createService('25');
    const record = createSession({
      lastRefreshedAt: minutesAgo(30),
      lastUsedAt: minutesAgo(30),
    });

    expect(
      service.isSessionFresh(
        {
          accessToken: 'opaque-access-token',
          refreshToken: 'opaque-refresh-token',
          serverDiff: 0,
          expiresAt: null,
        },
        record,
      ),
    ).toBe(false);
  });

  it('uses JWT exp when Muadi returns a JWT-shaped token', () => {
    const service = createService();
    const record = createSession({
      lastRefreshedAt: minutesAgo(60),
      lastUsedAt: minutesAgo(60),
    });

    expect(
      service.isSessionFresh(
        {
          accessToken: buildJwtWithExp(Math.floor(Date.now() / 1000) + 600),
          refreshToken: 'opaque-refresh-token',
          serverDiff: 0,
          expiresAt: null,
        },
        record,
      ),
    ).toBe(true);
  });
});

describe('Muadi booking protection', () => {
  it('builds uppercase MD5 verify from salt, otp, and username', () => {
    expect(buildBookingProtectionVerify('SALT', 'ABCD', 'HTXTP01')).toEqual({
      otp: 'ABCD',
      verify: 'E620F9C63FD3FF0C0FB639B51503CA40',
    });
  });
});

function createService(ttlMinutes?: string): SessionFreshProbe {
  const config = {
    get: jest.fn((key: string) =>
      key === 'MUADI_SESSION_ASSUMED_TTL_MINUTES' ? ttlMinutes : undefined,
    ),
  };

  return new MuadiClientService(
    config as unknown as ConfigService,
    {} as PrismaService,
  ) as unknown as SessionFreshProbe;
}

function createSession(overrides: Partial<MuadiSession>): MuadiSession {
  const now = new Date();

  return {
    id: 'muadi-session-id',
    label: 'muadi:test',
    agentCode: 'AGENT',
    username: 'username',
    passwordEnc: 'encrypted-password',
    accessToken: 'encrypted-access-token',
    refreshToken: 'encrypted-refresh-token',
    serverDiff: 0,
    expiresAt: null,
    busy: false,
    lastUsedAt: now,
    lastRefreshedAt: now,
    failureCount: 0,
    active: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function minutesAgo(minutes: number): Date {
  return new Date(Date.now() - minutes * 60_000);
}

function buildJwtWithExp(exp: number): string {
  const header = Buffer.from(JSON.stringify({ alg: 'none' })).toString(
    'base64url',
  );
  const payload = Buffer.from(JSON.stringify({ exp })).toString('base64url');

  return `${header}.${payload}.`;
}
