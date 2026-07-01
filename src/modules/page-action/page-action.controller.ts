import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
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
import type { Request, Response } from 'express';
import { AppClientDsnGuard } from '../../auth/app-client-dsn.guard';
import { APP_CLIENT_DSN_HEADER } from '../../auth/app-client-dsn.constants';
import { UserJwtAuthGuard } from '../../auth/user-jwt-auth.guard';
import {
  CreatePageActionDto,
  InvokePageActionDto,
  QueryPageActionDto,
  QueryPageActionRunDto,
  UpdatePageActionDto,
} from './dto/page-action.dto';
import { PageActionService } from './page-action.service';

@ApiTags('page-action')
@ApiBearerAuth()
@Controller()
export class PageActionController {
  constructor(private readonly service: PageActionService) {}

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

  @Post('page-action')
  @ApiOperation({
    summary: 'B 端：创建 PageAction',
    description:
      '可省略 hostToolId：服务端按 actionKey / pageScope 自动创建 HostTool（默认 text 字段 schema）。',
  })
  create(@Body() body: CreatePageActionDto) {
    return this.service.create(body);
  }

  @Patch('page-action/:id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOperation({ summary: 'B 端：更新 PageAction' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdatePageActionDto,
  ) {
    return this.service.update(id, body);
  }

  @Get('page-action/:id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOperation({ summary: 'B 端：PageAction 详情' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Get('page-action/by-app-client/:appClientId')
  @ApiParam({ name: 'appClientId', type: Number })
  @ApiOperation({ summary: 'B 端：分页查询 App 下 PageAction' })
  findPage(
    @Param('appClientId', ParseIntPipe) appClientId: number,
    @Query() query: QueryPageActionDto,
  ) {
    return this.service.findPage({ ...query, appClientId });
  }

  @Get('page-action/run/by-app-client/:appClientId')
  @ApiParam({ name: 'appClientId', type: Number })
  @ApiOperation({ summary: 'B 端：分页查询 PageActionRun 运行记录' })
  findRunPageAdmin(
    @Param('appClientId', ParseIntPipe) appClientId: number,
    @Query() query: QueryPageActionRunDto,
  ) {
    return this.service.findRunPageAdmin(appClientId, query);
  }

  @Get('page-action/run/:id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOperation({
    summary: 'B 端：PageActionRun 详情（含运行步骤 steps）',
    description: '与 GET page-action/run/detail/:id 相同。',
  })
  findRunAdminById(@Param('id', ParseIntPipe) id: number) {
    return this.service.findRunAdmin(id);
  }

  @Get('page-action/run/detail/:id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOperation({
    summary: 'B 端：PageActionRun 详情（含运行步骤 steps）',
    description: '与 GET page-action/run/:id 相同（保留兼容路径）。',
  })
  findRunAdmin(@Param('id', ParseIntPipe) id: number) {
    return this.service.findRunAdmin(id);
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
    summary: 'C 端：one-shot 执行 PageAction',
    description:
      '响应为 text/event-stream（host_action DSL 真流式 + page_action 生命周期）。无需 Chat session。',
  })
  @ApiProduces('text/event-stream')
  @ApiResponse({ status: 200, description: 'inline_stream SSE' })
  async invoke(
    @Req() req: Request & { user?: { userId?: number } },
    @Body() body: InvokePageActionDto,
    @Res() res: Response,
  ) {
    await this.service.invoke(
      this.userId(req),
      this.appClientId(req),
      body,
      res,
    );
  }
}
