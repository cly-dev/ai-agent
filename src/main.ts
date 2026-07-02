import './core/env/load-env';
import { Logger, ValidationPipe } from '@nestjs/common';
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
  isDevStaticAssetsEnabled,
  isSwaggerEnabled,
} from './core/security/runtime-env.util';
import {
  CLIENT_PUBLIC_API_EXCLUDES,
} from './middleware/client-public-api-paths';
import {
  applyHttpCors,
  handleHttpCorsPreflight,
} from './middleware/client-public-cors.util';
import { readHttpServerEnabled } from './core/session-run/session-run-bullmq.connection.util';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.use((req: Request, res: Response, next) => {
    applyHttpCors(req, res);
    if (handleHttpCorsPreflight(req, res)) {
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
  if (isDevStaticAssetsEnabled()) {
    app.useStaticAssets(join(process.cwd(), 'www'));
    Logger.log('Dev static assets enabled at /index.html (www/)');
  }
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
    exclude: CLIENT_PUBLIC_API_EXCLUDES,
  });
  if (isSwaggerEnabled()) {
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
    Logger.log('Swagger docs available at http://localhost:3030/docs');
  }

  if (readHttpServerEnabled()) {
    await app.listen(3030);
    Logger.log('HTTP server listening on http://localhost:3030');
  } else {
    await app.init();
    Logger.log(
      'HTTP disabled (SESSION_RUN_HTTP_ENABLED=0); BullMQ worker / background only',
    );
  }
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
