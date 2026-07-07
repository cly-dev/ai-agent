import { AgentRunService } from './agent-run.service';
import { CreateAgentRunDto } from './dto/create-agent-run.dto';
import { QueryAgentRunDto } from './dto/query-agent-run.dto';
import { UpdateAgentRunDto } from './dto/update-agent-run.dto';
export declare class AgentRunController {
    private readonly service;
    constructor(service: AgentRunService);
    create(appClientId: number, body: CreateAgentRunDto): Promise<import("./agent-run.types").AgentRunResponse>;
    findPage(appClientId: number, query: QueryAgentRunDto): Promise<import("../../common/pagination").PaginatedResult<import("./agent-run.types").AgentRunResponse>>;
    getOpsMetrics(appClientId: number, days?: string): Promise<{
        windowDays: number;
        from: string;
        to: string;
        totals: {
            turns: number;
            runs: number;
            toolCalls: number;
            lowQualityObservations: number;
            intentExpandRetries: number;
            fallbackReplies: number;
        };
        rates: {
            toolSuccessRate: number;
            lowQualityObservationRate: number;
            intentExpandRetryRate: number;
            avgStepsPerTurn: number;
            fallbackReplyRate: number;
        };
    }>;
    findOne(appClientId: number, id: number): Promise<import("./agent-run.types").AgentRunResponse>;
    update(appClientId: number, id: number, body: UpdateAgentRunDto): Promise<import("./agent-run.types").AgentRunResponse>;
    remove(appClientId: number, id: number): Promise<import("./agent-run.types").AgentRunResponse>;
}
