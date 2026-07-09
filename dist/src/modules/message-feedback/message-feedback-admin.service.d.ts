import { type PaginatedResult } from '../../common/pagination';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryMessageFeedbackAdminDto } from './dto/query-message-feedback-admin.dto';
import { type MessageFeedbackAdminListItem, type MessageFeedbackAdminSummary } from './message-feedback-admin.types';
export declare class MessageFeedbackAdminService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    listDownReasonTags(): {
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
    findPage(appClientId: number, query: QueryMessageFeedbackAdminDto): Promise<PaginatedResult<MessageFeedbackAdminListItem>>;
    findPageBySession(appClientId: number, sessionId: string, query: QueryMessageFeedbackAdminDto): Promise<PaginatedResult<MessageFeedbackAdminListItem>>;
    findOne(appClientId: number, id: number): Promise<MessageFeedbackAdminListItem>;
    getSummary(appClientId: number, days?: number): Promise<MessageFeedbackAdminSummary>;
    private buildWhere;
    private buildOrderBy;
    private loadAgentNames;
    private assertAppClientExists;
}
