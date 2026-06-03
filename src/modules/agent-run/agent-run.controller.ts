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
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AgentRunService } from './agent-run.service';
import { CreateAgentRunDto } from './dto/create-agent-run.dto';
import { QueryAgentRunDto } from './dto/query-agent-run.dto';
import { UpdateAgentRunDto } from './dto/update-agent-run.dto';

@ApiTags('agent-run')
@ApiBearerAuth()
@Controller('agent-run')
export class AgentRunController {
  constructor(private readonly service: AgentRunService) {}

  @Post('by-app-client/:appClientId')
  @ApiParam({ name: 'appClientId', type: Number, description: 'AppClient ID' })
  @ApiOperation({ summary: '按 AppClient 创建 AgentRun' })
  @ApiResponse({ status: 201, description: '创建成功' })
  create(
    @Param('appClientId', ParseIntPipe) appClientId: number,
    @Body() body: CreateAgentRunDto,
  ) {
    return this.service.create(appClientId, body);
  }

  @Get('by-app-client/:appClientId')
  @ApiParam({ name: 'appClientId', type: Number, description: 'AppClient ID' })
  @ApiOperation({ summary: '按 AppClient 分页查询 AgentRun 列表' })
  @ApiResponse({ status: 200, description: '查询成功' })
  findPage(
    @Param('appClientId', ParseIntPipe) appClientId: number,
    @Query() query: QueryAgentRunDto,
  ) {
    return this.service.findPage(appClientId, query);
  }

  @Get('by-app-client/:appClientId/ops-metrics')
  @ApiParam({ name: 'appClientId', type: Number, description: 'AppClient ID' })
  @ApiOperation({ summary: '运维看板核心指标（近 N 天）' })
  @ApiResponse({ status: 200, description: '查询成功' })
  getOpsMetrics(
    @Param('appClientId', ParseIntPipe) appClientId: number,
    @Query('days') days?: string,
  ) {
    const parsedDays =
      days == null || days.trim() === '' ? 7 : Math.max(1, Number(days));
    return this.service.getOpsMetrics(appClientId, parsedDays);
  }

  @Get('by-app-client/:appClientId/:id')
  @ApiParam({ name: 'appClientId', type: Number, description: 'AppClient ID' })
  @ApiParam({ name: 'id', type: Number, description: 'AgentRun ID' })
  @ApiOperation({ summary: '按 AppClient + ID 查询 AgentRun 详情' })
  @ApiResponse({ status: 200, description: '查询成功' })
  findOne(
    @Param('appClientId', ParseIntPipe) appClientId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.findOne(appClientId, id);
  }

  @Patch('by-app-client/:appClientId/:id')
  @ApiParam({ name: 'appClientId', type: Number, description: 'AppClient ID' })
  @ApiParam({ name: 'id', type: Number, description: 'AgentRun ID' })
  @ApiOperation({ summary: '按 AppClient + ID 更新 AgentRun' })
  @ApiResponse({ status: 200, description: '更新成功' })
  update(
    @Param('appClientId', ParseIntPipe) appClientId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateAgentRunDto,
  ) {
    return this.service.update(appClientId, id, body);
  }

  @Delete('by-app-client/:appClientId/:id')
  @ApiParam({ name: 'appClientId', type: Number, description: 'AppClient ID' })
  @ApiParam({ name: 'id', type: Number, description: 'AgentRun ID' })
  @ApiOperation({ summary: '按 AppClient + ID 删除 AgentRun' })
  @ApiResponse({ status: 200, description: '删除成功' })
  remove(
    @Param('appClientId', ParseIntPipe) appClientId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.remove(appClientId, id);
  }
}
