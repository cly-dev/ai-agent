import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { MessageFeedbackAdminController } from './message-feedback-admin.controller';
import { MessageFeedbackAdminService } from './message-feedback-admin.service';

@Module({
  imports: [PrismaModule],
  providers: [MessageFeedbackAdminService],
  controllers: [MessageFeedbackAdminController],
  exports: [MessageFeedbackAdminService],
})
export class MessageFeedbackModule {}
