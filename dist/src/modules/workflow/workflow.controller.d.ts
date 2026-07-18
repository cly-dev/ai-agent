import { QueryWorkflowDto, QueryWorkflowRevisionsDto } from './dto/workflow.dto';
import { WorkflowService } from './workflow.service';
import type { WorkflowProfile } from '../../core/workflow/workflow.types';
export declare class WorkflowController {
    private readonly service;
    constructor(service: WorkflowService);
    listPresets(profile?: WorkflowProfile): Promise<import("../../core/workflow/workflow-preset.types").WorkflowPresetCatalogEntry[]>;
    findPage(appClientId: number, query: QueryWorkflowDto): Promise<import("../../common/pagination").PaginatedResult<import("./workflow.types").WorkflowListItem>>;
    findRevision(id: number, version: number): Promise<import("./workflow.types").WorkflowRevisionResponse>;
    listRevisions(id: number, query: QueryWorkflowRevisionsDto): Promise<import("./workflow.types").WorkflowRevisionResponse[] | import("./workflow.types").WorkflowRevisionSummaryResponse[]>;
    remove(id: number): Promise<{
        ok: true;
        id: number;
    }>;
    findOne(id: number): Promise<import("./workflow.types").WorkflowResponse>;
}
