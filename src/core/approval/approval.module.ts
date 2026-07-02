import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { RuntimeCacheModule } from '../runtime-cache/runtime-cache.module';
import { LlmModule } from '../llm/llm.module';
import { ToolEngineModule } from '../tool-engine/tool-engine.module';
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
