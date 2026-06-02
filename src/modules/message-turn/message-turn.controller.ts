import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { QueryMessageTurnDto } from './dto/query-message-turn.dto';
import { MessageTurnService } from './message-turn.service';

@ApiTags('message-turn')
@ApiBearerAuth()
@Controller('message-turn')
export class MessageTurnController {
  constructor(private readonly service: MessageTurnService) {}

  @Get()
  @ApiOperation({
    summary: '分页查询 MessageTurn 列表',
    description:
      '支持分页与字段筛选。每条记录返回 agentRuns（含 agent）、primaryAgent、session、user、appClient 关联。',
  })
  @ApiResponse({ status: 200, description: '查询成功' })
  findPage(@Query() query: QueryMessageTurnDto) {
    return this.service.findPage(query);
  }

  @Get('by-session/:sessionId')
  @ApiParam({ name: 'sessionId', type: String })
  @ApiOperation({ summary: '按 Session ID 分页查询 MessageTurn 列表' })
  @ApiResponse({ status: 200, description: '查询成功' })
  findPageBySessionId(
    @Param('sessionId') sessionId: string,
    @Query() query: QueryMessageTurnDto,
  ) {
    return this.service.findPageBySessionId(sessionId, query);
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOperation({ summary: '按 ID 查询 MessageTurn' })
  @ApiResponse({ status: 200, description: '查询成功' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }
}
