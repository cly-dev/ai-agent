import { type PaginatedResult } from '../../common/pagination';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAgentRunDto } from './dto/create-agent-run.dto';
import { QueryAgentRunDto } from './dto/query-agent-run.dto';
import { UpdateAgentRunDto } from './dto/update-agent-run.dto';
import { type AgentRunResponse } from './agent-run.types';
export declare class AgentRunService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getOpsMetrics(appClientId: number, days?: number): Promise<{
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
    create(appClientId: number, dto: CreateAgentRunDto): Promise<AgentRunResponse>;
    findPage(appClientId: number, query: QueryAgentRunDto): Promise<PaginatedResult<AgentRunResponse>>;
    findOne(appClientId: number, id: number): Promise<AgentRunResponse>;
    update(appClientId: number, id: number, dto: UpdateAgentRunDto): Promise<AgentRunResponse>;
    remove(appClientId: number, id: number): Promise<AgentRunResponse>;
    private buildWhere;
    private buildOrderBy;
    private assertAgentRunBelongsToApp;
    private assertAppClientExists;
    private assertAgentBelongsToApp;
    private assertTurnBelongsToApp;
    private extractSteps;
    private extractToolsUsedStats;
}
