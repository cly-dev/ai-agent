export declare const MESSAGE_FEEDBACK_DOWN_REASON_TAGS: readonly [{
    readonly key: "factual_error";
    readonly label: "事实错误或胡编";
}, {
    readonly key: "misunderstood";
    readonly label: "没理解我的需求";
}, {
    readonly key: "incomplete";
    readonly label: "回答不完整";
}, {
    readonly key: "wrong_tool";
    readonly label: "工具或数据用错了";
}, {
    readonly key: "format_bad";
    readonly label: "格式难读或展示有问题";
}, {
    readonly key: "other";
    readonly label: "其他";
}];
export type MessageFeedbackDownReasonTagKey = (typeof MESSAGE_FEEDBACK_DOWN_REASON_TAGS)[number]['key'];
export declare function isAllowedDownReasonTagKey(key: string): boolean;
export declare function normalizeDownReasonTags(tags: string[] | undefined | null): string[];
