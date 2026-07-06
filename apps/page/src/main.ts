import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { OMNIX_SERVICES } from '@omnix/protocol';
import { AppModule } from './app.module';

async function bootstrap() {
  const service = OMNIX_SERVICES.page;
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.PORT ?? service.port);
  await app.listen(port);
  Logger.log(`${service.name} listening on http://localhost:${port}`, 'Bootstrap');
}

bootstrap();
