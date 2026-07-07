import { MessageEvent } from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { ChatEventsService } from './chat-events.service';
import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { DeleteChatResponseDto } from './dto/delete-chat-response.dto';
import { CancelAgentRunDto, CancelAgentRunResponseDto } from './dto/cancel-agent-run.dto';
import { SessionRunStateResponseDto } from './dto/session-run-state.dto';
import { PrepareChatDto } from './dto/prepare-chat.dto';
import { PrepareChatResponseDto } from './dto/prepare-chat-response.dto';
import { QueryChatListDto } from './dto/query-chat-list.dto';
import { SessionPrepareService } from './session-prepare.service';
export declare class ChatController {
    private readonly chatService;
    private readonly chatEvents;
    private readonly sessionPrepareService;
    constructor(chatService: ChatService, chatEvents: ChatEventsService, sessionPrepareService: SessionPrepareService);
    private userId;
    private appClientId;
    private normalizeSessionId;
    create(req: Request & {
        user?: {
            userId?: number;
        };
    }, body: CreateChatDto): Promise<{
        sessionId: string;
        agent: {
            id: number;
            source: string;
            reason: string;
        };
    }>;
    listMessageFeedbackDownReasonTags(): {
        items: ({
            readonly key: "factual_error";
            readonly label: "事实错误或胡编";
        } | {
            readonly key: "misunderstood";
            readonly label: "没理解我的需求";
        } | {
            readonly key: "incomplete";
            readonly label: "回答不完整";
        } | {
            readonly key: "wrong_tool";
            readonly label: "工具或数据用错了";
        } | {
            readonly key: "format_bad";
            readonly label: "格式难读或展示有问题";
        } | {
            readonly key: "other";
            readonly label: "其他";
        })[];
    };
    findAll(req: Request & {
        user?: {
            userId?: number;
        };
    }, query: QueryChatListDto): Promise<import("../../common/pagination").PaginatedResult<{
        sessionId: string;
        title: string;
        agentId: number;
        createdAt: Date;
    }>>;
    prepare(req: Request & {
        user?: {
            userId?: number;
        };
    }, sessionId: string, body: PrepareChatDto): Promise<PrepareChatResponseDto>;
    findOne(req: Request & {
        user?: {
            userId?: number;
        };
    }, sessionId: string, query: QueryChatListDto): Promise<{
        sessionId: string;
        title: string;
        agentId: number;
        createdAt: Date;
        messages: import("../../common/pagination").PaginatedResult<{
            id: number;
            content: string;
            createdAt: Date;
            role: string;
            toolName: string;
            sessionId: string;
            toolInput: import("@prisma/client/runtime/client").JsonValue;
            toolOutput: import("@prisma/client/runtime/client").JsonValue;
            pageContextJson: import("@prisma/client/runtime/client").JsonValue;
        }>;
    }>;
    remove(req: Request & {
        user?: {
            userId?: number;
        };
    }, sessionId: string): Promise<DeleteChatResponseDto>;
    getRunState(req: Request & {
        user?: {
            userId?: number;
        };
    }, sessionId: string): Promise<SessionRunStateResponseDto>;
    cancelRun(req: Request & {
        user?: {
            userId?: number;
        };
    }, sessionId: string, body: CancelAgentRunDto): Promise<CancelAgentRunResponseDto>;
    stream(req: Request & {
        user?: {
            userId?: number;
        };
    }, sessionId: string): Observable<MessageEvent>;
}
