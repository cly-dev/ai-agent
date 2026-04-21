import 'dotenv/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ReqInterceptor } from './interceptor/req.interceptor';
import { HttpExceptionFilter } from './exception/http.exception';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
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
  app.useGlobalInterceptors(new ReqInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Agent Server API')
    .setDescription('API docs for Agent Server')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  await app.listen(3030);
  Logger.log('Swagger docs available at http://localhost:3030/docs');
}
bootstrap();
