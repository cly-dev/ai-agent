export declare class CreateAgentDto {
    appClientId: number;
    name: string;
    systemPrompt: string;
    description?: string;
    toolIds?: number[];
    maxSteps?: number;
    enableToolCall?: boolean;
    restrictTools?: boolean;
    restrictHostTools?: boolean;
    restrictSkills?: boolean;
    config?: Record<string, unknown>;
}
