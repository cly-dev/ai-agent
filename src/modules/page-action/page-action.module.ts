import { Module } from '@nestjs/common';
import { PageActionExecutionModule } from '../../core/page-action/execution/page-action-execution.module';
import { AuthModule } from '../../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { FlowModule } from '../flow/flow.module';
import { AutomationModule } from '../automation/automation.module';
import { PageActionCEndController } from './c-end/page-action-c-end.controller';
import { PageActionCEndService } from './c-end/page-action-c-end.service';
import { PageActionController } from './page-action.controller';
import { PageActionService } from './page-action.service';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    FlowModule,
    PageActionExecutionModule,
    AutomationModule,
  ],
  controllers: [PageActionController, PageActionCEndController],
  providers: [PageActionService, PageActionCEndService],
  exports: [PageActionService, PageActionCEndService],
})
export class PageActionModule {}
