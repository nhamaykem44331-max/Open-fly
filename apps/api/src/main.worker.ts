import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  app.enableShutdownHooks();

  new Logger('OpenFlyWorker').log(
    `Hunter worker started (RUN_WORKERS=${process.env.RUN_WORKERS ?? 'true'})`,
  );
}

bootstrap();
