import { CreateWorkflowDto, QueryWorkflowDto, QueryWorkflowRevisionsDto, UpdateWorkflowDto } from './dto/workflow.dto';
import { WorkflowService } from './workflow.service';
import type { WorkflowProfile } from '../../core/workflow/workflow.types';
export declare class WorkflowController {
    private readonly service;
    constructor(service: WorkflowService);
    create(body: CreateWorkflowDto): Promise<import("./workflow.types").WorkflowResponse>;
    listPresets(profile?: WorkflowProfile): Promise<import("../../core/workflow/workflow-preset.types").WorkflowPresetCatalogEntry[]>;
    findPage(appClientId: number, query: QueryWorkflowDto): Promise<import("../../common/pagination").PaginatedResult<import("./workflow.types").WorkflowListItem>>;
    findRevision(id: number, version: number): Promise<import("./workflow.types").WorkflowRevisionResponse>;
    listRevisions(id: number, query: QueryWorkflowRevisionsDto): Promise<import("./workflow.types").WorkflowRevisionResponse[] | import("./workflow.types").WorkflowRevisionSummaryResponse[]>;
    update(id: number, body: UpdateWorkflowDto): Promise<import("./workflow.types").WorkflowResponse>;
    findOne(id: number): Promise<import("./workflow.types").WorkflowResponse>;
}
