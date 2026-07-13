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
var SessionTaskResumeFollowUpService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionTaskResumeFollowUpService = exports.taskResumeFollowUpDecisionSchema = exports.taskResumeFollowUpSchema = void 0;
const common_1 = require("@nestjs/common");
const llm_service_1 = require("../../llm/llm.service");
const prompt_template_keys_1 = require("../../prompt/prompt-template.keys");
const prompt_registry_service_1 = require("../../prompt/prompt-registry.service");
const session_goa_projection_util_1 = require("../goa/session-goa-projection.util");
const workflow_goa_projection_util_1 = require("../../workflow/workflow-goa-projection.util");
const session_goa_types_1 = require("../goa/session-goa.types");
const session_resume_followup_util_1 = require("./session-resume-followup.util");
var session_resume_followup_util_2 = require("./session-resume-followup.util");
Object.defineProperty(exports, "taskResumeFollowUpSchema", { enumerable: true, get: function () { return session_resume_followup_util_2.taskResumeFollowUpSchema; } });
Object.defineProperty(exports, "taskResumeFollowUpDecisionSchema", { enumerable: true, get: function () { return session_resume_followup_util_2.taskResumeFollowUpDecisionSchema; } });
let SessionTaskResumeFollowUpService = SessionTaskResumeFollowUpService_1 = class SessionTaskResumeFollowUpService {
    constructor(llmService, promptRegistry) {
        this.llmService = llmService;
        this.promptRegistry = promptRegistry;
        this.logger = new common_1.Logger(SessionTaskResumeFollowUpService_1.name);
    }
    async classify(input) {
        const activeTask = input.goa.activeTask;
        if (!(0, session_goa_types_1.isActiveTaskChatResumable)(activeTask)) {
            return null;
        }
        const task = activeTask;
        const scope = {
            appClientId: input.appClientId,
            agentId: input.agentId,
        };
        const systemPrompt = await this.promptRegistry.render(prompt_template_keys_1.PROMPT_KEYS.AGENT_TASK_RESUME_FOLLOWUP, scope);
        const pendingSteps = task.stepProgress
            .filter((step) => step.status === 'pending' || step.status === 'running')
            .map((step) => `${step.stepId}(${step.phase}/${step.kind})`)
            .join(', ');
        const episodeHint = (0, session_goa_projection_util_1.formatGoaContextHint)(input.goa.recentEpisodes, task);
        const workflowHint = task.workflowRun != null
            ? (0, workflow_goa_projection_util_1.formatWorkflowRunPendingSummary)(task.workflowRun)
            : '';
        const userContent = [
            `Active task goal: ${task.plan.goal}`,
            `Original request: ${task.plan.originalUserRequest}`,
            `Deliverable: ${task.plan.deliverable}`,
            `Pending/running steps: ${pendingSteps || 'none'}`,
            ...(workflowHint ? [`Workflow state: ${workflowHint}`] : []),
            episodeHint ? `Session memory: ${episodeHint}` : '',
            `Latest user message: ${input.latestUserMessage.trim()}`,
        ]
            .filter((line) => line.length > 0)
            .join('\n');
        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent },
        ];
        try {
            const { model, messages: fittedMessages } = await this.llmService.createLangChainChatModelForMessages(messages, {
                budgetHints: { callKind: 'routing' },
            });
            const structured = await model
                .withStructuredOutput(session_resume_followup_util_1.taskResumeFollowUpSchema)
                .invoke(fittedMessages);
            return (0, session_resume_followup_util_1.parseTaskResumeFollowUpDecision)(structured);
        }
        catch (error) {
            this.logger.warn(`task resume follow-up classify failed sessionId=${input.sessionId}: ${error instanceof Error ? error.message : String(error)}`);
            return (0, session_resume_followup_util_1.fallbackTaskResumeFollowUpDecision)({
                hasPendingOrRunningSteps: task.stepProgress.some((step) => step.status === 'pending' || step.status === 'running'),
            });
        }
    }
};
SessionTaskResumeFollowUpService = SessionTaskResumeFollowUpService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [llm_service_1.LlmService,
        prompt_registry_service_1.PromptRegistryService])
], SessionTaskResumeFollowUpService);
exports.SessionTaskResumeFollowUpService = SessionTaskResumeFollowUpService;
//# sourceMappingURL=session-task-resume-followup.service.js.map