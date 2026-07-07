declare const FEEDBACK_RATINGS: readonly ["up", "down"];
export declare class UpsertMessageFeedbackDto {
    rating: (typeof FEEDBACK_RATINGS)[number];
    reasonTags?: string[];
    comment?: string;
}
export declare class QuerySessionMessageFeedbacksDto {
    messageIds: string;
}
export {};
