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
const requested_skill_run_error_1 = require("./requested-skill-run.error");
let RequestedSkillRunService = class RequestedSkillRunService {
    constructor(skillService, toolEngine) {
        this.skillService = skillService;
        this.toolEngine = toolEngine;
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
        var _a, _b;
        const skill = await this.resolveVisibleSkill(input);
        const allowedToolIds = new Set(input.allowedTools.map((tool) => tool.id));
        const capabilities = (0, skill_runnable_util_1.normalizeSkillRunnableCapabilities)(skill);
        const runnable = (0, skill_runnable_util_1.skillIsRunnableForUser)(skill, allowedToolIds);
        (0, host_tool_resolve_debug_util_1.logHostToolResolve)('requestedSkillResolveRunnable', {
            runId: (_a = input.runId) !== null && _a !== void 0 ? _a : null,
            sessionId: (_b = input.sessionId) !== null && _b !== void 0 ? _b : null,
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
        tool_engine_service_1.ToolEngineService])
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