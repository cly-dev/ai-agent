import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { AppClientDsnGuard } from '../../auth/app-client-dsn.guard';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { AgentService } from './agent.service';
import { BindAgentToolsDto } from './dto/bind-agent-tools.dto';
import { CreateAgentDto } from './dto/create-agent.dto';
import { QueryAgentToolsDto } from './dto/query-agent-tools.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';

@ApiTags('agent')
@Controller('agent')
export class AgentController {
  constructor(private readonly service: AgentService) {}

  private appClientId(req: Request): number {
    const id = req.appClient?.id;
    if (id === undefined) {
      throw new UnauthorizedException('missing app client context');
    }
    return id;
  }

  @Post()
  @ApiOperation({ summary: '创建 Agent' })
  @ApiResponse({ status: 201, description: '创建成功' })
  create(@Body() body: CreateAgentDto) {
    return this.service.create(body);
  }

  @Get()
  @ApiOperation({ summary: '查询 Agent 列表（含关联 tools）' })
  findAll() {
    return this.service.findAll();
  }

  @Get('by-app-client/:appClientId')
  @ApiParam({ name: 'appClientId', type: Number, description: 'AppClient ID' })
  @ApiOperation({
    summary:
      '按 AppClient（接入方）ID 查询 Agent 列表（不含 tools，请用 GET :agentId/app-client/:appClientId/tools）',
  })
  @ApiResponse({ status: 200, description: '查询成功' })
  findByAppClient(@Param('appClientId', ParseIntPipe) appClientId: number) {
    return this.service.findByAppClientId(appClientId);
  }

  @Get(':agentId/app-client/:appClientId/tools')
  @ApiParam({ name: 'agentId', type: Number, description: 'Agent ID' })
  @ApiParam({
    name: 'appClientId',
    type: Number,
    description: 'AppClient（接入方）ID',
  })
  @ApiOperation({
    summary:
      '分页查询 Agent 已绑定 Tool，支持按 Tool 字段筛选（id/name/keyword/riskLevel 等）',
  })
  @ApiResponse({ status: 200, description: '查询成功' })
  @ApiResponse({ status: 404, description: 'Agent 不存在或不属于该 AppClient' })
  getAgentTools(
    @Param('agentId', ParseIntPipe) agentId: number,
    @Param('appClientId', ParseIntPipe) appClientId: number,
    @Query() query: QueryAgentToolsDto,
  ) {
    return this.service.getToolsForAgent(agentId, appClientId, query);
  }

  @Post(':agentId/app-client/:appClientId/tools')
  @ApiParam({ name: 'agentId', type: Number, description: 'Agent ID' })
  @ApiParam({
    name: 'appClientId',
    type: Number,
    description: 'AppClient（接入方）ID',
  })
  @ApiOperation({
    summary: '为 Agent 绑定 Tool（追加，已存在则跳过；Tool 须属于该 AppClient）',
  })
  @ApiResponse({ status: 201, description: '绑定成功，返回当前全部已绑定 Tool' })
  @ApiResponse({ status: 400, description: 'Tool ID 无效或不属于该 AppClient' })
  @ApiResponse({ status: 404, description: 'Agent 不存在或不属于该 AppClient' })
  addAgentTools(
    @Param('agentId', ParseIntPipe) agentId: number,
    @Param('appClientId', ParseIntPipe) appClientId: number,
    @Body() body: BindAgentToolsDto,
  ) {
    return this.service.addToolsToAgent(agentId, appClientId, body);
  }

  @Delete(':agentId/app-client/:appClientId/tools')
  @ApiParam({ name: 'agentId', type: Number, description: 'Agent ID' })
  @ApiParam({
    name: 'appClientId',
    type: Number,
    description: 'AppClient（接入方）ID',
  })
  @ApiOperation({
    summary: '为 Agent 解绑 Tool（未绑定的 ID 忽略；Tool 须属于该 AppClient）',
  })
  @ApiResponse({ status: 200, description: '解绑成功，返回当前剩余已绑定 Tool' })
  @ApiResponse({ status: 400, description: 'Tool ID 无效或不属于该 AppClient' })
  @ApiResponse({ status: 404, description: 'Agent 不存在或不属于该 AppClient' })
  removeAgentTools(
    @Param('agentId', ParseIntPipe) agentId: number,
    @Param('appClientId', ParseIntPipe) appClientId: number,
    @Body() body: BindAgentToolsDto,
  ) {
    return this.service.removeToolsFromAgent(agentId, appClientId, body);
  }

  @Get(':id')
  @ApiOperation({ summary: '按 Agent ID 查询详情（含关联 tools）' })
  @ApiParam({ name: 'id', type: Number })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '按 ID 更新 Agent' })
  @ApiParam({ name: 'id', type: Number })
  update(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateAgentDto) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: '按 ID 删除 Agent' })
  @ApiParam({ name: 'id', type: Number })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }

  @UseGuards(JwtAuthGuard, AppClientDsnGuard)
  @ApiBearerAuth()
  @ApiSecurity('app-dsn')
  @ApiParam({ name: 'id', type: Number, description: 'Agent ID' })
  @ApiQuery({ name: 'userId', type: Number, description: '用户 ID' })
  @ApiOperation({ summary: '按用户角色过滤 Agent 可用工具' })
  @ApiResponse({ status: 200, description: '查询成功，返回可用工具列表' })
  @ApiResponse({ status: 404, description: 'Agent 或用户不存在' })
  @Get(':id/allowed-tools')
  getAllowedTools(
    @Req() req: Request,
    @Param('id', ParseIntPipe) agentId: number,
    @Query('userId', ParseIntPipe) userId: number,
  ) {
    return this.service.getAllowedTools(agentId, userId, this.appClientId(req));
  }
}
