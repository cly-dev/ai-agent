import { AgentRunRole, AgentRunStatus } from '../../../../generated/prisma/client';
export declare class CreateAgentRunDto {
    turnId?: number;
    agentId: number;
    sessionId: string;
    userId?: number;
    role?: AgentRunRole;
    sequence?: number;
    parentRunId?: number;
    input: string;
    output?: string;
    status?: AgentRunStatus;
    steps?: Record<string, unknown> | unknown[];
    currentStep?: number;
    maxSteps: number;
    error?: string;
    finishReason?: string;
}
