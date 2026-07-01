import { QueryMessageFeedbackAdminDto } from './dto/query-message-feedback-admin.dto';
import { MessageFeedbackAdminService } from './message-feedback-admin.service';
export declare class MessageFeedbackAdminController {
    private readonly service;
    constructor(service: MessageFeedbackAdminService);
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
    getSummary(appClientId: number, days?: string): Promise<import("./message-feedback-admin.types").MessageFeedbackAdminSummary>;
    findPageBySession(appClientId: number, sessionId: string, query: QueryMessageFeedbackAdminDto): Promise<import("../../common/pagination").PaginatedResult<import("./message-feedback-admin.types").MessageFeedbackAdminListItem>>;
    findPage(appClientId: number, query: QueryMessageFeedbackAdminDto): Promise<import("../../common/pagination").PaginatedResult<import("./message-feedback-admin.types").MessageFeedbackAdminListItem>>;
    findOne(appClientId: number, id: number): Promise<import("./message-feedback-admin.types").MessageFeedbackAdminListItem>;
}
