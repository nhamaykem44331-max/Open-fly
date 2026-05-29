import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { decryptApp, encryptApp } from '../src/common/utils/app-crypto.util';
import { MuadiClientService } from '../src/integrations/muadi/muadi-client.service';
import { PrismaService } from '../src/prisma/prisma.service';

interface PoolEntry {
  label: string;
  agentCode: string;
  username: string;
  password: string;
}

async function bootstrap() {
  Logger.overrideLogger(['error', 'warn', 'log']);
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const config = app.get(ConfigService);
    const pool = parsePool(config.get<string>('MUADI_SESSION_POOL'));
    if (pool.length > 0) {
      // Pool đa-account: chỉ upsert bản ghi (passwordEnc), login lazy lúc acquire.
      await seedPool(app.get(PrismaService), pool);
    } else {
      // Back-compat: seed 1 session từ MUADI_AGENT_CODE/USERNAME/PASSWORD (login ngay).
      await seedSingle(config, app.get(MuadiClientService));
    }
  } catch (error) {
    console.error('MuadiSession seed failed');
    console.error(JSON.stringify(sanitize(error), null, 2));
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

function parsePool(raw: string | undefined): PoolEntry[] {
  if (!raw || raw.trim() === '') {
    return [];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('MUADI_SESSION_POOL không phải JSON hợp lệ');
  }
  if (!Array.isArray(parsed)) {
    throw new Error('MUADI_SESSION_POOL phải là JSON array');
  }

  return parsed.map((item, index) => {
    const entry = (item ?? {}) as Partial<PoolEntry>;
    if (
      !entry.label ||
      !entry.agentCode ||
      !entry.username ||
      !entry.password
    ) {
      throw new Error(
        `MUADI_SESSION_POOL phần tử #${index + 1} thiếu label/agentCode/username/password`,
      );
    }

    return {
      label: entry.label,
      agentCode: entry.agentCode,
      username: entry.username,
      password: entry.password,
    };
  });
}

async function seedPool(prisma: PrismaService, pool: PoolEntry[]): Promise<void> {
  for (const entry of pool) {
    await prisma.muadiSession.upsert({
      where: { label: entry.label },
      create: {
        label: entry.label,
        agentCode: entry.agentCode,
        username: entry.username,
        passwordEnc: encryptApp(entry.password),
        active: true,
        busy: false,
        failureCount: 0,
      },
      update: {
        agentCode: entry.agentCode,
        username: entry.username,
        passwordEnc: encryptApp(entry.password),
        active: true,
        busy: false,
        failureCount: 0,
      },
    });
  }

  console.log(
    `MuadiSession pool seeded: ${pool.length} session (login lazy khi acquire)`,
  );
}

async function seedSingle(
  config: ConfigService,
  muadiClient: MuadiClientService,
): Promise<void> {
  const agentCode = requireEnv(config, 'MUADI_AGENT_CODE');
  const username = requireEnv(config, 'MUADI_USERNAME');
  const password = requireEnv(config, 'MUADI_PASSWORD');

  const session = await muadiClient.login(agentCode, username, password);
  const accessToken = session.accessToken
    ? decryptApp(session.accessToken)
    : '';
  console.log(
    `MuadiSession created: id=${session.id}, token=${maskSecret(accessToken)}`,
  );
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
