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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AgentRunLauncher_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentRunLauncher = void 0;
const common_1 = require("@nestjs/common");
const agent_engine_service_1 = require("../agent-engine/engine/agent-engine.service");
const agent_run_user_messages_util_1 = require("../agent-engine/engine/agent-run-user-messages.util");
const run_aborted_error_1 = require("./run-aborted.error");
let AgentRunLauncher = AgentRunLauncher_1 = class AgentRunLauncher {
    constructor(agentEngine, runSse) {
        this.agentEngine = agentEngine;
        this.runSse = runSse;
        this.logger = new common_1.Logger(AgentRunLauncher_1.name);
    }
    async execute(job, scope) {
        var _a, _b, _c;
        if (job.kind === 'write_cancel') {
            await this.agentEngine.cancelPendingWriteConfirmation(job.userId, job.sessionId);
            return;
        }
        const content = job.input.trim();
        if (job.kind === 'chat_turn' && !content) {
            return;
        }
        try {
            const run = job.kind === 'write_confirm'
                ? await this.agentEngine.resumeAfterWriteConfirm({
                    userId: job.userId,
                    sessionId: job.sessionId,
                    userMessageId: job.userMessageId,
                    pageContext: (_a = job.pageContext) !== null && _a !== void 0 ? _a : null,
                }, scope)
                : await this.agentEngine.run({
                    userId: job.userId,
                    sessionId: job.sessionId,
                    input: content,
                    userMessageId: job.userMessageId,
                    requestedSkillId: job.requestedSkillId,
                    pageContext: (_b = job.pageContext) !== null && _b !== void 0 ? _b : null,
                }, scope);
            if (!run) {
                if (job.kind === 'write_confirm') {
                    return;
                }
                this.runSse.emitRunError(scope.sessionId, {
                    message: '当前会话未绑定 Agent，无法执行智能回复。请确认 agentId=1 存在且属于当前 AppClient。',
                    code: 'NO_AGENT',
                    generation: scope.generation,
                });
            }
        }
        catch (error) {
            if ((0, run_aborted_error_1.isAgentRunAbortedError)(error)) {
                return;
            }
            const userMessage = (0, agent_run_user_messages_util_1.resolveAgentRunFailureUserMessage)(error);
            if (userMessage == null) {
                throw error;
            }
            this.logger.warn(`agent run failed for sessionId=${job.sessionId}: ${error instanceof Error ? error.message : String(error)}`);
            this.runSse.emitRunError(scope.sessionId, {
                message: userMessage,
                code: (_c = (0, agent_run_user_messages_util_1.resolveAgentRunFailureCode)(error)) !== null && _c !== void 0 ? _c : 'LLM_TIMEOUT',
                generation: scope.generation,
            });
        }
    }
};
AgentRunLauncher = AgentRunLauncher_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)((0, common_1.forwardRef)(() => agent_engine_service_1.AgentEngineService))),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => require('./agent-run-sse.gateway').AgentRunSseGateway))),
    __metadata("design:paramtypes", [agent_engine_service_1.AgentEngineService, Function])
], AgentRunLauncher);
exports.AgentRunLauncher = AgentRunLauncher;
//# sourceMappingURL=agent-run-launcher.service.js.map