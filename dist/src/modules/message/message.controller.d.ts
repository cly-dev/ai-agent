import { Request } from 'express';
import { QuerySessionMessageFeedbacksDto, UpsertMessageFeedbackDto } from './dto/message-feedback.dto';
import { SaveMessageDto } from './dto/save-message.dto';
import { MessageFeedbackService } from './message-feedback.service';
import { MessageService } from './message.service';
export declare class MessageController {
    private readonly service;
    private readonly feedbackService;
    constructor(service: MessageService, feedbackService: MessageFeedbackService);
    private userId;
    private appClientId;
    create(req: Request & {
        user?: {
            userId?: number;
        };
    }, sessionId: string, body: SaveMessageDto): Promise<{
        id: number;
        createdAt: Date;
        sessionId: string;
        role: string;
        content: string;
        toolName: string;
        toolInput: import("@prisma/client/runtime/client").JsonValue;
        toolOutput: import("@prisma/client/runtime/client").JsonValue;
        pageContextJson: import("@prisma/client/runtime/client").JsonValue;
    } & {
        runGeneration?: number;
    }>;
    listFeedbacks(req: Request & {
        user?: {
            userId?: number;
        };
    }, sessionId: string, query: QuerySessionMessageFeedbacksDto): Promise<import("./message-feedback.types").MessageFeedbackBatchResponse>;
    upsertFeedback(req: Request & {
        user?: {
            userId?: number;
        };
    }, sessionId: string, messageId: number, body: UpsertMessageFeedbackDto): Promise<import("./message-feedback.types").MessageFeedbackView>;
    getFeedback(req: Request & {
        user?: {
            userId?: number;
        };
    }, sessionId: string, messageId: number): Promise<import("./message-feedback.types").MessageFeedbackView>;
    removeFeedback(req: Request & {
        user?: {
            userId?: number;
        };
    }, sessionId: string, messageId: number): Promise<void>;
}
