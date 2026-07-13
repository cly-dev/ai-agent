import { PrismaService } from '../../prisma/prisma.service';
import { ChatService } from '../chat/chat.service';
import type { UpsertMessageFeedbackDto } from './dto/message-feedback.dto';
import type { MessageFeedbackBatchResponse, MessageFeedbackView } from './message-feedback.types';
export declare class MessageFeedbackService {
    private readonly prisma;
    private readonly chatService;
    constructor(prisma: PrismaService, chatService: ChatService);
    upsertForMessage(input: {
        sessionId: string;
        messageId: number;
        userId: number;
        appClientId: number;
        dto: UpsertMessageFeedbackDto;
    }): Promise<MessageFeedbackView>;
    findForMessage(input: {
        sessionId: string;
        messageId: number;
        userId: number;
        appClientId: number;
    }): Promise<MessageFeedbackView | null>;
    listForSessionMessages(input: {
        sessionId: string;
        userId: number;
        appClientId: number;
        messageIds: number[];
    }): Promise<MessageFeedbackBatchResponse>;
    removeForMessage(input: {
        sessionId: string;
        messageId: number;
        userId: number;
        appClientId: number;
    }): Promise<void>;
    parseMessageIdsParam(raw: string): number[];
    private normalizeUpsertPayload;
    private toView;
}
