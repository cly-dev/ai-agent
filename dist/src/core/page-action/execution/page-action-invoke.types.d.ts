import type { PageActionRunStatus } from '../../../../generated/prisma/client';
export type PageActionInvokeAccepted = {
    runId: number;
    generation: number;
    clientActionId: string | null;
    pageActionKey: string;
    streamUrl: string;
    status: PageActionRunStatus;
};
export type PageActionInvokeConflict = {
    code: 'PAGE_ACTION_ALREADY_ACTIVE';
    message: string;
    pageActionKey: string;
    existingRunId: number;
    existingStatus: PageActionRunStatus;
    approvalRequestId: number | null;
    streamUrl: string;
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
    pageActionKey: string;
    clientActionId: string | null;
    pageActionConfig: unknown;
    hostToolResolved: import('../page-action-host-tool.util').ResolvedPageActionHostTool | null;
};
