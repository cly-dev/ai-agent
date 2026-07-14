export declare class CreateMessageDto {
    sessionId: string;
    role: string;
    content?: string | null;
    toolName?: string | null;
    toolInput?: Record<string, unknown>;
    toolOutput?: Record<string, unknown>;
}
