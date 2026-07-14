import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { AppClientDsnGuard } from '../../auth/app-client-dsn.guard';
import { APP_CLIENT_DSN_HEADER } from '../../auth/app-client-dsn.constants';
import { UserJwtAuthGuard } from '../../auth/user-jwt-auth.guard';
import {
  CreateHostPageDto,
  UpdateHostPageDto,
} from './dto/host-page.dto';
import {
  CreateHostToolDto,
  QueryClientHostToolDto,
  QueryHostPageDto,
  QueryHostToolDto,
  RegisterClientHostToolsDto,
  UpdateHostToolDto,
} from './dto/host-tool.dto';
import {
  BindAgentHostToolsDto,
  ReplaceSkillHostToolsDto,
} from './dto/host-tool-binding.dto';
import { HostToolService } from './host-tool.service';

@ApiTags('host-tool')
@ApiBearerAuth()
@Controller()
export class HostToolController {
  constructor(private readonly service: HostToolService) {}

  private appClientId(req: Request): number {
    const id = req.appClient?.id;
    if (id === undefined) {
      throw new UnauthorizedException('missing app client context');
    }
    return id;
  }

  // ── C 端 catalog ─────────────────────────────────────────────────────────

  @Get('host-tool/client/catalog')
  @UseGuards(UserJwtAuthGuard, AppClientDsnGuard)
  @ApiSecurity('app-dsn')
  @ApiHeader({
    name: APP_CLIENT_DSN_HEADER,
    description: '业务方 DSN',
    required: true,
  })
  @ApiOperation({
    summary: 'C 端：查询当前 App 可用的 Host Tool 目录',
    description:
      '可选 scope（pageContext.page）与 agentId（Agent 白名单过滤）。执行仍在浏览器 registry。',
  })
  clientCatalog(
    @Req() req: Request,
    @Query() query: QueryClientHostToolDto,
  ) {
    return this.service.findClientCatalog(this.appClientId(req), query);
  }

  @Post('host-tool/client/register')
  @UseGuards(UserJwtAuthGuard, AppClientDsnGuard)
  @ApiSecurity('app-dsn')
  @ApiHeader({
    name: APP_CLIENT_DSN_HEADER,
    description: '业务方 DSN',
    required: true,
  })
  @ApiOperation({
    summary: 'C 端：幂等注册 / 更新 Host Tool 元数据',
    description:
      '与前端 registry 同步：App 内同名工具首次创建，已存在则更新 description/argsSchema/argsTemplate/hostPage。页内工具带 scope 时自动 ensure HostPage。执行仍在浏览器。',
  })
  @ApiResponse({
    status: 201,
    description: '注册结果（created + updated；skipped 恒空，兼容旧客户端）',
  })
  clientRegister(
    @Req() req: Request,
    @Body() body: RegisterClientHostToolsDto,
  ) {
    return this.service.registerClientHostTools(this.appClientId(req), body);
  }

  // ── HostPage admin ───────────────────────────────────────────────────────

  @Post('host-page')
  @ApiOperation({ summary: '创建 HostPage（页面登记）' })
  createHostPage(@Body() body: CreateHostPageDto) {
    return this.service.createHostPage(body);
  }

  @Get('host-page/by-app-client/:appClientId')
  @ApiParam({ name: 'appClientId', type: Number })
  @ApiOperation({ summary: '分页查询 App 下的 HostPage' })
  findHostPagePage(
    @Param('appClientId', ParseIntPipe) appClientId: number,
    @Query() query: QueryHostPageDto,
  ) {
    return this.service.findHostPagePage(appClientId, query);
  }

  @Get('host-page/:id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOperation({ summary: '按 ID 查询 HostPage' })
  findHostPageOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findHostPageOne(id);
  }

