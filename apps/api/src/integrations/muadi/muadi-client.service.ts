import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MuadiSession } from '@prisma/client';
import { randomBytes } from 'crypto';
import { decryptApp, encryptApp } from '../../common/utils/app-crypto.util';
import { PrismaService } from '../../prisma/prisma.service';
import { decodeJwtExpiry, encryptMuadi } from './muadi-crypto.util';

type MuadiApiVersion = '2' | '3' | null;

interface CachedSession {
  accessToken: string | null;
  refreshToken: string | null;
  serverDiff: number;
  expiresAt: Date | null;
}

interface MuadiRequestOptions {
  sessionId?: string;
  authenticated?: boolean;
  apiVersion?: MuadiApiVersion;
  timeoutMs?: number;
  retryOnHttpError?: boolean;
  retried?: boolean;
}

interface MuadiResponseEnvelope {
  success?: boolean;
  code?: string;
  message?: string;
  accessToken?: string;
  refreshToken?: string;
}

class MuadiHttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: unknown,
    readonly headers: Headers,
  ) {
    super(message);
  }
}

@Injectable()
export class MuadiClientService {
  private readonly logger = new Logger(MuadiClientService.name);
  private readonly sessionCache = new Map<string, CachedSession>();

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async login(
    agentCode: string,
    username: string,
    password: string,
  ): Promise<MuadiSession> {
    const response = await this.sendEncryptedRequest<MuadiResponseEnvelope>(
      '/auth/login',
      {
        UserName: username,
        Password: password,
        AgentCode: agentCode,
        // Otp = captcha client-side; Muadi chỉ cần non-empty và NGẮN (~3-4 ký tự).
        // Chuỗi dài (vd 16 hex) khiến server trả 500 code=99. Khớp format namthanh.
        Otp: randomBytes(3).toString('hex').slice(0, 4).toUpperCase(),
      },
      {
        authenticated: false,
        apiVersion: null,
      },
    );

    const accessToken = response.data.accessToken;
    const refreshToken = response.data.refreshToken;
    if (!accessToken || !refreshToken) {
      throw new Error('Muadi login did not return tokens');
    }

    const label = `muadi:${agentCode}:${username}`;
    const serverDiff = this.readServerDiff(response.headers) ?? 0;
    const session = await this.prisma.muadiSession.upsert({
      where: { label },
      create: {
        label,
        agentCode,
        username,
        passwordEnc: encryptApp(password),
        accessToken: encryptApp(accessToken),
        refreshToken: encryptApp(refreshToken),
        serverDiff,
        expiresAt: this.getExpiryDate(accessToken),
        lastUsedAt: new Date(),
        lastRefreshedAt: new Date(),
        failureCount: 0,
        active: true,
      },
      update: {
        agentCode,
        username,
        passwordEnc: encryptApp(password),
        accessToken: encryptApp(accessToken),
        refreshToken: encryptApp(refreshToken),
        serverDiff,
        expiresAt: this.getExpiryDate(accessToken),
        lastUsedAt: new Date(),
        lastRefreshedAt: new Date(),
        failureCount: 0,
        active: true,
      },
    });

    this.sessionCache.set(session.id, {
      accessToken,
      refreshToken,
      serverDiff,
      expiresAt: session.expiresAt,
    });
    this.logger.log(
      `Muadi login ok for configured session, token ${this.maskSecret(accessToken)}`,
    );

    return session;
  }

  async refreshTokens(sessionId: string): Promise<boolean> {
    const session = await this.loadSessionState(sessionId);
    if (!session.accessToken || !session.refreshToken) {
      return false;
    }

    const variants = [
      {
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        channel: 'Web',
      },
      { refreshToken: session.refreshToken },
      { token: session.refreshToken },
      { refresh_token: session.refreshToken },
    ];

    for (const variant of variants) {
      try {
        const response = await this.sendEncryptedRequest<MuadiResponseEnvelope>(
          '/auth/refresh-token',
          variant,
          {
            sessionId,
            authenticated: true,
            apiVersion: '2',
          },
        );
        if (response.data.accessToken && response.data.refreshToken) {
          await this.updateStoredTokens(
            sessionId,
            response.data.accessToken,
            response.data.refreshToken,
            this.readServerDiff(response.headers),
          );
          this.logger.log(
            `Muadi refresh ok for session ${sessionId}, token ${this.maskSecret(response.data.accessToken)}`,
          );
          return true;
        }
      } catch (error) {
        this.logger.warn(
          `Muadi refresh variant failed for session ${sessionId}: ${this.safeError(error)}`,
        );
      }
    }

    await this.prisma.muadiSession.update({
      where: { id: sessionId },
      data: {
        failureCount: {
          increment: 1,
        },
      },
    });
    return false;
  }

