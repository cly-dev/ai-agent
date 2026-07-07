import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { AppClientDsnGuard } from '../../auth/app-client-dsn.guard';
import { APP_CLIENT_DSN_HEADER } from '../../auth/app-client-dsn.constants';
import { UserJwtAuthGuard } from '../../auth/user-jwt-auth.guard';
import { AutomationTaskService } from './automation-task.service';
import { QueryAutomationTaskDto } from './dto/query-automation-task.dto';

type AuthedRequest = Request & {
  user: { userId: number };
  appClient: { id: number };
};

@ApiTags('automation')
@ApiBearerAuth()
@ApiSecurity('app-dsn')
@ApiHeader({
  name: APP_CLIENT_DSN_HEADER,
  description: '业务方 DSN',
  required: true,
})
@Controller('automation')
@UseGuards(UserJwtAuthGuard, AppClientDsnGuard)
export class AutomationController {
  constructor(private readonly automationTasks: AutomationTaskService) {}

  @Get('tasks')
  @ApiOperation({
    summary: 'C 端：自动化任务列表',
    description: 'v1 仅含 page_action；triggerSource=webhook 返回空列表。',
  })
  async listTasks(
    @Req() req: AuthedRequest,
    @Query() query: QueryAutomationTaskDto,
  ) {
    return this.automationTasks.list({
      appClientId: req.appClient.id,
      userId: req.user.userId,
      status: query.status,
      triggerSource: query.triggerSource,
      actionKey: query.actionKey,
      workflowKey: query.workflowKey,
      limit: query.limit,
      offset: query.offset,
    });
  }

  @Get('tasks/page_action_run/:id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOperation({ summary: 'C 端：page_action 任务详情' })
  async getPageActionRunTask(
    @Req() req: AuthedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.automationTasks.getDetail({
      kind: 'page_action_run',
      id,
      appClientId: req.appClient.id,
      userId: req.user.userId,
    });
  }
}
