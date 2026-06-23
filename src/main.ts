import './core/env/load-env';
import { Logger, RequestMethod, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { join } from 'path';
import { AppModule } from './app.module';
import { ReqInterceptor } from './interceptor/req.interceptor';
import { HttpExceptionFilter } from './exception/http.exception';
import { PrismaService } from './prisma/prisma.service';
import {
  applyClientPublicCors,
  handleClientPublicCorsPreflight,
  shouldApplyClientPublicCors,
} from './middleware/client-public-cors.util';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.use((req: Request, res: Response, next) => {
    if (!shouldApplyClientPublicCors(req)) {
      next();
      return;
    }
    applyClientPublicCors(req, res);
    if (handleClientPublicCorsPreflight(req, res)) {
      return;
    }
    next();
  });
  const prisma = app.get(PrismaService);
  try {
    await prisma.$connect();
  } catch (error) {
    Logger.error(
      'Database connection failed. Please check DATABASE_URL.',
      error,
    );
    throw error;
  }
  app.useStaticAssets(join(process.cwd(), 'www'));
  app.useGlobalInterceptors(new ReqInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.setGlobalPrefix('admin', {
    exclude: [
      { path: 'chat', method: RequestMethod.ALL },
      { path: 'user/login', method: RequestMethod.POST },
      { path: 'user/password-reminder', method: RequestMethod.GET },
      { path: 'chat/(.*)', method: RequestMethod.ALL },
      { path: 'app-client/auth', method: RequestMethod.POST },
      { path: 'agent/client/available', method: RequestMethod.GET },
      { path: 'agent/:agentId/skills/client', method: RequestMethod.GET},
      { path: 'host-tool/client/catalog', method: RequestMethod.GET },
      { path: 'host-tool/client/register', method: RequestMethod.POST },
    ],
  });
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Agent Server API')
    .setDescription('API docs for Agent Server')
    .setVersion('1.0.0')
    .addBearerAuth()
    .addApiKey(
      {
        type: 'apiKey',
        in: 'header',
        name: 'X-App-Dsn',
        description:
          'AppClient DSN，用于解析接入方（须与库中 AppClient.dsn 一致）',
      },
      'app-dsn',
    )
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  await app.listen(3030);
  Logger.log('Swagger docs available at http://localhost:3030/docs');
}

function registerProcessErrorHandlers(): void {
  process.on('uncaughtException', (error: Error) => {
    Logger.error('Uncaught exception', error.stack ?? error.message);
  });
  process.on('unhandledRejection', (reason: unknown) => {
    if (reason instanceof Error) {
      Logger.error(
        'Unhandled promise rejection',
        reason.stack ?? reason.message,
      );
      return;
    }
    Logger.error('Unhandled promise rejection', String(reason));
  });
}

registerProcessErrorHandlers();
bootstrap().catch((error: unknown) => {
  if (error instanceof Error) {
    Logger.error('Application bootstrap failed', error.stack ?? error.message);
  } else {
    Logger.error('Application bootstrap failed', String(error));
  }
  process.exit(1);
});
