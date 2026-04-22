import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { AgentService } from './agent.service';

@ApiTags('agent')
@Controller('agent')
export class AgentController {
  constructor(private readonly service: AgentService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: Number, description: 'Agent ID' })
  @ApiQuery({ name: 'userId', type: Number, description: '用户 ID' })
  @ApiOperation({ summary: '按用户角色过滤 Agent 可用工具' })
  @ApiResponse({ status: 200, description: '查询成功，返回可用工具列表' })
  @ApiResponse({ status: 404, description: 'Agent 或用户不存在' })
  @Get(':id/allowed-tools')
  getAllowedTools(
    @Param('id', ParseIntPipe) agentId: number,
    @Query('userId', ParseIntPipe) userId: number,
  ) {
    return this.service.getAllowedTools(agentId, userId);
  }
}
