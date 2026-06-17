import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { AppClientDsnGuard } from '../../auth/app-client-dsn.guard';
import { UserJwtAuthGuard } from '../../auth/user-jwt-auth.guard';
import {
  QuerySessionMessageFeedbacksDto,
  UpsertMessageFeedbackDto,
} from './dto/message-feedback.dto';
import { SaveMessageDto } from './dto/save-message.dto';
import { MessageFeedbackService } from './message-feedback.service';
import { MessageService } from './message.service';

@ApiTags('message')
@Controller('chat/:sessionId/messages')
@UseGuards(UserJwtAuthGuard, AppClientDsnGuard)
@ApiBearerAuth()
@ApiSecurity('app-dsn')
export class MessageController {
  constructor(
    private readonly service: MessageService,
    private readonly feedbackService: MessageFeedbackService,
  ) {}

  private userId(req: Request & { user?: { userId?: number } }): number {
    const id = req.user?.userId;
    if (id === undefined) {
      throw new UnauthorizedException('invalid user token');
    }
    return id;
  }

  private appClientId(req: Request): number {
    const id = req.appClient?.id;
    if (id === undefined) {
      throw new UnauthorizedException('missing app client context');
    }
    return id;
  }

  @Post()
  @ApiOperation({ summary: '保存会话消息' })
  @ApiParam({ name: 'sessionId', type: String })
  @ApiResponse({ status: 201, description: '创建成功' })
  create(
    @Req() req: Request & { user?: { userId?: number } },
    @Param('sessionId') sessionId: string,
    @Body() body: SaveMessageDto,
  ) {
    return this.service.create(
      this.userId(req),
      sessionId,
      body,
      this.appClientId(req),
    );
  }

  @Get('feedbacks')
  @ApiOperation({
    summary: '批量查询当前用户对会话内 assistant 消息的赞踩',
    description: 'query messageIds=1,2,3，最多 100 个',
  })
  @ApiParam({ name: 'sessionId', type: String })
  listFeedbacks(
    @Req() req: Request & { user?: { userId?: number } },
    @Param('sessionId') sessionId: string,
    @Query() query: QuerySessionMessageFeedbacksDto,
  ) {
    return this.feedbackService.listForSessionMessages({
      sessionId,
      userId: this.userId(req),
      appClientId: this.appClientId(req),
      messageIds: this.feedbackService.parseMessageIdsParam(query.messageIds),
    });
  }

  @Put(':messageId/feedback')
  @ApiOperation({
    summary: '对 assistant 消息点赞/点踩（幂等 upsert）',
    description: '点踩须 reasonTags 和/或 comment；选 other 标签时 comment 必填',
  })
  @ApiParam({ name: 'sessionId', type: String })
  @ApiParam({ name: 'messageId', type: Number })
  upsertFeedback(
    @Req() req: Request & { user?: { userId?: number } },
    @Param('sessionId') sessionId: string,
    @Param('messageId', ParseIntPipe) messageId: number,
    @Body() body: UpsertMessageFeedbackDto,
  ) {
    return this.feedbackService.upsertForMessage({
      sessionId,
      messageId,
      userId: this.userId(req),
      appClientId: this.appClientId(req),
      dto: body,
    });
  }

  @Get(':messageId/feedback')
  @ApiOperation({ summary: '查询当前用户对单条 assistant 消息的赞踩' })
  @ApiParam({ name: 'sessionId', type: String })
  @ApiParam({ name: 'messageId', type: Number })
  getFeedback(
    @Req() req: Request & { user?: { userId?: number } },
    @Param('sessionId') sessionId: string,
    @Param('messageId', ParseIntPipe) messageId: number,
  ) {
    return this.feedbackService.findForMessage({
      sessionId,
      messageId,
      userId: this.userId(req),
      appClientId: this.appClientId(req),
    });
  }

  @Delete(':messageId/feedback')
  @ApiOperation({ summary: '取消对 assistant 消息的赞踩' })
  @ApiParam({ name: 'sessionId', type: String })
  @ApiParam({ name: 'messageId', type: Number })
  removeFeedback(
    @Req() req: Request & { user?: { userId?: number } },
    @Param('sessionId') sessionId: string,
    @Param('messageId', ParseIntPipe) messageId: number,
  ) {
    return this.feedbackService.removeForMessage({
      sessionId,
      messageId,
      userId: this.userId(req),
      appClientId: this.appClientId(req),
    });
  }
}
