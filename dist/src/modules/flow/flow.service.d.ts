import { type PaginatedResult } from '../../common/pagination';
import type { WorkflowProfile } from '../../core/workflow/workflow.types';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateFlowDto, MigrateFlowFromWorkflowDto, QueryFlowDto, UpdateFlowDto } from './dto/flow.dto';
import type { FlowListItem, FlowMigrationCandidate, FlowResponse, MigrateFlowFromWorkflowPreview, MigrateFlowFromWorkflowResponse } from './flow.types';
export declare class FlowService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateFlowDto): Promise<FlowResponse>;
    private prepareFlowCreate;
    private insertFlowRecord;
    listMigrationCandidates(input: {
        appClientId: number;
    }): Promise<{
        items: FlowMigrationCandidate[];
    }>;
    previewMigrateFromWorkflow(workflowId: number, flowKeyOverride?: string | null): Promise<MigrateFlowFromWorkflowPreview>;
    migrateFromWorkflow(workflowId: number, dto: MigrateFlowFromWorkflowDto): Promise<MigrateFlowFromWorkflowResponse>;
    update(id: number, dto: UpdateFlowDto): Promise<FlowResponse>;
    listPresets(profile?: WorkflowProfile): Promise<import("../../core/workflow/workflow-preset.types").WorkflowPresetCatalogEntry[]>;
    allocateIntentStateKeys(labels: readonly string[]): {
        keys: string[];
    };
    findOne(id: number): Promise<FlowResponse>;
    listRevisions(flowId: number, query?: {
        limit?: number;
        summary?: boolean;
    }): Promise<import('./flow.types').FlowRevisionResponse[] | import('./flow.types').FlowRevisionSummaryResponse[]>;
    findRevision(flowId: number, version: number): Promise<import('./flow.types').FlowRevisionResponse>;
    remove(id: number): Promise<{
        ok: true;
        id: number;
    }>;
    assertFlowReferenceCompatible(input: {
        flowId: number;
        appClientId: number;
    }): Promise<void>;
    assertSkillFlowBindingsCompatible(input: {
        flowId: number;
        appClientId: number;
        flowVersion?: number | null;
    }): Promise<void>;
    assertPageActionFlowBindingsCompatible(input: {
        flowId: number;
        appClientId: number;
        flowVersion?: number | null;
    }): Promise<void>;
    findPage(query: QueryFlowDto): Promise<PaginatedResult<FlowListItem>>;
    private legacyNodesFromIr;
    private assertFlowValid;
    private findEntityOrThrow;
    private assertAppClientExists;
    private normalizeToolBindings;
    private normalizeHostToolBindings;
    private assertBindingsExist;
}
