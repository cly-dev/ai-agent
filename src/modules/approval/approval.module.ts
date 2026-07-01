import { Module } from '@nestjs/common';
import { ApprovalModule as CoreApprovalModule } from '../../core/approval/approval.module';
import { AuthModule } from '../../auth/auth.module';
import { ApprovalController } from './approval.controller';

@Module({
  imports: [CoreApprovalModule, AuthModule],
  controllers: [ApprovalController],
})
export class ApprovalModule {}
