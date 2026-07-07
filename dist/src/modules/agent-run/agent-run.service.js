"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentRunService = void 0;
const common_1 = require("@nestjs/common");
const pagination_1 = require("../../common/pagination");
const prisma_service_1 = require("../../prisma/prisma.service");
const agent_run_mapper_1 = require("./agent-run.mapper");
const agent_run_types_1 = require("./agent-run.types");
const agent_run_steps_util_1 = require("../../core/agent-engine/engine/main/run/agent-run-steps.util");
let AgentRunService = class AgentRunService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getOpsMetrics(appClientId, days = 7) {
        var _a;
        await this.assertAppClientExists(appClientId);
        const windowDays = Number.isFinite(days) && days > 0 ? Math.floor(days) : 7;
        const from = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);
        const to = new Date();
        const [turnCount, runs] = await this.prisma.$transaction([
            this.prisma.messageTurn.count({
                where: { appClientId, createdAt: { gte: from } },
            }),
            this.prisma.agentRun.findMany({
                where: { appClientId, createdAt: { gte: from } },
                select: {
                    turnId: true,
                    toolCallCount: true,
                    steps: true,
                    toolsUsed: true,
                },
            }),
        ]);
        let totalToolCalls = 0;
        let lowQuality = 0;
        let toolFailures = 0;
        let totalSteps = 0;
        const expandRetryTurnIds = new Set();
        const fallbackTurnIds = new Set();
        for (const run of runs) {
            totalToolCalls += (_a = run.toolCallCount) !== null && _a !== void 0 ? _a : 0;
            const parsed = this.extractToolsUsedStats(run.toolsUsed);
            lowQuality += parsed.quality.low;
            toolFailures +=
                parsed.codes.TOOL_AUTH_FAILED +
                    parsed.codes.TOOL_TIMEOUT +
                    parsed.codes.TOOL_EMPTY_RESULT +
                    parsed.codes.TOOL_DOWNSTREAM_ERROR;
            const hasFallback = parsed.codes.TOOL_AUTH_FAILED > 0 ||
                parsed.codes.TOOL_TIMEOUT > 0 ||
                parsed.codes.TOOL_EMPTY_RESULT > 0 ||
                parsed.codes.TOOL_DOWNSTREAM_ERROR > 0 ||
                parsed.codes.LLM_TIMEOUT > 0 ||
                parsed.codes.LLM_RATE_LIMIT > 0;
            if (hasFallback && run.turnId != null) {
                fallbackTurnIds.add(run.turnId);
            }
            const steps = this.extractSteps(run.steps);
            totalSteps += steps.length;
            const expanded = steps.some((step) => {
                if (!step || typeof step !== 'object' || Array.isArray(step)) {
                    return false;
                }
                const row = step;
                const output = row.output;
                if (!output || typeof output !== 'object' || Array.isArray(output)) {
                    return false;
                }
                return (output.fallbackReason ===
                    'low_quality_first_result_expand_once');
            });
            if (expanded && run.turnId != null) {
                expandRetryTurnIds.add(run.turnId);
            }
        }
        const safeTurnCount = Math.max(1, turnCount);
        const safeToolCalls = Math.max(1, totalToolCalls);
        return {
            windowDays,
            from: from.toISOString(),
            to: to.toISOString(),
            totals: {
                turns: turnCount,
                runs: runs.length,
                toolCalls: totalToolCalls,
                lowQualityObservations: lowQuality,
                intentExpandRetries: expandRetryTurnIds.size,
                fallbackReplies: fallbackTurnIds.size,
            },
            rates: {
                toolSuccessRate: Number(((totalToolCalls - toolFailures) / safeToolCalls).toFixed(4)),
                lowQualityObservationRate: Number((lowQuality / safeToolCalls).toFixed(4)),
                intentExpandRetryRate: Number((expandRetryTurnIds.size / safeTurnCount).toFixed(4)),
                avgStepsPerTurn: Number((totalSteps / safeTurnCount).toFixed(4)),
                fallbackReplyRate: Number((fallbackTurnIds.size / safeTurnCount).toFixed(4)),
            },
        };
    }
    async create(appClientId, dto) {
        var _a, _b, _c, _d, _e, _f, _g;
        await this.assertAppClientExists(appClientId);
        await this.assertAgentBelongsToApp(dto.agentId, appClientId);
        if (dto.turnId != null) {
            await this.assertTurnBelongsToApp(dto.turnId, appClientId);
        }
        const row = await this.prisma.agentRun.create({
            data: {
                turnId: (_a = dto.turnId) !== null && _a !== void 0 ? _a : null,
                agentId: dto.agentId,
                appClientId,
                sessionId: dto.sessionId,
                userId: (_b = dto.userId) !== null && _b !== void 0 ? _b : null,
                role: dto.role,
                sequence: dto.sequence,
                parentRunId: (_c = dto.parentRunId) !== null && _c !== void 0 ? _c : null,
                input: dto.input,
                output: (_d = dto.output) !== null && _d !== void 0 ? _d : null,
                status: dto.status,
                steps: ((_e = dto.steps) !== null && _e !== void 0 ? _e : []),
                currentStep: dto.currentStep,
                maxSteps: dto.maxSteps,
                error: (_f = dto.error) !== null && _f !== void 0 ? _f : null,
                finishReason: (_g = dto.finishReason) !== null && _g !== void 0 ? _g : null,
            },
            include: agent_run_types_1.AGENT_RUN_DETAIL_INCLUDE,
        });
        return (0, agent_run_mapper_1.toAgentRunResponse)(row);
    }
    async findPage(appClientId, query) {
        await this.assertAppClientExists(appClientId);
        const { page, pageSize, skip, take } = (0, pagination_1.resolvePagination)(query.page, query.pageSize);
        const where = this.buildWhere(appClientId, query);
        const orderBy = this.buildOrderBy(query.orderBy, query.order);
        const [rows, total] = await this.prisma.$transaction([
            this.prisma.agentRun.findMany({
                where,
                orderBy,
                skip,
                take,
                include: agent_run_types_1.AGENT_RUN_DETAIL_INCLUDE,
            }),
            this.prisma.agentRun.count({ where }),
        ]);
        return (0, pagination_1.toPaginatedResult)((0, agent_run_mapper_1.toAgentRunResponseList)(rows), total, page, pageSize);
    }
    async findOne(appClientId, id) {
        await this.assertAppClientExists(appClientId);
        const row = await this.prisma.agentRun.findFirst({
            where: { id, appClientId },
            include: agent_run_types_1.AGENT_RUN_DETAIL_INCLUDE,
        });
        if (!row) {
            throw new common_1.NotFoundException(`agentRun ${id} not found under appClient ${appClientId}`);
        }
        const response = (0, agent_run_mapper_1.toAgentRunResponse)(row);
        if (row.turnId == null) {
            return response;
        }
        const turnRuns = await this.prisma.agentRun.findMany({
            where: { turnId: row.turnId, appClientId },
            orderBy: [{ sequence: 'asc' }, { id: 'asc' }],
            select: {
                id: true,
                role: true,
                sequence: true,
                steps: true,
            },
        });
        return Object.assign(Object.assign({}, response), { turnExecutionTimeline: (0, agent_run_steps_util_1.mergeTurnExecutionSteps)(turnRuns.map((run) => ({
                runId: run.id,
                role: run.role,
                sequence: run.sequence,
                steps: (0, agent_run_steps_util_1.parseAgentRunSteps)(run.steps),
            }))) });
    }
    async update(appClientId, id, dto) {
        await this.assertAgentRunBelongsToApp(id, appClientId);
        if (dto.agentId != null) {
            await this.assertAgentBelongsToApp(dto.agentId, appClientId);
        }
        if (dto.turnId != null) {
            await this.assertTurnBelongsToApp(dto.turnId, appClientId);
        }
        const row = await this.prisma.agentRun.update({
            where: { id },
            data: {
                turnId: dto.turnId,
                agentId: dto.agentId,
                sessionId: dto.sessionId,
                userId: dto.userId,
                role: dto.role,
                sequence: dto.sequence,
                parentRunId: dto.parentRunId,
                input: dto.input,
                output: dto.output,
                status: dto.status,
                steps: dto.steps === undefined
                    ? undefined
                    : dto.steps,
                currentStep: dto.currentStep,
                maxSteps: dto.maxSteps,
                error: dto.error,
                finishReason: dto.finishReason,
            },
            include: agent_run_types_1.AGENT_RUN_DETAIL_INCLUDE,
        });
        return (0, agent_run_mapper_1.toAgentRunResponse)(row);
    }
    async remove(appClientId, id) {
        const row = await this.findOne(appClientId, id);
        await this.prisma.agentRun.delete({ where: { id } });
        return row;
    }
    buildWhere(appClientId, query) {
        var _a, _b, _c;
        const where = { appClientId };
        if (query.id != null) {
            where.id = query.id;
        }
        if (query.turnId != null) {
            where.turnId = query.turnId;
        }
        if (query.agentId != null) {
            where.agentId = query.agentId;
        }
        if ((_a = query.sessionId) === null || _a === void 0 ? void 0 : _a.trim()) {
            where.sessionId = query.sessionId.trim();
        }
        if (query.userId != null) {
            where.userId = query.userId;
        }
        if (query.role != null) {
            where.role = query.role;
        }
        if (query.status != null) {
            where.status = query.status;
        }
        if ((_b = query.input) === null || _b === void 0 ? void 0 : _b.trim()) {
            where.input = { contains: query.input.trim(), mode: 'insensitive' };
        }
        if ((_c = query.keyword) === null || _c === void 0 ? void 0 : _c.trim()) {
            const keyword = query.keyword.trim();
            where.OR = [
                { input: { contains: keyword, mode: 'insensitive' } },
                { output: { contains: keyword, mode: 'insensitive' } },
                { error: { contains: keyword, mode: 'insensitive' } },
            ];
        }
        if (query.minLowQualityCount != null) {
            where.AND = [
                ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
                {
                    toolsUsed: {
                        path: ['qualityCounts', 'low'],
                        gte: query.minLowQualityCount,
                    },
                },
            ];
        }
        return where;
    }
    buildOrderBy(orderBy, order) {
        const direction = (0, pagination_1.resolveSortOrder)(order);
        switch (orderBy !== null && orderBy !== void 0 ? orderBy : 'id') {
            case 'sequence':
                return { sequence: direction };
            case 'createdAt':
                return { createdAt: direction };
            case 'updatedAt':
                return { updatedAt: direction };
            case 'startedAt':
                return { startedAt: direction };
            case 'finishedAt':
                return { finishedAt: direction };
            case 'durationMs':
                return { durationMs: direction };
            case 'totalTokens':
                return { totalTokens: direction };
            case 'id':
            default:
                return { id: direction };
        }
    }
    async assertAgentRunBelongsToApp(id, appClientId) {
        await this.assertAppClientExists(appClientId);
        const row = await this.prisma.agentRun.findFirst({
            where: { id, appClientId },
            select: { id: true },
        });
        if (!row) {
            throw new common_1.NotFoundException(`agentRun ${id} not found under appClient ${appClientId}`);
        }
    }
    async assertAppClientExists(appClientId) {
        const row = await this.prisma.appClient.findUnique({
            where: { id: appClientId },
            select: { id: true },
        });
        if (!row) {
            throw new common_1.BadRequestException(`appClient ${appClientId} not found`);
        }
    }
    async assertAgentBelongsToApp(agentId, appClientId) {
        const row = await this.prisma.agent.findFirst({
            where: { id: agentId, appClientId },
            select: { id: true },
        });
        if (!row) {
            throw new common_1.BadRequestException(`agent ${agentId} not found under appClient ${appClientId}`);
        }
    }
    async assertTurnBelongsToApp(turnId, appClientId) {
        const row = await this.prisma.messageTurn.findFirst({
            where: { id: turnId, appClientId },
            select: { id: true },
        });
        if (!row) {
            throw new common_1.BadRequestException(`messageTurn ${turnId} not found under appClient ${appClientId}`);
        }
    }
    extractSteps(value) {
        return Array.isArray(value) ? value : [];
    }
    extractToolsUsedStats(value) {
        var _a, _b;
        const asInt = (v) => typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0;
        if (!value || typeof value !== 'object' || Array.isArray(value)) {
            return {
                quality: { high: 0, medium: 0, low: 0 },
                codes: {
                    INTENT_RECALL_FAILED: 0,
                    TOOL_AUTH_FAILED: 0,
                    TOOL_TIMEOUT: 0,
                    TOOL_EMPTY_RESULT: 0,
                    TOOL_DOWNSTREAM_ERROR: 0,
                    LLM_TIMEOUT: 0,
                    LLM_RATE_LIMIT: 0,
                },
            };
        }
        const row = value;
        const q = (_a = row.qualityCounts) !== null && _a !== void 0 ? _a : {};
        const c = (_b = row.codeCounts) !== null && _b !== void 0 ? _b : {};
        return {
            quality: {
                high: asInt(q.high),
                medium: asInt(q.medium),
                low: asInt(q.low),
            },
            codes: {
                INTENT_RECALL_FAILED: asInt(c.INTENT_RECALL_FAILED),
                TOOL_AUTH_FAILED: asInt(c.TOOL_AUTH_FAILED),
                TOOL_TIMEOUT: asInt(c.TOOL_TIMEOUT),
                TOOL_EMPTY_RESULT: asInt(c.TOOL_EMPTY_RESULT),
                TOOL_DOWNSTREAM_ERROR: asInt(c.TOOL_DOWNSTREAM_ERROR),
                LLM_TIMEOUT: asInt(c.LLM_TIMEOUT),
                LLM_RATE_LIMIT: asInt(c.LLM_RATE_LIMIT),
            },
        };
    }
};
AgentRunService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AgentRunService);
exports.AgentRunService = AgentRunService;
//# sourceMappingURL=agent-run.service.js.map