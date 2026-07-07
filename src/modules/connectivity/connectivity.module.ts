import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { LlmModule } from '../../core/llm/llm.module';
import { MemoryModule } from '../../core/memory/memory.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { ConnectivityController } from './connectivity.controller';
import { ConnectivityService } from './connectivity.service';

@Module({
  imports: [AuthModule, PrismaModule, MemoryModule, LlmModule],
  controllers: [ConnectivityController],
  providers: [ConnectivityService],
  exports: [ConnectivityService],
})
export class ConnectivityModule {}
