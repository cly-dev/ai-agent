import { AgentRunRole, AgentRunStatus } from '../../../../generated/prisma/client';
export declare class UpdateAgentRunDto {
    turnId?: number | null;
    agentId?: number;
    sessionId?: string;
    userId?: number | null;
    role?: AgentRunRole;
    sequence?: number;
    parentRunId?: number | null;
    input?: string;
    output?: string | null;
    status?: AgentRunStatus;
    steps?: Record<string, unknown> | unknown[];
    currentStep?: number;
    maxSteps?: number;
    error?: string | null;
    finishReason?: string | null;
}
