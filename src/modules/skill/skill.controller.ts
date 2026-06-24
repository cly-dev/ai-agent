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
import { SkillService } from './skill.service';
import { CreateSkillDto } from './dto/create-skill.dto';
import { QueryClientSkillByAgentDto } from './dto/query-client-skill-by-agent.dto';
import { QuerySkillDto } from './dto/query-skill.dto';
import { ReplaceSkillToolsDto } from './dto/skill-tool-binding.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';

@ApiTags('skill')
@ApiBearerAuth()
@Controller()
export class SkillController {
  constructor(private readonly service: SkillService) {}

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

  @Get('agent/:agentId/skills/client')
  @UseGuards(UserJwtAuthGuard, AppClientDsnGuard)
  @ApiSecurity('app-dsn')
  @ApiHeader({
    name: APP_CLIENT_DSN_HEADER,
    description: '业务方 DSN',
    required: true,
  })
  @ApiParam({ name: 'agentId', type: Number })
  @ApiOperation({
    summary: 'C 端：按 Agent 查询当前用户可运行的 Skill 列表',
    description:
      'UserApp.role → RoleSkill 白名单（若已配置）；仅 active Skill，且 Skill 至少有一个可运行 HTTP Tool 或 Agent 白名单内的 SkillHostTool（与发消息 skillId 校验一致）。可选 query.page 按页面 scope 过滤（与 pageContext.page 一致）。不含 prompt/config。需用户 JWT + x-app-dsn。',
  })
  @ApiResponse({ status: 200, description: '查询成功' })
  listForClientByAgent(
    @Req() req: Request & { user?: { userId?: number } },
    @Param('agentId', ParseIntPipe) agentId: number,
    @Query() query: QueryClientSkillByAgentDto,
  ) {
    return this.service.findClientListByAgentForUser(
      agentId,
      this.userId(req),
      this.appClientId(req),
      query,
    );
  }

  @Post('agent/:agentId/app-client/:appClientId/skills')
  @ApiParam({ name: 'agentId', type: Number })
  @ApiParam({ name: 'appClientId', type: Number })
  @ApiOperation({
    summary: '为 Agent 创建 Skill',
    description:
      'Skill 归属该 Agent；可选初始 SkillTool，toolId 须已出现在 AgentTool 中。响应含嵌套 agent、appClient。',
  })
  @ApiResponse({ status: 201, description: '创建成功' })
  create(
    @Param('agentId', ParseIntPipe) agentId: number,
    @Param('appClientId', ParseIntPipe) appClientId: number,
    @Body() body: CreateSkillDto,
  ) {
    return this.service.create(agentId, appClientId, body);
  }

  @Get('agent/:agentId/app-client/:appClientId/skills')
  @ApiParam({ name: 'agentId', type: Number })
  @ApiParam({ name: 'appClientId', type: Number })
  @ApiOperation({
    summary: '分页查询 Agent 下的 Skill 列表',
    description: '每条记录含嵌套 agent、appClient。',
  })
  @ApiResponse({ status: 200, description: '查询成功' })
  findByAgent(
    @Param('agentId', ParseIntPipe) agentId: number,
    @Param('appClientId', ParseIntPipe) appClientId: number,
    @Query() query: QuerySkillDto,
  ) {
    return this.service.findPageByAgent(agentId, appClientId, query);
  }

  @Get('skill/by-app-client/:appClientId')
  @ApiParam({ name: 'appClientId', type: Number })
  @ApiOperation({
    summary: '按 AppClient 分页查询 Skill（可选 agentId 筛选）',
    description: '每条记录含嵌套 agent、appClient。',
  })
  @ApiResponse({ status: 200, description: '查询成功' })
  findByAppClient(
    @Param('appClientId', ParseIntPipe) appClientId: number,
    @Query() query: QuerySkillDto,
  ) {
    return this.service.findPageByAppClient(appClientId, query);
  }

  @Get('skill/:skillId')
  @ApiParam({ name: 'skillId', type: Number })
  @ApiOperation({ summary: '按 ID 查询 Skill 详情' })
  @ApiResponse({ status: 200, description: '查询成功' })
  findOne(@Param('skillId', ParseIntPipe) skillId: number) {
    return this.service.findOne(skillId);
  }

  @Patch('skill/:skillId')
  @ApiParam({ name: 'skillId', type: Number })
  @ApiOperation({ summary: '按 ID 更新 Skill（不含工具绑定）' })
  @ApiResponse({ status: 200, description: '更新成功' })
  update(
    @Param('skillId', ParseIntPipe) skillId: number,
    @Body() body: UpdateSkillDto,
  ) {
    return this.service.update(skillId, body);
  }

  @Put('skill/:skillId/tools')
  @ApiParam({ name: 'skillId', type: Number })
  @ApiOperation({
    summary: '全量替换 Skill 关联工具',
    description: 'toolId 须属于该 Skill 所属 Agent 的 AgentTool。',
  })
  @ApiResponse({ status: 200, description: '替换成功' })
  replaceTools(
    @Param('skillId', ParseIntPipe) skillId: number,
    @Body() body: ReplaceSkillToolsDto,
  ) {
    return this.service.replaceTools(skillId, body);
  }

  @Delete('skill/:skillId')
  @ApiParam({ name: 'skillId', type: Number })
  @ApiOperation({ summary: '按 ID 删除 Skill（级联删除 SkillTool）' })
  @ApiResponse({ status: 200, description: '删除成功' })
  remove(@Param('skillId', ParseIntPipe) skillId: number) {
    return this.service.remove(skillId);
  }
}
