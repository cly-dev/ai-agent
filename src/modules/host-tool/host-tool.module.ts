import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../../auth/auth.module';
import { FlowModule } from '../flow/flow.module';
import { HostToolController } from './host-tool.controller';
import { HostToolService } from './host-tool.service';

@Module({
  imports: [PrismaModule, AuthModule, FlowModule],
  controllers: [HostToolController],
  providers: [HostToolService],
  exports: [HostToolService],
})
export class HostToolModule {}
