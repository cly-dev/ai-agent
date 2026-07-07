import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AdminRole } from '../../../generated/prisma/client';
import { AdminRoles } from '../../auth/admin-roles.decorator';
import { AdminRoleGuard } from '../../auth/admin-role.guard';
import { ConnectivityService } from './connectivity.service';
import { RunConnectivityChecksDto } from './dto/run-connectivity-checks.dto';

@ApiTags('connectivity')
@ApiBearerAuth()
@Controller('connectivity')
@UseGuards(AdminRoleGuard)
export class ConnectivityController {
  constructor(private readonly service: ConnectivityService) {}

  @Get('database')
  @AdminRoles(AdminRole.VIEWER)
  @ApiOperation({ summary: '检测 PostgreSQL 连通性' })
  @ApiResponse({ status: 200 })
  checkDatabase() {
    return this.service.checkDatabase();
  }

  @Get('redis')
  @AdminRoles(AdminRole.VIEWER)
  @ApiOperation({ summary: '检测 Redis 连通性' })
  @ApiResponse({ status: 200 })
  checkRedis() {
    return this.service.checkRedis();
  }

  @Post('llm/chat')
  @AdminRoles(AdminRole.OPERATOR)
  @ApiOperation({ summary: '检测当前启用的 Chat LLM 连通性' })
  @ApiResponse({ status: 200 })
  checkLlmChat() {
    return this.service.checkLlmChat();
  }

  @Post('llm/embedding')
  @AdminRoles(AdminRole.OPERATOR)
  @ApiOperation({ summary: '检测当前启用的 Embedding 连通性' })
  @ApiResponse({ status: 200 })
  checkLlmEmbedding() {
    return this.service.checkLlmEmbedding();
  }

  @Post('batch')
  @AdminRoles(AdminRole.OPERATOR)
  @ApiOperation({
    summary: '批量检测基础设施连通性',
    description:
      '默认检测 database / redis / llm_chat / llm_embedding。Integration、Tool、AppClient 鉴权请使用各自模块的 test 接口。',
  })
  @ApiResponse({ status: 200 })
  runBatch(@Body() body: RunConnectivityChecksDto) {
    return this.service.runBatch(body.targets);
  }

  @Get('summary')
  @AdminRoles(AdminRole.VIEWER)
  @ApiOperation({
    summary: '只读基础设施连通性摘要（database + redis）',
  })
  @ApiResponse({ status: 200 })
  async summary() {
    return this.service.runBatch(['database', 'redis']);
  }
}
