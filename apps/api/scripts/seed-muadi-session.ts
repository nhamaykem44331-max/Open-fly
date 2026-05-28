import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { decryptApp } from '../src/common/utils/app-crypto.util';
import { MuadiClientService } from '../src/integrations/muadi/muadi-client.service';

async function bootstrap() {
  Logger.overrideLogger(['error', 'warn', 'log']);
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const config = app.get(ConfigService);
    const agentCode = requireEnv(config, 'MUADI_AGENT_CODE');
    const username = requireEnv(config, 'MUADI_USERNAME');
    const password = requireEnv(config, 'MUADI_PASSWORD');
    const muadiClient = app.get(MuadiClientService);

    const session = await muadiClient.login(agentCode, username, password);
    const accessToken = session.accessToken
      ? decryptApp(session.accessToken)
      : '';
    console.log(
      `MuadiSession created: id=${session.id}, token=${maskSecret(accessToken)}`,
    );
  } catch (error) {
    console.error('MuadiSession seed failed');
    console.error(JSON.stringify(sanitize(error), null, 2));
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

function requireEnv(config: ConfigService, key: string): string {
  const value = config.get<string>(key);
  if (!value || value.trim() === '') {
    throw new Error(`Thiếu env ${key}`);
  }

  return value;
}

function maskSecret(value: string): string {
  if (!value) {
    return '***';
  }

  return `***${value.slice(-4)}`;
}

function sanitize(value: unknown): unknown {
  if (value instanceof Error) {
    const details = value as Error & {
      status?: number;
      body?: unknown;
      response?: unknown;
      headers?: unknown;
    };
    return sanitize({
      name: value.name,
      message: value.message,
      status: details.status,
      body: details.body,
      response: details.response,
      headers: details.headers,
      stack: value.stack,
    });
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitize(item));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        shouldMaskKey(key) ? maskValue(item) : sanitize(item),
      ]),
    );
  }

  return value;
}

function shouldMaskKey(key: string): boolean {
  return /token|password|authorization|encrypted|secret|otp|tsp/i.test(key);
}

function maskValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return maskSecret(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => maskValue(item));
  }

  if (value && typeof value === 'object') {
    return '[REDACTED]';
  }

  return '[REDACTED]';
}

bootstrap().catch((error) => {
  console.error('MuadiSession seed crashed');
  console.error(JSON.stringify(sanitize(error), null, 2));
  process.exit(1);
});