  @Patch('host-page/:id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOperation({ summary: '更新 HostPage' })
  updateHostPage(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateHostPageDto,
  ) {
    return this.service.updateHostPage(id, body);
  }

  @Delete('host-page/:id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOperation({ summary: '删除 HostPage（级联删除页内 HostTool）' })
  removeHostPage(@Param('id', ParseIntPipe) id: number) {
    return this.service.removeHostPage(id);
  }

  // ── HostTool admin ───────────────────────────────────────────────────────

  @Post('host-tool')
  @ApiOperation({
    summary: '创建 HostTool',
    description: 'hostPageId 为空表示 App 内通用工具（如 refreshEntity）',
  })
  createHostTool(@Body() body: CreateHostToolDto) {
    return this.service.createHostTool(body);
  }

  @Get('host-tool/by-app-client/:appClientId')
  @ApiParam({ name: 'appClientId', type: Number })
  @ApiOperation({ summary: '分页查询 App 下的 HostTool' })
  findHostToolPage(
    @Param('appClientId', ParseIntPipe) appClientId: number,
    @Query() query: QueryHostToolDto,
  ) {
    return this.service.findHostToolPage(appClientId, query);
  }

  @Get('host-tool/:id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOperation({ summary: '按 ID 查询 HostTool' })
  findHostToolOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findHostToolOne(id);
  }

  @Patch('host-tool/:id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOperation({ summary: '更新 HostTool' })
  updateHostTool(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateHostToolDto,
  ) {
    return this.service.updateHostTool(id, body);
  }

  @Delete('host-tool/:id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOperation({ summary: '删除 HostTool' })
  removeHostTool(@Param('id', ParseIntPipe) id: number) {
    return this.service.removeHostTool(id);
  }

  // ── Agent bindings ───────────────────────────────────────────────────────

  @Get('agent/:agentId/app-client/:appClientId/host-tools')
  @ApiParam({ name: 'agentId', type: Number })
  @ApiParam({ name: 'appClientId', type: Number })
  @ApiOperation({ summary: '分页查询 Agent 可绑定的 HostTool（含 bound 标记）' })
  getAgentHostTools(
    @Param('agentId', ParseIntPipe) agentId: number,
    @Param('appClientId', ParseIntPipe) appClientId: number,
    @Query() query: QueryHostToolDto,
  ) {
    return this.service.getHostToolsForAgent(agentId, appClientId, query);
  }

  @Post('agent/:agentId/app-client/:appClientId/host-tools')
  @ApiOperation({ summary: '为 Agent 绑定 HostTool（追加）' })
  addAgentHostTools(
    @Param('agentId', ParseIntPipe) agentId: number,
    @Param('appClientId', ParseIntPipe) appClientId: number,
    @Body() body: BindAgentHostToolsDto,
  ) {
    return this.service.addHostToolsToAgent(agentId, appClientId, body);
  }

  @Delete('agent/:agentId/app-client/:appClientId/host-tools')
  @ApiOperation({ summary: '为 Agent 解绑 HostTool' })
  removeAgentHostTools(
    @Param('agentId', ParseIntPipe) agentId: number,
    @Param('appClientId', ParseIntPipe) appClientId: number,
    @Body() body: BindAgentHostToolsDto,
  ) {
    return this.service.removeHostToolsFromAgent(agentId, appClientId, body);
  }

  // ── Skill bindings ───────────────────────────────────────────────────────

  @Get('skill/:skillId/host-tools')
  @ApiParam({ name: 'skillId', type: Number })
  @ApiOperation({ summary: '查询 Skill 关联的 HostTool' })
  listSkillHostTools(@Param('skillId', ParseIntPipe) skillId: number) {
    return this.service.listSkillHostToolBindings(skillId);
  }

  @Put('skill/:skillId/host-tools')
  @ApiParam({ name: 'skillId', type: Number })
  @ApiOperation({
    summary: '全量替换 Skill 关联 HostTool',
    description: 'hostToolId 须已出现在 AgentHostTool 中',
  })
  replaceSkillHostTools(
    @Param('skillId', ParseIntPipe) skillId: number,
    @Body() body: ReplaceSkillHostToolsDto,
  ) {
    return this.service.replaceSkillHostTools(skillId, body);
  }
}
