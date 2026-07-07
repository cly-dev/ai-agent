import type { PageActionRunStatus } from '../../../../generated/prisma/client';
export type PageActionInvokeAccepted = {
    runId: number;
    generation: number;
    clientActionId: string | null;
    streamUrl: string;
    status: PageActionRunStatus;
};
export type PageActionRunExecutionInput = {
    runId: number;
    generation: number;
    userId: number;
    appClientId: number;
    pageActionId: number;
    actionKey: string;
    workflowId: number | null;
    workflowVersion: number | null;
    workflowOverrides: unknown;
    systemPrompt: string;
    instruction: string | null;
    context: Record<string, unknown> | null | undefined;
    pageContext: import('../../host-bridge/page-context.types').AgentChatPageContext | null;
    clientActionId: string | null;
    pageActionConfig: unknown;
    hostToolResolved: import('../page-action-host-tool.util').ResolvedPageActionHostTool | null;
};
