import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
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
  await app.listen(3000);
}
bootstrap();
