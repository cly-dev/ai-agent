import { PrismaService } from '../../prisma/prisma.service';
import type { UserRoleToolAccessContext } from '../../modules/agent/util/agent-client-access.util';
import { AgentToolCatalogService } from '../runtime-cache/agent-tool-catalog.service';
import type { WorkflowNodeDef } from '../workflow/workflow.types';
export type WorkflowTriggerPermissionCheckResult = {
    allowed: true;
    skipped: boolean;
} | {
    allowed: false;
    missingToolIds: number[];
    skipped: false;
};
export declare class ApprovalTriggerPermissionService {
    private readonly prisma;
    private readonly agentToolCatalog;
    constructor(prisma: PrismaService, agentToolCatalog: AgentToolCatalogService);
    resolveUserAllowedToolIds(input: {
        userId: number;
        appClientId: number;
        agentId: number;
    }): Promise<number[]>;
    resolveUserAllowedToolIdsForApp(input: {
        userId: number;
        appClientId: number;
    }): Promise<number[]>;
    resolveRoleToolContext(input: {
        userId: number;
        appClientId: number;
    }): Promise<UserRoleToolAccessContext | null>;
    evaluateForNodes(input: {
        nodes: WorkflowNodeDef[];
        allowedToolIds: Iterable<number>;
        enabled?: boolean;
    }): WorkflowTriggerPermissionCheckResult;
}
