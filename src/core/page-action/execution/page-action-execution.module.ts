import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { LlmModule } from '../../llm/llm.module';
import { ToolEngineModule } from '../../tool-engine/tool-engine.module';
import { ApprovalModule } from '../../approval/approval.module';
import { PageActionStreamModule } from '../stream/page-action-stream.module';
import { PageActionRunExecutor } from './page-action-run.executor';

@Module({
  imports: [
    PrismaModule,
    LlmModule,
    ToolEngineModule,
    ApprovalModule,
    PageActionStreamModule,
  ],
  providers: [PageActionRunExecutor],
  exports: [PageActionRunExecutor],
})
export class PageActionExecutionModule {}
