import { Module } from '@nestjs/common';
import { LlmModule } from '../../core/llm/llm.module';
import { ToolEngineModule } from '../../core/tool-engine/tool-engine.module';
import { ApprovalModule as CoreApprovalModule } from '../../core/approval/approval.module';
import { AuthModule } from '../../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { WorkflowModule } from '../workflow/workflow.module';
import { PageActionController } from './page-action.controller';
import { PageActionService } from './page-action.service';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    LlmModule,
    ToolEngineModule,
    WorkflowModule,
    CoreApprovalModule,
  ],
  controllers: [PageActionController],
  providers: [PageActionService],
  exports: [PageActionService],
})
export class PageActionModule {}
