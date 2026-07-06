import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { join } from 'path';
import { AppModule } from '../app.module';
import { ReqInterceptor } from '../interceptor/req.interceptor';
import { HttpExceptionFilter } from '../exception/http.exception';
import { PrismaService } from '../prisma/prisma.service';
import {
  isDevStaticAssetsEnabled,
  isSwaggerEnabled,
} from '../core/security/runtime-env.util';
import {
  logStartupInfo,
  resolveNestBootstrapLogger,
} from '../core/security/nest-bootstrap.util';
import { CLIENT_PUBLIC_API_EXCLUDES } from '../middleware/client-public-api-paths';
import {
  applyHttpCors,
  handleHttpCorsPreflight,
} from '../middleware/client-public-cors.util';

export async function createNestApp(): Promise<NestExpressApplication> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: resolveNestBootstrapLogger(),
    bufferLogs: true,
  });
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
    logStartupInfo('Dev static assets enabled at /index.html (www/)');
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
    logStartupInfo('Swagger docs available at http://localhost:3030/docs');
  }
  return app;
}

export async function listenRuntimeHttp(
  app: NestExpressApplication,
  port = 3030,
): Promise<void> {
  await app.listen(port);
  logStartupInfo(`HTTP server listening on http://localhost:${port}`);
}

export async function initBackgroundOnly(
  app: NestExpressApplication,
  label: string,
): Promise<void> {
  await app.init();
  logStartupInfo(`${label}; BullMQ worker / background only`);
}
