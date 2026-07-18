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
exports.requestedSkillUserMessage = exports.RequestedSkillRunService = void 0;
const common_1 = require("@nestjs/common");
const skill_service_1 = require("../../../../skill/skill.service");
const tool_engine_service_1 = require("../../../../tool-engine/tool-engine.service");
const host_tool_resolve_debug_util_1 = require("../../../../host-bridge/host-tool-resolve-debug.util");
const skill_runnable_util_1 = require("../../../../skill/skill-runnable.util");
const agent_capability_load_util_1 = require("../../../../runtime-cache/agent-capability-load.util");
const load_workflow_definition_util_1 = require("../../../../workflow/load-workflow-definition.util");
const load_flow_for_run_util_1 = require("../../../../workflow/load-flow-for-run.util");
const workflow_runtime_scope_util_1 = require("../../../../workflow/workflow-runtime-scope.util");
const prisma_service_1 = require("../../../../../prisma/prisma.service");
const requested_skill_run_error_1 = require("./requested-skill-run.error");
let RequestedSkillRunService = class RequestedSkillRunService {
    constructor(skillService, toolEngine, prisma) {
        this.skillService = skillService;
        this.toolEngine = toolEngine;
        this.prisma = prisma;
    }
    async assertRunnableForMessage(input) {
        try {
            await this.resolveRunnable(input);
        }
        catch (error) {
            this.rethrowAsBadRequest(error);
        }
    }
    async loadRunContext(input) {
        var _a, _b;
        const { skill, skillTools } = await this.resolveRunnable(Object.assign(Object.assign({}, input), { runId: input.runId, sessionId: input.sessionId }));
        const capabilities = (0, skill_runnable_util_1.normalizeSkillRunnableCapabilities)(skill);
        (0, host_tool_resolve_debug_util_1.logHostToolResolve)('requestedSkillLoadRunContext', {
            runId: (_a = input.runId) !== null && _a !== void 0 ? _a : null,
            sessionId: (_b = input.sessionId) !== null && _b !== void 0 ? _b : null,
            agentId: input.agentId,
            appClientId: input.appClientId,
            userId: input.userId,
            skillId: skill.id,
            skillName: skill.name,
            runnableKind: (0, skill_runnable_util_1.deriveSkillRunnableKind)(capabilities),
            skillToolIds: capabilities.skillToolIds,
            hostToolIds: capabilities.hostToolIds,
            pickedHttpToolIds: skillTools.map((tool) => tool.id),
            pickedHttpToolNames: skillTools.map((tool) => tool.name),
            allowedToolCount: input.allowedTools.length,
        });
        return {
            skillId: skill.id,
            skill,
            scoped: this.buildSkillScopedTools({
                skillTools,
                toolBuildCtx: input.toolBuildCtx,
            }),
        };
    }
    buildSkillScopedTools(input) {
        const scopedTools = input.skillTools;
        const scopedAllowedToolIds = scopedTools.map((tool) => tool.id);
        const scopedToolBundle = this.toolEngine.buildLangChainTools(scopedTools, Object.assign(Object.assign({}, input.toolBuildCtx), { allowedToolIds: scopedAllowedToolIds }));
        return {
            scopedTools,
            scopedLangChainTools: scopedToolBundle.tools,
            scopedToolBundle,
            scopedAllowedToolIds,
            skillToolIds: scopedAllowedToolIds,
        };
    }
    async resolveRunnable(input) {
        var _a, _b, _c, _d, _e, _f;
        const skill = await this.resolveVisibleSkill(input);
        const allowedToolIds = new Set(input.allowedTools.map((tool) => tool.id));
        const capabilities = (0, skill_runnable_util_1.normalizeSkillRunnableCapabilities)(skill);
        if ((0, skill_runnable_util_1.skillIsWorkflowBound)(skill)) {
            const workflowCheck = await this.loadWorkflowRunnableContext({
                skill,
                allowedToolIds,
                appClientId: input.appClientId,
                agentId: input.agentId,
            });
            (0, host_tool_resolve_debug_util_1.logHostToolResolve)('requestedSkillResolveRunnable', {
                runId: (_a = input.runId) !== null && _a !== void 0 ? _a : null,
                sessionId: (_b = input.sessionId) !== null && _b !== void 0 ? _b : null,
                agentId: input.agentId,
                skillId: input.skillId,
                skillName: skill.name,
                skillToolIds: capabilities.skillToolIds,
                hostToolIds: capabilities.hostToolIds,
                runnableKind: (0, skill_runnable_util_1.deriveSkillRunnableKind)(capabilities),
                runnable: workflowCheck.runnable,
                workflowId: (_c = skill.workflowId) !== null && _c !== void 0 ? _c : null,
                flowId: (_d = skill.flowId) !== null && _d !== void 0 ? _d : null,
                allowedToolIds: [...allowedToolIds],
            });
            if (!workflowCheck.runnable) {
                throw new requested_skill_run_error_1.RequestedSkillRunError('SKILL_TOOLS_EMPTY', `skill ${input.skillId} workflow is not runnable for the current user or agent binding`);
            }
            const skillTools = this.pickWorkflowSkillTools(workflowCheck.workflowScopedToolIds, skill, input.allowedTools);
            return { skill, skillTools };
        }
        const runnable = (0, skill_runnable_util_1.skillIsRunnableForUser)(skill, allowedToolIds);
        (0, host_tool_resolve_debug_util_1.logHostToolResolve)('requestedSkillResolveRunnable', {
            runId: (_e = input.runId) !== null && _e !== void 0 ? _e : null,
            sessionId: (_f = input.sessionId) !== null && _f !== void 0 ? _f : null,
            agentId: input.agentId,
            skillId: input.skillId,
            skillName: skill.name,
            skillToolIds: capabilities.skillToolIds,
            hostToolIds: capabilities.hostToolIds,
            runnableKind: (0, skill_runnable_util_1.deriveSkillRunnableKind)(capabilities),
            runnable,
            allowedToolIds: [...allowedToolIds],
        });
        if (!runnable) {
            throw new requested_skill_run_error_1.RequestedSkillRunError('SKILL_TOOLS_EMPTY', `skill ${input.skillId} has no usable tools or host tools for the current user or agent binding`);
        }
        const skillTools = this.pickSkillToolsFromAllowed(skill, input.allowedTools);
        return { skill, skillTools };
    }
    async resolveVisibleSkill(input) {
        const rows = await this.skillService.listAgentSkillsForUser({
            agentId: input.agentId,
            userId: input.userId,
            appClientId: input.appClientId,
        });
        const skill = rows.find((row) => row.id === input.skillId);
        if (!skill) {
            throw new requested_skill_run_error_1.RequestedSkillRunError('SKILL_NOT_VISIBLE', `skill ${input.skillId} is not available for this agent or user role`);
        }
        return skill;
    }
    pickSkillToolsFromAllowed(skill, allowedTools) {
        const skillToolIdSet = new Set(skill.toolIds);
        return allowedTools.filter((tool) => skillToolIdSet.has(tool.id));
    }
    pickWorkflowSkillTools(workflowScopedToolIds, skill, allowedTools) {
        if (workflowScopedToolIds.length > 0) {
            const scoped = new Set(workflowScopedToolIds);
            return allowedTools.filter((tool) => scoped.has(tool.id));
        }
        return this.pickSkillToolsFromAllowed(skill, allowedTools);
    }
    async loadWorkflowRunnableContext(input) {
        var _a, _b;
        const allowedHostToolIds = new Set(await (0, agent_capability_load_util_1.loadAgentHostToolCandidateIds)(this.prisma, input.appClientId, input.agentId));
        const scope = {
            allowedToolIds: [...input.allowedToolIds],
            allowedHostToolIds: [...allowedHostToolIds],
        };
        const overrides = (0, load_workflow_definition_util_1.parseWorkflowOverridesJson)(input.skill.workflowOverrides);
        const flowId = (_a = input.skill.flowId) !== null && _a !== void 0 ? _a : null;
        if (flowId == null || flowId <= 0) {
            return { runnable: false, workflowScopedToolIds: [] };
        }
        const loadResult = await (0, load_flow_for_run_util_1.loadFlowForRunDetailed)(this.prisma, {
            flowId,
            appClientId: input.appClientId,
            flowVersion: (_b = input.skill.flowVersion) !== null && _b !== void 0 ? _b : null,
            workflowOverrides: overrides,
            scope,
        });
        if (loadResult.status !== 'loaded') {
            return { runnable: false, workflowScopedToolIds: [] };
        }
        return {
            runnable: (0, workflow_runtime_scope_util_1.workflowNodeRefsRunnableForUser)({
                nodes: loadResult.nodes,
                userAllowedToolIds: input.allowedToolIds,
                userAllowedHostToolIds: allowedHostToolIds,
            }),
            workflowScopedToolIds: (0, workflow_runtime_scope_util_1.collectWorkflowScopedToolIds)(loadResult.nodes, input.allowedToolIds),
        };
    }
    rethrowAsBadRequest(error) {
        if (error instanceof requested_skill_run_error_1.RequestedSkillRunError) {
            throw new common_1.BadRequestException({
                message: requestedSkillUserMessage(error.code),
                code: error.code,
            });
        }
        throw error;
    }
};
RequestedSkillRunService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [skill_service_1.SkillService,
        tool_engine_service_1.ToolEngineService,
        prisma_service_1.PrismaService])
], RequestedSkillRunService);
exports.RequestedSkillRunService = RequestedSkillRunService;
function requestedSkillUserMessage(code) {
    switch (code) {
        case 'SKILL_NOT_VISIBLE':
            return '所选技能不可用，请刷新技能列表后重试。';
        case 'SKILL_TOOLS_EMPTY':
            return '所选技能暂无可用工具，请联系管理员检查技能与权限配置。';
        case 'SKILL_NOT_IN_SCOPE':
            return '所选技能与当前会话工具范围不匹配，请重选技能或调整说法后重试。';
        case 'SKILL_EXPAND_FAILED':
            return '无法进入所选技能，请重选技能后重试。';
        default:
            return '所选技能无法使用，请重试。';
    }
}
exports.requestedSkillUserMessage = requestedSkillUserMessage;
//# sourceMappingURL=requested-skill-run.service.js.map