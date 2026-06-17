import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { QueryMessageFeedbackAdminDto } from './dto/query-message-feedback-admin.dto';
import { MessageFeedbackAdminService } from './message-feedback-admin.service';

@ApiTags('message-feedback')
@ApiBearerAuth()
@Controller('message-feedback')
export class MessageFeedbackAdminController {
  constructor(private readonly service: MessageFeedbackAdminService) {}

  @Get('by-app-client/:appClientId/down-reason-tags')
  @ApiParam({ name: 'appClientId', type: Number })
  @ApiOperation({ summary: '点踩原因标签字典（与 C 端一致）' })
  listDownReasonTags() {
    return this.service.listDownReasonTags();
  }

  @Get('by-app-client/:appClientId/summary')
  @ApiParam({ name: 'appClientId', type: Number })
  @ApiOperation({ summary: '赞踩汇总（近 N 天）' })
  getSummary(
    @Param('appClientId', ParseIntPipe) appClientId: number,
    @Query('days') days?: string,
  ) {
    const parsedDays =
      days == null || days.trim() === '' ? 7 : Math.max(1, Number(days));
    return this.service.getSummary(appClientId, parsedDays);
  }

  @Get('by-app-client/:appClientId/by-session/:sessionId')
  @ApiParam({ name: 'appClientId', type: Number })
  @ApiParam({ name: 'sessionId', type: String })
  @ApiOperation({ summary: '按 Session 分页查询反馈' })
  findPageBySession(
    @Param('appClientId', ParseIntPipe) appClientId: number,
    @Param('sessionId') sessionId: string,
    @Query() query: QueryMessageFeedbackAdminDto,
  ) {
    return this.service.findPageBySession(appClientId, sessionId, query);
  }

  @Get('by-app-client/:appClientId')
  @ApiParam({ name: 'appClientId', type: Number })
  @ApiOperation({ summary: '按 AppClient 分页查询消息赞踩' })
  @ApiResponse({ status: 200, description: '查询成功' })
  findPage(
    @Param('appClientId', ParseIntPipe) appClientId: number,
    @Query() query: QueryMessageFeedbackAdminDto,
  ) {
    return this.service.findPage(appClientId, query);
  }

  @Get('by-app-client/:appClientId/:id')
  @ApiParam({ name: 'appClientId', type: Number })
  @ApiParam({ name: 'id', type: Number })
  @ApiOperation({ summary: '反馈详情' })
  findOne(
    @Param('appClientId', ParseIntPipe) appClientId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.findOne(appClientId, id);
  }
}
