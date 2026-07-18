import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AppClientDsnGuard } from '../../../auth/app-client-dsn.guard';
import { APP_CLIENT_DSN_HEADER } from '../../../auth/app-client-dsn.constants';
import { UserJwtAuthGuard } from '../../../auth/user-jwt-auth.guard';
import { QueryAutomationTaskDto } from '../../automation/dto/query-automation-task.dto';
import { InvokePageActionDto } from '../dto/page-action.dto';
import { PageActionCEndService } from './page-action-c-end.service';

@ApiTags('page-action')
@ApiBearerAuth()
@Controller()
export class PageActionCEndController {
  constructor(private readonly cEndService: PageActionCEndService) {}

  private appClientId(req: Request): number {
    const id = req.appClient?.id;
    if (id === undefined) {
      throw new UnauthorizedException('missing app client context');
    }
    return id;
  }

  private userId(req: Request & { user?: { userId?: number } }): number {
    const id = req.user?.userId;
    if (id === undefined) {
      throw new UnauthorizedException('invalid user token');
    }
    return id;
  }

  @Post('page-action/invoke')
  @UseGuards(UserJwtAuthGuard, AppClientDsnGuard)
  @ApiSecurity('app-dsn')
  @ApiHeader({
    name: APP_CLIENT_DSN_HEADER,
    description: '业务方 DSN',
    required: true,
  })
  @ApiOperation({
    summary: 'C 端：提交 PageAction 自动化',
    description:
      '立即返回 runId 与 streamUrl；执行在后台进行。订阅 GET /page-action/runs/:id/stream 查看过程。',
  })
  async invoke(
    @Req() req: Request & { user?: { userId?: number } },
    @Body() body: InvokePageActionDto,
  ) {
    return this.cEndService.invoke(
      this.userId(req),
      this.appClientId(req),
      body,
    );
  }

  @Get('page-action/runs/:id/stream')
  @SkipThrottle()
  @UseGuards(UserJwtAuthGuard, AppClientDsnGuard)
  @ApiSecurity('app-dsn')
  @ApiHeader({
    name: APP_CLIENT_DSN_HEADER,
    description: '业务方 DSN',
    required: true,
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiOperation({
    summary: 'C 端：订阅 PageActionRun SSE',
    description:
      '重放进行中/已完成 run 的事件；与 invoke 返回的 streamUrl 对应。',
  })
  @ApiProduces('text/event-stream')
  @ApiResponse({ status: 200, description: 'page_action / page_workflow / host_action SSE' })
  async streamRun(
    @Req() req: Request & { user?: { userId?: number } },
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    await this.cEndService.subscribeRunStream(
      this.userId(req),
      this.appClientId(req),
      id,
      res,
    );
  }

  @Get('page-action/runs')
  @UseGuards(UserJwtAuthGuard, AppClientDsnGuard)
  @ApiSecurity('app-dsn')
  @ApiHeader({
    name: APP_CLIENT_DSN_HEADER,
    description: '业务方 DSN',
    required: true,
  })
  @ApiOperation({
    summary: 'C 端：PageAction 任务列表（automation 别名）',
    description: '等价于 GET /automation/tasks?triggerSource=page_action。',
  })
  listRuns(
    @Req() req: Request & { user?: { userId?: number } },
    @Query() query: QueryAutomationTaskDto,
  ) {
    return this.cEndService.listRuns(
      this.userId(req),
      this.appClientId(req),
      query,
    );
  }
}
