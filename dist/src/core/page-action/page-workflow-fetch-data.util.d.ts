import type { PageWorkflowToolBundle } from './page-workflow-tool-bundle.util';
import type { PrismaService } from '../../prisma/prisma.service';
import type { AgentChatPageContext } from '../host-bridge/page-context.types';
import type { ToolEngineService } from '../tool-engine/tool-engine.service';
import type { FetchDataNodeInput } from '../workflow/workflow-node-input.types';
import type { PageActionRunStepRecorder } from './page-action-run-steps.util';
export type PageWorkflowFetchObservation = {
    name: string;
    output: unknown;
    args: Record<string, unknown>;
    toolId: number;
    toolName: string;
    agentMetadata: unknown;
};
export declare function executePageWorkflowFetchData(input: {
    prisma: PrismaService;
    toolEngine: ToolEngineService;
    userId: number;
    appClientId: number;
    nodeInput: FetchDataNodeInput;
    pageContext: AgentChatPageContext | null;
    stepRecorder?: PageActionRunStepRecorder;
    nodeId?: string;
    toolBundle?: PageWorkflowToolBundle | null;
}): Promise<PageWorkflowFetchObservation>;
