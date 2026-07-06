export type OmnixErrorBody = {
    code: string;
    message: string;
    details?: Record<string, unknown>;
};
export declare const OMNIX_ERROR_CODES: {
    readonly UNAUTHORIZED: "UNAUTHORIZED";
    readonly FORBIDDEN: "FORBIDDEN";
    readonly NOT_FOUND: "NOT_FOUND";
    readonly VALIDATION_FAILED: "VALIDATION_FAILED";
    readonly CONFIG_REVISION_STALE: "CONFIG_REVISION_STALE";
    readonly RUN_NOT_FOUND: "RUN_NOT_FOUND";
    readonly RUN_CANCELLED: "RUN_CANCELLED";
};
