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
var SessionGoaReplayService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionGoaReplayService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("../../../../generated/prisma/client");
const prisma_service_1 = require("../../../prisma/prisma.service");
const session_goa_ledger_util_1 = require("./session-goa-ledger.util");
const session_goa_projection_util_1 = require("./session-goa-projection.util");
const session_goa_replay_util_1 = require("./session-goa-replay.util");
const session_goa_types_1 = require("./session-goa.types");
const EPISODE_GOAL_MAX = 200;
const EPISODE_OUTCOME_MAX = 400;
function truncate(value, max) {
    const trimmed = value.trim();
    if (trimmed.length <= max) {
        return trimmed;
    }
    return `${trimmed.slice(0, max)}…`;
}
function extractToolsFromSteps(steps) {
    if (!Array.isArray(steps)) {
        return [];
    }
    const names = new Set();
    for (const row of steps) {
        if (!row || typeof row !== 'object' || Array.isArray(row)) {
            continue;
        }
        const step = row;
        if (step.type !== 'tool') {
            continue;
        }
        if (typeof step.name === 'string' && step.name.trim()) {
            names.add(step.name.trim());
        }
    }
    return [...names];
}
function resolveReplayEpisodeStatus(input) {
    if (input.turnStatus === client_1.AgentRunStatus.failed) {
        return 'failed';
    }
    if (input.hasPlanStep || input.toolsUsed.length > 0) {
        return 'task';
    }
    return 'smalltalk';
}
function hasPlanStep(steps) {
    if (!Array.isArray(steps)) {
        return false;
    }
    return steps.some((row) => row &&
        typeof row === 'object' &&
        !Array.isArray(row) &&
        row.type === 'plan');
}
let SessionGoaReplayService = SessionGoaReplayService_1 = class SessionGoaReplayService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(SessionGoaReplayService_1.name);
    }
    async replay(sessionId) {
        var _a;
        const turns = await this.prisma.messageTurn.findMany({
            where: { sessionId },
            orderBy: { id: 'asc' },
            select: {
                id: true,
                userInput: true,
                finalOutput: true,
                status: true,
            },
        });
        if (turns.length === 0) {
            return null;
        }
        const runs = await this.prisma.agentRun.findMany({
            where: { sessionId },
            orderBy: { id: 'asc' },
            select: {
                id: true,
                turnId: true,
                steps: true,
                status: true,
                role: true,
                goaSnapshot: true,
            },
        });
        if (runs.length === 0) {
            return null;
        }
        const primaryRunByTurn = new Map();
        for (const run of runs) {
            if (run.role === client_1.AgentRunRole.primary) {
                primaryRunByTurn.set(run.turnId, run);
            }
        }
        let payload = (0, session_goa_types_1.createEmptySessionGoaPayload)(sessionId);
        let wroteEpisodes = false;
        for (const turn of turns) {
            const run = primaryRunByTurn.get(turn.id);
            if (!run) {
                continue;
            }
            const turnRuns = runs.filter((row) => row.turnId === turn.id);
            const toolsUsed = [
                ...new Set(turnRuns.flatMap((row) => extractToolsFromSteps(row.steps))),
            ];
            const planPresent = turnRuns.some((row) => hasPlanStep(row.steps));
            const outcome = typeof turn.finalOutput === 'string' ? turn.finalOutput : '';
            if (turn.status !== client_1.AgentRunStatus.success &&
                turn.status !== client_1.AgentRunStatus.failed) {
                continue;
            }
            if (!outcome.trim() && toolsUsed.length === 0 && !planPresent) {
                continue;
            }
            const episode = {
                turnId: turn.id,
                runId: run.id,
                goal: truncate(turn.userInput, EPISODE_GOAL_MAX),
                outcome: truncate(outcome, EPISODE_OUTCOME_MAX),
                status: resolveReplayEpisodeStatus({
                    turnStatus: turn.status,
                    toolsUsed,
                    hasPlanStep: planPresent,
                }),
                toolsUsed,
                artifactRefs: [],
                createdAt: new Date().toISOString(),
            };
            payload = Object.assign(Object.assign({}, payload), { recentEpisodes: (0, session_goa_projection_util_1.appendEpisodeFifo)(payload.recentEpisodes, episode) });
            wroteEpisodes = true;
        }
        const turnUserInputById = new Map(turns.map((turn) => [turn.id, turn.userInput]));
        const activeTask = (0, session_goa_replay_util_1.replayActiveTaskFromRuns)({
            runs: runs,
            turnUserInputById,
        });
        if (!wroteEpisodes && !activeTask) {
            return null;
        }
        let sessionObservationLedger = (_a = payload.sessionObservationLedger) !== null && _a !== void 0 ? _a : [];
        for (const run of runs) {
            sessionObservationLedger = (0, session_goa_ledger_util_1.appendSessionObservationLedger)(sessionObservationLedger, (0, session_goa_replay_util_1.extractObservationLogFromRunSteps)({
                turnId: run.turnId,
                runId: run.id,
                steps: run.steps,
            }));
        }
        payload = Object.assign(Object.assign({}, payload), { activeTask,
            sessionObservationLedger });
        this.logger.log(`replayed GOA from agent runs sessionId=${sessionId} episodes=${payload.recentEpisodes.length} activeTask=${activeTask != null}`);
        return payload;
    }
};
SessionGoaReplayService = SessionGoaReplayService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SessionGoaReplayService);
exports.SessionGoaReplayService = SessionGoaReplayService;
//# sourceMappingURL=session-goa-replay.service.js.map