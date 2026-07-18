import { type PaginatedResult } from '../../common/pagination';
import type { WorkflowProfile } from '../../core/workflow/workflow.types';
import { PrismaService } from '../../prisma/prisma.service';
import type { QueryWorkflowDto } from './dto/workflow.dto';
import type { WorkflowListItem, WorkflowResponse, WorkflowRevisionResponse, WorkflowRevisionSummaryResponse } from './workflow.types';
export type WorkflowEntryKind = 'skill' | 'page_action';
export declare class WorkflowService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    listPresets(profile?: WorkflowProfile): Promise<import("../../core/workflow/workflow-preset.types").WorkflowPresetCatalogEntry[]>;
    findOne(id: number): Promise<WorkflowResponse>;
    remove(id: number): Promise<{
        ok: true;
        id: number;
    }>;
    findPage(query: QueryWorkflowDto): Promise<PaginatedResult<WorkflowListItem>>;
    listRevisions(workflowId: number, query?: {
        limit?: number;
        summary?: boolean;
    }): Promise<WorkflowRevisionResponse[] | WorkflowRevisionSummaryResponse[]>;
    findRevision(workflowId: number, version: number): Promise<WorkflowRevisionResponse>;
    assertWorkflowReferenceCompatible(input: {
        workflowId: number;
        appClientId: number;
        entry: WorkflowEntryKind;
    }): Promise<void>;
    assertSkillWorkflowBindingsCompatible(input: {
        workflowId: number;
        appClientId: number;
        workflowVersion?: number | null;
        skillToolIds: number[];
        skillHostToolIds: number[];
    }): Promise<void>;
    assertPageActionWorkflowBindingsCompatible(input: {
        workflowId: number;
        appClientId: number;
        workflowVersion?: number | null;
        pageActionHostToolId?: number | null;
    }): Promise<void>;
    private findEntityOrThrow;
}
