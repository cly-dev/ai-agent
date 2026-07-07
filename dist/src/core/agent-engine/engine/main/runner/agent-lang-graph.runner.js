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
var AgentLangGraphRunner_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentLangGraphRunner = void 0;
const common_1 = require("@nestjs/common");
const llm_service_1 = require("../../../../llm/llm.service");
const tool_engine_service_1 = require("../../../../tool-engine/tool-engine.service");
const prompt_registry_service_1 = require("../../../../prompt/prompt-registry.service");
const prisma_service_1 = require("../../../../../prisma/prisma.service");
const pending_write_confirmation_store_1 = require("../../../../../modules/chat/pending-write-confirmation.store");
const session_goa_service_1 = require("../../../../memory/goa/session-goa.service");
const session_resume_gate_service_1 = require("../../../../memory/resume/session-resume-gate.service");
const category_intent_recall_service_1 = require("../../../../intent/category-intent-recall.service");
const agent_run_sse_emitter_1 = require("../run/agent-run-sse.emitter");
const agent_run_sse_gateway_1 = require("../../../../session-run/agent-run-sse.gateway");
const session_run_coordinator_service_1 = require("../../../../session-run/session-run-coordinator.service");
const run_assistant_artifact_store_1 = require("../run/run-assistant-artifact.store");
const agent_session_scope_service_1 = require("../session/agent-session-scope.service");
const skill_service_1 = require("../../../../skill/skill.service");
const requested_skill_run_service_1 = require("../skill/requested-skill-run.service");
const host_tool_service_1 = require("../../../../../modules/host-tool/host-tool.service");
const run_scope_cache_service_1 = require("../../../../runtime-cache/run-scope-cache.service");
const approval_trigger_permission_service_1 = require("../../../../approval/approval-trigger-permission.service");
const agent_graph_1 = require("../agent-graph");
let AgentLangGraphRunner = AgentLangGraphRunner_1 = class AgentLangGraphRunner {
    constructor(prisma, llmService, promptRegistry, toolEngine, sse, sessionRunCoordinator, runSseGateway, assistantArtifact, goaService, resumeGate, categoryIntentRecall, pendingWriteConfirmationStore, sessionScope, skillService, requestedSkillRun, hostToolService, runScopeCache, approvalTriggerPermission) {
        this.prisma = prisma;
        this.llmService = llmService;
        this.promptRegistry = promptRegistry;
        this.toolEngine = toolEngine;
        this.sse = sse;
        this.sessionRunCoordinator = sessionRunCoordinator;
        this.runSseGateway = runSseGateway;
        this.assistantArtifact = assistantArtifact;
        this.goaService = goaService;
        this.resumeGate = resumeGate;
        this.categoryIntentRecall = categoryIntentRecall;
        this.pendingWriteConfirmationStore = pendingWriteConfirmationStore;
        this.sessionScope = sessionScope;
        this.skillService = skillService;
        this.requestedSkillRun = requestedSkillRun;
        this.hostToolService = hostToolService;
        this.runScopeCache = runScopeCache;
        this.approvalTriggerPermission = approvalTriggerPermission;
        this.logger = new common_1.Logger(AgentLangGraphRunner_1.name);
        this.summarizeHelpers = null;
    }
    deps() {
        return {
            prisma: this.prisma,
            llmService: this.llmService,
            promptRegistry: this.promptRegistry,
            toolEngine: this.toolEngine,
            sse: this.sse,
            sessionRunCoordinator: this.sessionRunCoordinator,
            runSseGateway: this.runSseGateway,
            assistantArtifact: this.assistantArtifact,
            goaService: this.goaService,
            resumeGate: this.resumeGate,
            categoryIntentRecall: this.categoryIntentRecall,
            pendingWriteConfirmationStore: this.pendingWriteConfirmationStore,
            sessionScope: this.sessionScope,
            skillService: this.skillService,
            requestedSkillRun: this.requestedSkillRun,
            hostToolService: this.hostToolService,
            runScopeCache: this.runScopeCache,
            approvalTriggerPermission: this.approvalTriggerPermission,
            logger: this.logger,
        };
    }
    getSummarizeHelpers() {
        if (!this.summarizeHelpers) {
            this.summarizeHelpers = (0, agent_graph_1.createAgentGraphSummarizeHelpers)(this.deps());
        }
        return this.summarizeHelpers;
    }
    async run(input) {
        return (0, agent_graph_1.buildAndRunAgentGraph)(this.deps(), input);
    }
    assessObservationQualityForResume(output, agentMetadata) {
        return this.getSummarizeHelpers().assessObservationQuality(output, agentMetadata);
    }
    buildPendingPlanSummaryObservation(userMessage, state, planContext) {
        return this.getSummarizeHelpers().buildPendingPlanSummaryObservation(userMessage, state, planContext);
    }
};
AgentLangGraphRunner = AgentLangGraphRunner_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        llm_service_1.LlmService,
        prompt_registry_service_1.PromptRegistryService,
        tool_engine_service_1.ToolEngineService,
        agent_run_sse_emitter_1.AgentRunSseEmitter,
        session_run_coordinator_service_1.SessionRunCoordinator,
        agent_run_sse_gateway_1.AgentRunSseGateway,
        run_assistant_artifact_store_1.RunAssistantArtifactStore,
        session_goa_service_1.SessionGoaService,
        session_resume_gate_service_1.SessionResumeGateService,
        category_intent_recall_service_1.CategoryIntentRecallService,
        pending_write_confirmation_store_1.PendingWriteConfirmationStore,
        agent_session_scope_service_1.AgentSessionScopeService,
        skill_service_1.SkillService,
        requested_skill_run_service_1.RequestedSkillRunService,
        host_tool_service_1.HostToolService,
        run_scope_cache_service_1.RunScopeCacheService,
        approval_trigger_permission_service_1.ApprovalTriggerPermissionService])
], AgentLangGraphRunner);
exports.AgentLangGraphRunner = AgentLangGraphRunner;
//# sourceMappingURL=agent-lang-graph.runner.js.map