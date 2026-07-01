import type { PrismaService } from '../../prisma/prisma.service';
import type { AgentGraphNodeBundle } from '../agent-engine/engine/main/agent-graph/types/graph.types';
import type { AgentGraphState } from '../agent-engine/engine/main/types/agent-engine.types';
import { type LoadedWorkflowForRun, type WorkflowLoadFailureReason } from './load-workflow-definition.util';
export type SkillWorkflowInitResolution = {
    kind: 'no_workflow_binding';
} | {
    kind: 'loaded';
    workflow: LoadedWorkflowForRun;
} | {
    kind: 'scope_incompatible';
    workflowId: number;
} | {
    kind: 'load_failed';
    workflowId: number;
    reason: Exclude<WorkflowLoadFailureReason, 'scope_incompatible'>;
};
export declare function resolveWorkflowBoundSkillId(bundle: AgentGraphNodeBundle, state: AgentGraphState): number | null;
export declare function resolveSkillWorkflowForInit(prisma: PrismaService, input: {
    skillId: number;
    appClientId: number;
    scope: {
        allowedToolIds: number[];
        allowedHostToolIds: number[];
    };
}): Promise<SkillWorkflowInitResolution>;
