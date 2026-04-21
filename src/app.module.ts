import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './modules/user/user.module';
import { UserModelConfigModule } from './modules/user-model-config/user-model-config.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule, UserModule, UserModelConfigModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
