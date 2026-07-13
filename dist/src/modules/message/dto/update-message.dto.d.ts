export declare class UpdateMessageDto {
    role?: string;
    content?: string;
    toolName?: string | null;
    toolInput?: Record<string, unknown>;
    toolOutput?: Record<string, unknown>;
}
