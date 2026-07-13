export type AgentRuntimeSnapshot = {
    id: number;
    appClientId: number;
    name: string;
    systemPrompt: string;
    maxSteps: number;
    enableToolCall: boolean;
    config: unknown;
};
