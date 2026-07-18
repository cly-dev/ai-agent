import { CreateFlowDto, MigrateFlowFromWorkflowDto, AllocateWorkflowIntentStateKeysDto, QueryFlowDto, QueryFlowPresetCatalogDto, QueryFlowRevisionsDto, UpdateFlowDto } from './dto/flow.dto';
import { FlowService } from './flow.service';
export declare class FlowController {
    private readonly service;
    constructor(service: FlowService);
    create(body: CreateFlowDto): Promise<import("./flow.types").FlowResponse>;
    allocateStateKeys(body: AllocateWorkflowIntentStateKeysDto): {
        keys: string[];
    };
    migrateFromWorkflow(workflowId: number, body: MigrateFlowFromWorkflowDto): Promise<import("./flow.types").MigrateFlowFromWorkflowResponse>;
    previewMigrateFromWorkflow(workflowId: number, flowKey?: string): Promise<import("./flow.types").MigrateFlowFromWorkflowPreview>;
    listMigrationCandidates(appClientId: number): Promise<{
        items: import("./flow.types").FlowMigrationCandidate[];
    }>;
    listPresets(query: QueryFlowPresetCatalogDto): Promise<import("../../core/workflow/workflow-preset.types").WorkflowPresetCatalogEntry[]>;
    findPage(appClientId: number, query: QueryFlowDto): Promise<import("../../common/pagination").PaginatedResult<import("./flow.types").FlowListItem>>;
    findRevision(id: number, version: number): Promise<import("./flow.types").FlowRevisionResponse>;
    listRevisions(id: number, query: QueryFlowRevisionsDto): Promise<import("./flow.types").FlowRevisionResponse[] | import("./flow.types").FlowRevisionSummaryResponse[]>;
    findOne(id: number): Promise<import("./flow.types").FlowResponse>;
    update(id: number, body: UpdateFlowDto): Promise<import("./flow.types").FlowResponse>;
    remove(id: number): Promise<{
        ok: true;
        id: number;
    }>;
}
