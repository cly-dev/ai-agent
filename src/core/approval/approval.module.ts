import { Global, Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { RuntimeCacheModule } from '../runtime-cache/runtime-cache.module';
import { LlmModule } from '../llm/llm.module';
import { ToolEngineModule } from '../tool-engine/tool-engine.module';
import { SessionRunModule } from '../session-run/session-run.module';
import { ChatModule } from '../../modules/chat/chat.module';
import { ApprovalGateService } from './approval-gate.service';
import { ApprovalRequestService } from './approval-request.service';
import { ApprovalResumeService } from './approval-resume.service';
import { ApprovalTriggerPermissionService } from './approval-trigger-permission.service';

@Global()
@Module({
  imports: [
    PrismaModule,
    RuntimeCacheModule,
    LlmModule,
    ToolEngineModule,
    forwardRef(() => SessionRunModule),
    forwardRef(() => ChatModule),
  ],
  providers: [
    ApprovalRequestService,
    ApprovalGateService,
    ApprovalTriggerPermissionService,
    ApprovalResumeService,
  ],
  exports: [
    ApprovalRequestService,
    ApprovalGateService,
    ApprovalTriggerPermissionService,
    ApprovalResumeService,
  ],
})
export class ApprovalModule {}
