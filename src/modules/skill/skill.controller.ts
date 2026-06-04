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
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SkillService } from './skill.service';
import { CreateSkillDto } from './dto/create-skill.dto';
import { QuerySkillDto } from './dto/query-skill.dto';
import { ReplaceSkillToolsDto } from './dto/skill-tool-binding.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';

@ApiTags('skill')
@ApiBearerAuth()
@Controller()
export class SkillController {
  constructor(private readonly service: SkillService) {}

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