  async ensureValidSession(sessionId: string): Promise<MuadiSession> {
    const record = await this.prisma.muadiSession.findUniqueOrThrow({
      where: { id: sessionId },
    });
    const state = await this.loadSessionState(sessionId, record);

    if (state.accessToken && this.isAccessTokenFresh(state.accessToken)) {
      return record;
    }

    if (state.refreshToken && (await this.refreshTokens(sessionId))) {
      return this.prisma.muadiSession.findUniqueOrThrow({
        where: { id: sessionId },
      });
    }

    return this.login(
      record.agentCode,
      record.username,
      decryptApp(record.passwordEnc),
    );
  }

  async request<T>(
    path: string,
    body: unknown,
    options: MuadiRequestOptions = {},
  ): Promise<T> {
    const maxAttempts = this.getNumberConfig('MUADI_RETRY_MAX_ATTEMPTS', 3);
    let attempt = 0;

    while (true) {
      attempt += 1;
      try {
        const response = await this.sendEncryptedRequest<
          T & MuadiResponseEnvelope
        >(path, body, options);
        if (
          this.isTokenResponse(response.data) &&
          options.sessionId &&
          !options.retried
        ) {
          const refreshed = await this.refreshTokens(options.sessionId);
          if (refreshed) {
            return this.request<T>(path, body, { ...options, retried: true });
          }
        }

        return response.data as T;
      } catch (error) {
        if (
          error instanceof MuadiHttpError &&
          this.shouldRefreshAfterHttp(error) &&
          options.sessionId &&
          !options.retried
        ) {
          const refreshed = await this.refreshTokens(options.sessionId);
          if (refreshed) {
            return this.request<T>(path, body, { ...options, retried: true });
          }
        }

        if (attempt >= maxAttempts || !this.isRetryable(error, options, path)) {
          throw error;
        }

        await this.delay(this.getBackoffDelay(error, attempt));
      }
    }
  }

  async searchFlightByAirline<T>(
    sessionId: string,
    airline: string,
    body: unknown,
  ): Promise<T> {
    await this.ensureValidSession(sessionId);
    return this.request<T>(`/booking/search-flight/${airline}`, body, {
      sessionId,
      authenticated: true,
      apiVersion: '2',
    });
  }

  async searchLowestFare<T>(
    sessionId: string,
    params: { origin: string; destination: string; currencyCode: string },
  ): Promise<T> {
    await this.ensureValidSession(sessionId);
    return this.request<T>('/booking/search-lowest-fare', params, {
      sessionId,
      authenticated: true,
      apiVersion: '2',
    });
  }

  private async sendEncryptedRequest<T>(
    path: string,
    body: unknown,
    options: MuadiRequestOptions,
  ): Promise<{ data: T; headers: Headers }> {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      options.timeoutMs ??
        this.getNumberConfig('MUADI_SEARCH_TIMEOUT_MS', 120000),
    );

