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
import { CreateAgentDto } from './dto/create-agent.dto';
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
  @ApiOperation({ summary: '查询 Agent 列表' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '按 ID 查询 Agent' })
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
