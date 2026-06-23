import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../../auth/auth.module';
import { HostToolController } from './host-tool.controller';
import { HostToolService } from './host-tool.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [HostToolController],
  providers: [HostToolService],
  exports: [HostToolService],
})
export class HostToolModule {}
