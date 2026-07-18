import { Body, Controller, Delete, Get, Logger, MessageEvent, Param, Post, Query, Req, Sse, UnauthorizedException, UseGuards } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { Observable, Subscription } from 'rxjs';
import { AppClientDsnGuard } from '../../auth/app-client-dsn.guard';
import { UserJwtAuthGuard } from '../../auth/user-jwt-auth.guard';
import { ChatEventsService } from './chat-events.service';
import { serializeChatSseData } from './chat-sse-payload.util';
import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { DeleteChatResponseDto } from './dto/delete-chat-response.dto';
import {
  CancelAgentRunDto,
  CancelAgentRunResponseDto,
} from './dto/cancel-agent-run.dto';
import { SessionRunStateResponseDto } from './dto/session-run-state.dto';
import { PrepareChatDto } from './dto/prepare-chat.dto';
import { PrepareChatResponseDto } from './dto/prepare-chat-response.dto';
import { QueryChatListDto } from './dto/query-chat-list.dto';
import { SessionPrepareService } from './session-prepare.service';
import { MESSAGE_FEEDBACK_DOWN_REASON_TAGS } from '../message/message-feedback.constants';

@ApiTags('chat')
@Controller('chat')
@UseGuards(UserJwtAuthGuard, AppClientDsnGuard)
@ApiBearerAuth()
@ApiSecurity('app-dsn')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(
    private readonly chatService: ChatService,
    private readonly chatEvents: ChatEventsService,
    private readonly sessionPrepareService: SessionPrepareService,
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

  private normalizeSessionId(sessionId: string): string {
    return sessionId.trim().toLowerCase();
  }

  @Post()
  @ApiOperation({ summary: '创建会话并保存第一条消息，返回 sessionId' })
  @ApiResponse({ status: 201, description: '创建成功' })
  create(
    @Req() req: Request & { user?: { userId?: number } },
    @Body() body: CreateChatDto,
  ) {
    return this.chatService.create(
      this.userId(req),
      this.appClientId(req),
      body,
    );
  }

  @Get('feedback/down-reason-tags')
  @ApiOperation({
    summary: 'C 端：点踩原因标签列表',
    description: '供点踩弹窗渲染；提交 upsert 时传 key 数组',
  })
  @ApiResponse({ status: 200, description: '查询成功' })
  listMessageFeedbackDownReasonTags() {
    return { items: [...MESSAGE_FEEDBACK_DOWN_REASON_TAGS] };
  }

  @Get()
  @ApiOperation({
    summary: '当前用户在当前 DSN 对应 AppClient 下的会话列表（分页）',
    description:
      '查询参数 page（默认 1）、size（默认 20，最大 100）。返回 items / total / page / pageSize / totalPages。',
  })
  findAll(
    @Req() req: Request & { user?: { userId?: number } },
    @Query() query: QueryChatListDto,
  ) {
    return this.chatService.findAllForUser(
      this.userId(req),
      this.appClientId(req),
      query,
    );
  }

  @Post(':sessionId/prepare')
  @ApiOperation({
    summary:
      '预热会话：Agent runtime、权限内 tools/skills、按路由 page 预热 host_tool、会话 history',
  })
  @ApiParam({ name: 'sessionId', type: String, description: '会话 ID（32 位 hex）' })
  @ApiResponse({ status: 200, description: '预热完成', type: PrepareChatResponseDto })
  prepare(
    @Req() req: Request & { user?: { userId?: number } },
    @Param('sessionId') sessionId: string,
    @Body() body: PrepareChatDto,
  ): Promise<PrepareChatResponseDto> {
    return this.sessionPrepareService.warm(
      this.normalizeSessionId(sessionId),
      this.userId(req),
      this.appClientId(req),
      this.sessionPrepareService.resolvePageContextFromPrepareDto(body),
    );
  }

  @Get(':sessionId')
  @ApiOperation({
    summary: '按 sessionId 获取会话详情（消息分页）',
    description:
      '查询参数 page（默认 1）、size（默认 20，最大 100）。messages 为分页对象；page=1 为最新一页，items 内按时间升序。',
  })
  @ApiParam({ name: 'sessionId', type: String })
  findOne(
    @Req() req: Request & { user?: { userId?: number } },
    @Param('sessionId') sessionId: string,
    @Query() query: QueryChatListDto,
  ) {
    return this.chatService.findOneForUser(
      this.normalizeSessionId(sessionId),
      this.userId(req),
      this.appClientId(req),
      query,
    );
  }

  @Delete(':sessionId')
  @ApiOperation({ summary: 'C 端删除会话（含消息、运行记录及会话上下文）' })
  @ApiParam({ name: 'sessionId', type: String, description: '会话 ID（32 位 hex）' })
  @ApiResponse({ status: 200, description: '删除成功', type: DeleteChatResponseDto })
  remove(
    @Req() req: Request & { user?: { userId?: number } },
    @Param('sessionId') sessionId: string,
  ): Promise<DeleteChatResponseDto> {
    return this.chatService.remove(
      this.normalizeSessionId(sessionId),
      this.userId(req),
      this.appClientId(req),
    );
  }

  @Get(':sessionId/run-state')
  @ApiOperation({
    summary:
      '获取 session run 状态（generation / active run / pendingWriteGate，用于多 Tab 与页面刷新对齐）',
  })
  @ApiParam({ name: 'sessionId', type: String })
  @ApiResponse({ status: 200, type: SessionRunStateResponseDto })
  getRunState(
    @Req() req: Request & { user?: { userId?: number } },
    @Param('sessionId') sessionId: string,
  ): Promise<SessionRunStateResponseDto> {
    return this.chatService.getSessionRunState(
      this.normalizeSessionId(sessionId),
      this.userId(req),
      this.appClientId(req),
    );
  }

  @Post(':sessionId/cancel-run')
  @ApiOperation({
    summary: '停止当前 session 正在执行的 Agent Run（并清空排队任务）',
  })
  @ApiParam({ name: 'sessionId', type: String })
  @ApiResponse({ status: 200, type: CancelAgentRunResponseDto })
  cancelRun(
    @Req() req: Request & { user?: { userId?: number } },
    @Param('sessionId') sessionId: string,
    @Body() body: CancelAgentRunDto,
  ): Promise<CancelAgentRunResponseDto> {
    return this.chatService.cancelSessionRun(
      this.normalizeSessionId(sessionId),
      this.userId(req),
      this.appClientId(req),
      body.runId,
    );
  }

  @SkipThrottle()
  @Sse(':sessionId/stream')
  @ApiOperation({
    summary:
      'SSE：think-思考 / message-结果和信息 / complete-推送完成 / error-推送失败',
  })
  @ApiParam({ name: 'sessionId', type: String, description: '会话 ID（hex）' })
  @ApiProduces('text/event-stream')
  stream(
    @Req() req: Request & { user?: { userId?: number } },
    @Param('sessionId') sessionId: string,
  ): Observable<MessageEvent> {
    const uid = this.userId(req);
    const aid = this.appClientId(req);
    const normalizedSessionId = this.normalizeSessionId(sessionId);
    return new Observable<MessageEvent>((subscriber) => {
      let inner: Subscription | null = null;
      const connectedAt = Date.now();
      let ownershipResolved = false;
      void this.chatService
        .assertSessionOwnedByUser(normalizedSessionId, uid, aid)
        .then((session) => {
          ownershipResolved = true;
          this.logger.debug(
            `chat SSE connected sessionId=${session.id} userId=${uid}`,
          );
          this.sessionPrepareService.warmInBackground(
            session.id,
            uid,
            aid,
          );
          inner = this.chatEvents.observeSession(session.id, uid).subscribe({
            next: (evt) => {
              subscriber.next({
                type: evt.event,
                data: serializeChatSseData(evt),
              });
            },
            error: (err: unknown) => subscriber.error(err),
            complete: () => subscriber.complete(),
          });
        })
        .catch((err: unknown) => {
          this.logger.warn(
            `chat SSE connect failed sessionId=${normalizedSessionId} userId=${uid}: ${
              err instanceof Error ? err.message : String(err)
            }`,
          );
          subscriber.error(err);
        });
      return () => {
        this.logger.debug(
          `chat SSE disconnected sessionId=${normalizedSessionId} userId=${uid} ownershipResolved=${ownershipResolved} durationMs=${Date.now() - connectedAt}`,
        );
        inner?.unsubscribe();
      };
    });
  }
}
