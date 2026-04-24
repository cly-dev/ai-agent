import './core/env/load-env';
import { Logger, RequestMethod, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import { AppModule } from './app.module';
import { ReqInterceptor } from './interceptor/req.interceptor';
import { HttpExceptionFilter } from './exception/http.exception';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
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
      { path: 'chat/(.*)', method: RequestMethod.ALL },
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
        description: 'AppClient DSN，用于解析接入方（须与库中 AppClient.dsn 一致）',
      },
      'app-dsn',
    )
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  await app.listen(3030);
  Logger.log('Swagger docs available at http://localhost:3030/docs');
}
bootstrap();
