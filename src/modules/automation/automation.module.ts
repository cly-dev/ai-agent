import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../../auth/auth.module';
import { AutomationController } from './automation.controller';
import { AutomationTaskService } from './automation-task.service';
import { PageActionRunTaskProvider } from './providers/page-action-run-task.provider';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [AutomationController],
  providers: [AutomationTaskService, PageActionRunTaskProvider],
  exports: [AutomationTaskService, PageActionRunTaskProvider],
})
export class AutomationModule {}
