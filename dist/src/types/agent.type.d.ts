export interface AgentType {
    id?: number;
    appClientId: number;
    name: string;
    description?: string;
    systemPrompt: string;
    maxSteps: number;
    enableToolCall: boolean;
    config?: {
        memory?: {
            enabled: boolean;
            maxMessages: number;
        };
        fallbackReply?: string;
    };
    createdAt?: Date;
}
