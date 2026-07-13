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
exports.SessionResumeGateService = exports.resumeDecisionKeepsActiveTask = exports.goalStrategyFromResumeDecision = exports.defaultFreshResumeDecision = void 0;
const common_1 = require("@nestjs/common");
const turn_execution_contract_util_1 = require("../../agent-engine/engine/turn/turn-execution-contract.util");
const intent_kind_util_1 = require("../../agent-engine/intent-kind.util");
const smalltalk_hints_util_1 = require("../../intent/smalltalk-hints.util");
const session_goa_service_1 = require("../goa/session-goa.service");
const session_task_resume_followup_service_1 = require("./session-task-resume-followup.service");
const session_goa_types_1 = require("../goa/session-goa.types");
const session_resume_decision_types_1 = require("./session-resume-decision.types");
var session_resume_decision_types_2 = require("./session-resume-decision.types");
Object.defineProperty(exports, "defaultFreshResumeDecision", { enumerable: true, get: function () { return session_resume_decision_types_2.defaultFreshResumeDecision; } });
Object.defineProperty(exports, "goalStrategyFromResumeDecision", { enumerable: true, get: function () { return session_resume_decision_types_2.goalStrategyFromResumeDecision; } });
Object.defineProperty(exports, "resumeDecisionKeepsActiveTask", { enumerable: true, get: function () { return session_resume_decision_types_2.resumeDecisionKeepsActiveTask; } });
let SessionResumeGateService = class SessionResumeGateService {
    constructor(goaService, taskResumeFollowUp) {
        this.goaService = goaService;
        this.taskResumeFollowUp = taskResumeFollowUp;
    }
    async evaluate(input) {
        var _a;
        const activeTask = input.goa.activeTask;
        if ((0, session_goa_types_1.isActiveTaskAwaitingWriteConfirmation)(activeTask)) {
            await this.goaService.abandonActiveTask(input.sessionId);
            return { action: 'abandon_and_fresh' };
        }
        if ((activeTask === null || activeTask === void 0 ? void 0 : activeTask.status) === 'in_progress' &&
            !(0, turn_execution_contract_util_1.storedPlanCompatibleWithContract)(input.contract, activeTask.plan)) {
            await this.goaService.abandonActiveTask(input.sessionId);
            return { action: 'abandon_and_fresh' };
        }
        if (!activeTask) {
            return (0, session_resume_decision_types_1.defaultFreshResumeDecision)();
        }
        const resumeIntentKind = (0, intent_kind_util_1.detectIntentKind)(input.latestUserMessage, (0, smalltalk_hints_util_1.loadSmallTalkHints)());
        if (!this.goaService.shouldResumeTaskPlan(input.goa, resumeIntentKind)) {
            return {
                action: 'fresh',
                goalStrategy: 'use_turn_message',
                followUpReason: `intent_${resumeIntentKind}`,
            };
        }
        const followUp = await this.taskResumeFollowUp.classify({
            sessionId: input.sessionId,
            appClientId: input.appClientId,
            agentId: input.agentId,
            latestUserMessage: input.latestUserMessage,
            goa: input.goa,
        });
        if (!followUp) {
            return {
                action: 'fresh',
                goalStrategy: 'use_turn_message',
                followUpReason: 'follow_up_unavailable',
            };
        }
        const reason = typeof followUp.reason === 'string' ? followUp.reason : null;
        switch (followUp.decision) {
            case 'new_topic':
                await this.goaService.abandonActiveTask(input.sessionId);
                return { action: 'abandon_and_fresh' };
            case 'replan_same_goal':
                return {
                    action: 'fresh_same_goal',
                    followUpReason: reason,
                    goalStrategy: 'inherit_active_task',
                };
            case 'resume':
            default:
                return {
                    action: 'resume',
                    plan: activeTask.plan,
                    followUpReason: reason,
                    resumedFromRunId: activeTask.lastRunId,
                    workflowRun: (_a = activeTask.workflowRun) !== null && _a !== void 0 ? _a : null,
                    goalStrategy: 'inherit_active_task',
                };
        }
    }
};
SessionResumeGateService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [session_goa_service_1.SessionGoaService,
        session_task_resume_followup_service_1.SessionTaskResumeFollowUpService])
], SessionResumeGateService);
exports.SessionResumeGateService = SessionResumeGateService;
//# sourceMappingURL=session-resume-gate.service.js.map