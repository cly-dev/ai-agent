import { Body, Controller, Delete, Get, MessageEvent, Param, Post, Req, Sse, UnauthorizedException, UseGuards } from '@nestjs/common';
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
import { PrepareChatResponseDto } from './dto/prepare-chat-response.dto';
import { SessionPrepareService } from './session-prepare.service';

@ApiTags('chat')
@Controller('chat')
@UseGuards(UserJwtAuthGuard, AppClientDsnGuard)
@ApiBearerAuth()
@ApiSecurity('app-dsn')
export class ChatController {
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

  @Get()
  @ApiOperation({
    summary: '当前用户在当前 DSN 对应 AppClient 下的会话列表',
  })
  findAll(@Req() req: Request & { user?: { userId?: number } }) {
    return this.chatService.findAllForUser(
      this.userId(req),
      this.appClientId(req),
    );
  }

  @Post(':sessionId/prepare')
  @ApiOperation({
    summary: '预热会话：Agent runtime、权限内 tools、会话 history（Redis 5 分钟）',
  })
  @ApiParam({ name: 'sessionId', type: String, description: '会话 ID（32 位 hex）' })
  @ApiResponse({ status: 200, description: '预热完成', type: PrepareChatResponseDto })
  prepare(
    @Req() req: Request & { user?: { userId?: number } },
    @Param('sessionId') sessionId: string,
  ): Promise<PrepareChatResponseDto> {
    return this.sessionPrepareService.warm(
      this.normalizeSessionId(sessionId),
      this.userId(req),
      this.appClientId(req),
    );
  }

  @Get(':sessionId')
  @ApiOperation({ summary: '按 sessionId 获取会话详情（含历史消息）' })
  @ApiParam({ name: 'sessionId', type: String })
  findOne(
    @Req() req: Request & { user?: { userId?: number } },
    @Param('sessionId') sessionId: string,
  ) {
    return this.chatService.findOneForUser(
      this.normalizeSessionId(sessionId),
      this.userId(req),
      this.appClientId(req),
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
      void this.chatService
        .assertSessionOwnedByUser(normalizedSessionId, uid, aid)
        .then((session) => {
          this.sessionPrepareService.warmInBackground(
            session.id,
            uid,
            aid,
          );
          inner = this.chatEvents.observeSession(session.id).subscribe({
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
        .catch((err: unknown) => subscriber.error(err));
      return () => {
        inner?.unsubscribe();
      };
    });
  }
}