    try {
      const response = await fetch(this.buildUrl(path), {
        method: 'POST',
        headers: await this.buildHeaders(options),
        body: JSON.stringify({
          encrypted: encryptMuadi(JSON.stringify(body)),
        }),
        signal: controller.signal,
      });
      if (options.sessionId) {
        await this.syncServerDiff(options.sessionId, response.headers);
      }

      const data = await this.parseJson<T>(response);
      if (!response.ok) {
        throw new MuadiHttpError(
          `Muadi HTTP ${response.status}`,
          response.status,
          data,
          response.headers,
        );
      }

      return { data, headers: response.headers };
    } finally {
      clearTimeout(timeout);
    }
  }

  private async buildHeaders(
    options: MuadiRequestOptions,
  ): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Client-Type': 'Web',
      'X-Language': 'vi',
      Origin: 'https://booking.namthanh.vn',
      Referer: 'https://booking.namthanh.vn/',
      'Content-Type': 'application/json',
    };

    if (options.apiVersion !== null) {
      headers['X-Api-Version'] = options.apiVersion ?? '2';
    }

    let serverDiff = 0;
    if (options.authenticated) {
      if (!options.sessionId) {
        throw new Error('Muadi authenticated request requires sessionId');
      }
      const session = await this.loadSessionState(options.sessionId);
      if (!session.accessToken) {
        throw new Error('Muadi session access token is missing');
      }
      headers.authorization = session.accessToken;
      serverDiff = session.serverDiff;
    }

    // tsp is required by Muadi gateway for every request, including login.
    headers.tsp = encryptMuadi(
      String(Math.floor(Date.now() / 1000) + serverDiff),
    );

    return headers;
  }

  private async loadSessionState(
    sessionId: string,
    record?: MuadiSession,
  ): Promise<CachedSession> {
    const cached = this.sessionCache.get(sessionId);
    if (cached) {
      return cached;
    }

    const session =
      record ??
      (await this.prisma.muadiSession.findUniqueOrThrow({
        where: { id: sessionId },
      }));
    const state = {
      accessToken: session.accessToken ? decryptApp(session.accessToken) : null,
      refreshToken: session.refreshToken
        ? decryptApp(session.refreshToken)
        : null,
      serverDiff: session.serverDiff,
      expiresAt: session.expiresAt,
    };
    this.sessionCache.set(sessionId, state);

    return state;
  }

  private async updateStoredTokens(
    sessionId: string,
    accessToken: string,
    refreshToken: string,
    serverDiff: number | null,
  ): Promise<void> {
    const data = {
      accessToken: encryptApp(accessToken),
      refreshToken: encryptApp(refreshToken),
      expiresAt: this.getExpiryDate(accessToken),
      lastRefreshedAt: new Date(),
      lastUsedAt: new Date(),
      ...(serverDiff === null ? {} : { serverDiff }),
    };
    const session = await this.prisma.muadiSession.update({
      where: { id: sessionId },
      data,
    });
    this.sessionCache.set(sessionId, {
      accessToken,
      refreshToken,
      serverDiff: session.serverDiff,
      expiresAt: session.expiresAt,
    });
  }

  private async syncServerDiff(
    sessionId: string,
    headers: Headers,
  ): Promise<void> {
    const serverDiff = this.readServerDiff(headers);
    if (serverDiff === null) {
      return;
    }

    await this.prisma.muadiSession.update({
      where: { id: sessionId },
      data: {
        serverDiff,
        lastUsedAt: new Date(),
      },
    });
    const cached = this.sessionCache.get(sessionId);
    if (cached) {
      cached.serverDiff = serverDiff;
    }
  }

  private readServerDiff(headers: Headers): number | null {
    const serverEpoch = Number(headers.get('time'));
    if (!Number.isFinite(serverEpoch)) {
      return null;
    }

    return serverEpoch - Math.floor(Date.now() / 1000);
  }

  private getExpiryDate(token: string): Date | null {
    const exp = decodeJwtExpiry(token);
    return exp > 0 ? new Date(exp * 1000) : null;
  }

  private isAccessTokenFresh(token: string): boolean {
    const exp = decodeJwtExpiry(token);
    return exp > Math.floor(Date.now() / 1000) + 60;
  }

  private buildUrl(path: string): string {
    const baseUrl =
      this.config.get<string>('MUADI_BASE_URL') ??
      'https://api-gateway.muadi.com.vn/api';
    return `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
  }

  private async parseJson<T>(response: Response): Promise<T> {
    const text = await response.text();
    if (!text) {
      return {} as T;
    }

    return JSON.parse(text) as T;
  }

  private shouldRefreshAfterHttp(error: MuadiHttpError): boolean {
    return error.status === 401 || this.isTokenResponse(error.body);
  }

  private isTokenResponse(body: unknown): boolean {
    if (!body || typeof body !== 'object') {
      return false;
    }

    const response = body as MuadiResponseEnvelope;
    return (
      response.success === false &&
      (response.code === '12' ||
        response.code === '18' ||
        /token/i.test(response.message ?? ''))
    );
  }

  private isRetryable(
    error: unknown,
    options: MuadiRequestOptions,
    path: string,
  ): boolean {
    if (error instanceof MuadiHttpError) {
      if (options.retryOnHttpError === false) {
        return false;
      }

      if (this.isNonIdempotentBookingPath(path)) {
        return false;
      }

      return (
        error.status === 429 || error.status === 503 || error.status >= 500
      );
    }

    return true;
  }

  private isNonIdempotentBookingPath(path: string): boolean {
    return /create-booking|create-session/.test(path);
  }

  private getBackoffDelay(error: unknown, attempt: number): number {
    if (error instanceof MuadiHttpError) {
      const retryAfter = error.headers.get('retry-after');
      const retryAfterMs = this.parseRetryAfterMs(retryAfter);
      if (retryAfterMs !== null) {
        return retryAfterMs;
      }
    }

    const baseDelay = this.getNumberConfig('MUADI_RETRY_BASE_DELAY_MS', 500);
    const maxDelay = this.getNumberConfig('MUADI_RETRY_MAX_DELAY_MS', 5000);
    const jitter = Math.floor(Math.random() * baseDelay);

    return Math.min(maxDelay, baseDelay * 2 ** (attempt - 1) + jitter);
  }

  private parseRetryAfterMs(retryAfter: string | null): number | null {
    if (!retryAfter) {
      return null;
    }

    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds)) {
      return seconds * 1000;
    }

    const dateMs = Date.parse(retryAfter);
    if (Number.isNaN(dateMs)) {
      return null;
    }

    return Math.max(0, dateMs - Date.now());
  }

  private async delay(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  private getNumberConfig(key: string, fallback: number): number {
    const value = Number(this.config.get<string>(key));
    return Number.isFinite(value) && value > 0 ? value : fallback;
  }

  private maskSecret(value: string): string {
    return `***${value.slice(-4)}`;
  }

  private safeError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return String(error);
  }
}
