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
import type { Request, Response } from 'express';
import { APP_CLIENT_DSN_HEADER } from '../../auth/app-client-dsn.constants';
import { AppClientDsnGuard } from '../../auth/app-client-dsn.guard';
import { UserJwtAuthGuard } from '../../auth/user-jwt-auth.guard';
import { QueryPageAgentLlmProxyAuditDto } from './dto/page-agent-audit.dto';
import { PageAgentProxyService } from './page-agent-proxy.service';

@ApiTags('page-agent')
@ApiBearerAuth()
@Controller('page-agent')
export class PageAgentController {
  constructor(private readonly service: PageAgentProxyService) {}

  private userId(req: Request & { user?: { userId?: number } }): number {
    const id = req.user?.userId;
    if (id === undefined) {
      throw new UnauthorizedException('invalid user token');
    }
    return id;
  }

  private appClientId(req: Request): number {
    const id = req.appClient?.id;
    if (id === undefined) {
      throw new UnauthorizedException('missing app client context');
    }
    return id;
  }

  @Post('compatible-mode/v1/chat/completions')
  @UseGuards(UserJwtAuthGuard, AppClientDsnGuard)
  @ApiSecurity('app-dsn')
  @ApiHeader({
    name: APP_CLIENT_DSN_HEADER,
    description: '业务方 DSN',
    required: true,
  })
  @ApiOperation({
    summary: 'C 端：PageAgent OpenAI-compatible LLM 代理',
    description:
      '前端不传 provider key；服务端使用 DB 中启用的 LlmModelConfig(kind=chat)，默认按非流式 JSON 调用上游并记录轻量审计。',
  })
  @ApiProduces('application/json')
  @ApiResponse({ status: 200, description: 'OpenAI-compatible JSON' })
  async chatCompletions(
    @Req() req: Request & { user?: { userId?: number } },
    @Body() body: Record<string, unknown>,
    @Res() res: Response,
  ): Promise<void> {
    await this.service.proxyChatCompletions({
      userId: this.userId(req),
      appClientId: this.appClientId(req),
      body,
      req,
      res,
    });
  }

  @Get('llm-proxy-audit/by-app-client/:appClientId')
  @ApiParam({ name: 'appClientId', type: Number })
  @ApiOperation({ summary: 'B 端：分页查询 PageAgent LLM 代理审计' })
  @ApiResponse({ status: 200, description: '查询成功' })
  findAuditPage(
    @Param('appClientId', ParseIntPipe) appClientId: number,
    @Query() query: QueryPageAgentLlmProxyAuditDto,
  ) {
    return this.service.findAuditPage(appClientId, query);
  }

  @Get('llm-proxy-audit/by-app-client/:appClientId/:id')
  @ApiParam({ name: 'appClientId', type: Number })
  @ApiParam({ name: 'id', type: Number })
  @ApiOperation({ summary: 'B 端：PageAgent LLM 代理审计详情' })
  @ApiResponse({ status: 200, description: '查询成功' })
  findAuditDetail(
    @Param('appClientId', ParseIntPipe) appClientId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.findAuditDetail(appClientId, id);
  }
}
