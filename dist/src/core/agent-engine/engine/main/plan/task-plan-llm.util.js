"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveTaskPlan = exports.resolveOuterPlan = exports.tryBuildOuterPlanViaLlm = exports.tryBuildTaskPlanViaLlm = exports.tryParseJsonObject = exports.normalizeLlmPlanSteps = exports.normalizeOuterLlmPlanSteps = exports.readPlanSkillPromptExcerptChars = exports.llmTaskPlanSchema = exports.llmOuterPlanSchema = exports.llmOuterPlanStepSchema = exports.llmTaskPlanStepSchema = exports.resolveRequestedSkillOuterPlan = exports.isRequestedHostOnlyOuterPlanInput = void 0;
const zod_1 = require("zod");
const prompt_template_keys_1 = require("../../../../prompt/prompt-template.keys");
const tool_decision_role_enum_1 = require("../../../../tool-engine/tool-decision-role.enum");
const skill_runnable_util_1 = require("../../../../skill/skill-runnable.util");
const requested_skill_run_error_1 = require("../skill/requested-skill-run.error");
const task_plan_util_1 = require("./task-plan.util");
const plan_goal_util_1 = require("./plan-goal.util");
function isRequestedHostOnlyOuterPlanInput(planInput) {
    var _a;
    const requestedSkillId = planInput.requestedSkillId;
    if (requestedSkillId == null) {
        return false;
    }
    const skill = (_a = planInput.requestedSkillDetail) !== null && _a !== void 0 ? _a : planInput.availableSkills.find((row) => row.id === requestedSkillId);
    if (!skill) {
        return false;
    }
    if ('runnableKind' in skill && skill.runnableKind === 'host') {
        return true;
    }
    const caps = (0, skill_runnable_util_1.normalizeSkillRunnableCapabilities)({
        skillToolIds: 'skillToolIds' in skill ? skill.skillToolIds : undefined,
        hostToolIds: skill.hostToolIds,
    });
    return (0, skill_runnable_util_1.skillIsHostOnlySkill)(caps);
}
exports.isRequestedHostOnlyOuterPlanInput = isRequestedHostOnlyOuterPlanInput;
function resolveRequestedSkillOuterPlan(planInput) {
    var _a;
    const requestedSkillId = planInput.requestedSkillId;
    if (requestedSkillId == null) {
        throw new requested_skill_run_error_1.RequestedSkillRunError('SKILL_NOT_IN_SCOPE', 'requestedSkillId is required');
    }
    const skill = (_a = planInput.requestedSkillDetail) !== null && _a !== void 0 ? _a : planInput.availableSkills.find((row) => row.id === requestedSkillId);
    if (!skill) {
        throw new requested_skill_run_error_1.RequestedSkillRunError('SKILL_NOT_IN_SCOPE', `requested skill ${requestedSkillId} is not available for scoped tools`);
    }
    return (0, task_plan_util_1.buildRequestedSkillOuterPlanResult)({
        userMessage: planInput.userMessage,
        skill: {
            id: skill.id,
            name: skill.name,
            description: skill.description,
            riskLevel: skill.riskLevel,
            config: 'config' in skill && skill.config !== undefined ? skill.config : undefined,
            skillToolIds: 'skillToolIds' in skill ? skill.skillToolIds : undefined,
            hostToolIds: 'hostToolIds' in skill ? skill.hostToolIds : undefined,
        },
        scopedToolSummaries: planInput.scopedToolSummaries,
        outerSkillSelectMethod: 'requested',
    });
}
exports.resolveRequestedSkillOuterPlan = resolveRequestedSkillOuterPlan;
const LLM_PLAN_STEP_PHASES = ['gather', 'analyze', 'answer', 'mutate'];
const LLM_INNER_PLAN_STEP_KINDS = [
    'tool',
    'host_tool',
    'summarize',
    'reason',
];
const LLM_OUTER_PLAN_STEP_KINDS = [
    'skill',
    'tool',
    'host_tool',
    'summarize',
    'reason',
];
const LLM_PLAN_STOP_WHEN = [
    'observation_non_empty',
    'observation_fetch_complete',
    'observation_has_fields',
    'always',
];
const LLM_PLAN_DELIVERABLES = [
    'analysis',
    'list',
    'detail',
    'mutation',
    'answer',
];
exports.llmTaskPlanStepSchema = zod_1.z.object({
    id: zod_1.z.string().min(1).max(64),
    phase: zod_1.z.enum(LLM_PLAN_STEP_PHASES),
    kind: zod_1.z.enum(LLM_INNER_PLAN_STEP_KINDS),
    toolRole: zod_1.z.string().nullable().optional(),
    hostToolNames: zod_1.z.array(zod_1.z.string().min(1).max(128)).nullable().optional(),
    objective: zod_1.z.string().min(1).max(2000),
    stopWhen: zod_1.z.enum(LLM_PLAN_STOP_WHEN).nullable().optional(),
});
exports.llmOuterPlanStepSchema = zod_1.z.object({
    id: zod_1.z.string().min(1).max(64),
    phase: zod_1.z.enum(LLM_PLAN_STEP_PHASES),
    kind: zod_1.z.enum(LLM_OUTER_PLAN_STEP_KINDS),
    skillId: zod_1.z.number().int().positive().nullable().optional(),
    toolRole: zod_1.z.string().nullable().optional(),
    hostToolNames: zod_1.z.array(zod_1.z.string().min(1).max(128)).nullable().optional(),
    objective: zod_1.z.string().min(1).max(2000),
    stopWhen: zod_1.z.enum(LLM_PLAN_STOP_WHEN).nullable().optional(),
});
exports.llmOuterPlanSchema = zod_1.z.object({
    deliverable: zod_1.z.enum(LLM_PLAN_DELIVERABLES),
    goal: zod_1.z.string().min(1).max(500),
    steps: zod_1.z.array(exports.llmOuterPlanStepSchema).min(1).max(8),
});
exports.llmTaskPlanSchema = zod_1.z.object({
    deliverable: zod_1.z.enum(LLM_PLAN_DELIVERABLES),
    goal: zod_1.z.string().min(1).max(500),
    steps: zod_1.z.array(exports.llmTaskPlanStepSchema).min(1).max(8),
});
const PLAN_SKILL_PROMPT_EXCERPT_CHARS = 1200;
function readPlanSkillPromptExcerptChars() {
    return PLAN_SKILL_PROMPT_EXCERPT_CHARS;
}
exports.readPlanSkillPromptExcerptChars = readPlanSkillPromptExcerptChars;
function isConfiguredToolRole(value) {
    return tool_decision_role_enum_1.TOOL_DECISION_ROLES.includes(value);
}
function normalizeHostToolNamesForPlanStep(row, scopedHostToolNames) {
    var _a;
    if (scopedHostToolNames.size === 0) {
        return null;
    }
    const requested = ((_a = row.hostToolNames) !== null && _a !== void 0 ? _a : [])
        .map((name) => name.trim())
        .filter(Boolean);
    const names = requested.length > 0
        ? requested.filter((name) => scopedHostToolNames.has(name))
        : [...scopedHostToolNames];
    return names.length > 0 ? names : null;
}
function normalizeOuterLlmPlanSteps(raw, scopedRoles, availableSkillIds, scopedHostToolNames) {
    var _a, _b;
    const steps = [];
    const droppedHostToolStepIds = [];
    for (const row of raw.steps) {
        const id = row.id.trim();
        const objective = row.objective.trim();
        if (!id || !objective) {
            return { steps: null, droppedHostToolStepIds };
        }
        if (row.kind === 'skill') {
            if (row.skillId == null || !availableSkillIds.has(row.skillId)) {
                return { steps: null, droppedHostToolStepIds };
            }
            steps.push(Object.assign({ id, phase: row.phase, kind: 'skill', skillId: row.skillId, objective }, (row.stopWhen ? { stopWhen: row.stopWhen } : {})));
            continue;
        }
        if (row.kind === 'host_tool') {
            const hostToolNames = normalizeHostToolNamesForPlanStep(row, scopedHostToolNames);
            if (!hostToolNames) {
                droppedHostToolStepIds.push(id);
                continue;
            }
            steps.push(Object.assign({ id, phase: row.phase, kind: 'host_tool', hostToolNames,
                objective }, (row.stopWhen ? { stopWhen: row.stopWhen } : {})));
            continue;
        }
        let toolRole;
        if (row.kind === 'tool') {
            const roleRaw = (_a = row.toolRole) === null || _a === void 0 ? void 0 : _a.trim();
            if (!roleRaw || !isConfiguredToolRole(roleRaw) || roleRaw === 'unknown') {
                return { steps: null, droppedHostToolStepIds };
            }
            if (!scopedRoles.has(roleRaw)) {
                return { steps: null, droppedHostToolStepIds };
            }
            toolRole = roleRaw;
        }
        else if ((_b = row.toolRole) === null || _b === void 0 ? void 0 : _b.trim()) {
            const roleRaw = row.toolRole.trim();
            if (isConfiguredToolRole(roleRaw) && roleRaw !== 'unknown') {
                toolRole = roleRaw;
            }
        }
        steps.push(Object.assign(Object.assign({ id, phase: row.phase, kind: row.kind, objective }, (toolRole ? { toolRole } : {})), (row.stopWhen ? { stopWhen: row.stopWhen } : {})));
    }
    return {
        steps: steps.length > 0 ? steps : null,
        droppedHostToolStepIds,
    };
}
exports.normalizeOuterLlmPlanSteps = normalizeOuterLlmPlanSteps;
function normalizeLlmPlanSteps(raw, scopedRoles, scopedHostToolNames) {
    var _a, _b, _c;
    const steps = [];
    const droppedHostToolStepIds = [];
    for (const row of raw.steps) {
        const id = row.id.trim();
        const objective = row.objective.trim();
        if (!id || !objective) {
            return { steps: null, droppedHostToolStepIds };
        }
        if (row.kind === 'host_tool') {
            const hostToolNames = normalizeHostToolNamesForPlanStep(row, scopedHostToolNames);
            if (!hostToolNames) {
                droppedHostToolStepIds.push(id);
                continue;
            }
            steps.push(Object.assign({ id, phase: row.phase, kind: 'host_tool', hostToolNames,
                objective }, (row.stopWhen ? { stopWhen: row.stopWhen } : { stopWhen: 'always' })));
            continue;
        }
        let toolRole;
        if (row.kind === 'tool') {
            const roleRaw = (_a = row.toolRole) === null || _a === void 0 ? void 0 : _a.trim();
            if (!roleRaw || !isConfiguredToolRole(roleRaw) || roleRaw === 'unknown') {
                return { steps: null, droppedHostToolStepIds };
            }
            if (!scopedRoles.has(roleRaw)) {
                return { steps: null, droppedHostToolStepIds };
            }
            toolRole = roleRaw;
        }
        else if ((_b = row.toolRole) === null || _b === void 0 ? void 0 : _b.trim()) {
            const roleRaw = row.toolRole.trim();
            if (isConfiguredToolRole(roleRaw) && roleRaw !== 'unknown') {
                toolRole = roleRaw;
            }
        }
        const stopWhen = (_c = row.stopWhen) !== null && _c !== void 0 ? _c : undefined;
        steps.push(Object.assign(Object.assign({ id, phase: row.phase, kind: row.kind, objective }, (toolRole ? { toolRole } : {})), (stopWhen ? { stopWhen } : {})));
    }
    return {
        steps: steps.length > 0 ? steps : null,
        droppedHostToolStepIds,
    };
}
exports.normalizeLlmPlanSteps = normalizeLlmPlanSteps;
function buildPlanLlmUserPayload(input) {
    var _a, _b, _c, _d;
    const skillPrompt = (_a = input.skillPrompt) === null || _a === void 0 ? void 0 : _a.trim();
    const excerpt = skillPrompt
        ? skillPrompt.slice(0, readPlanSkillPromptExcerptChars())
        : null;
    const payload = {
        userMessage: input.userMessage.trim(),
        skill: input.skillApplied
            ? {
                name: (_b = input.skillName) !== null && _b !== void 0 ? _b : null,
                description: (_c = input.skillDescription) !== null && _c !== void 0 ? _c : null,
                promptExcerpt: excerpt,
            }
            : null,
        scopedTools: input.scopedToolSummaries.map((tool) => ({
            name: tool.name,
            role: tool.role,
        })),
        configuredDeliverable: (_d = (0, task_plan_util_1.parseSkillPlanConfig)(input.skillConfig).deliverable) !== null && _d !== void 0 ? _d : null,
    };
    if (input.sessionWorkingMemory) {
        payload.sessionWorkingMemory = input.sessionWorkingMemory;
    }
    if (input.availableHostTools && input.availableHostTools.length > 0) {
        payload.availableHostTools = input.availableHostTools;
    }
    return JSON.stringify(payload, null, 2);
}
function buildOuterPlanLlmUserPayload(input) {
    const payload = {
        userMessage: input.userMessage.trim(),
        scopedTools: input.scopedToolSummaries.map((tool) => ({
            name: tool.name,
            role: tool.role,
        })),
        availableSkills: input.availableSkills.map((skill) => ({
            id: skill.id,
            name: skill.name,
            description: skill.description,
            capabilityKey: skill.capabilityKey,
            riskLevel: skill.riskLevel,
            toolRoles: skill.toolRoles,
            hostToolIds: skill.hostToolIds,
            runnableKind: skill.runnableKind,
        })),
        planMode: 'outer_orchestration',
    };
    if (input.availableHostTools && input.availableHostTools.length > 0) {
        payload.availableHostTools = input.availableHostTools;
    }
    if (input.sessionWorkingMemory) {
        payload.sessionWorkingMemory = input.sessionWorkingMemory;
    }
    return JSON.stringify(payload, null, 2);
}
function tryParseJsonObject(value) {
    try {
        const parsed = JSON.parse(value);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            return parsed;
        }
        return null;
    }
    catch (_a) {
        return null;
    }
}
exports.tryParseJsonObject = tryParseJsonObject;
async function invokeLlmTaskPlan(input) {
    const systemPrompt = await input.promptRegistry.render(prompt_template_keys_1.PROMPT_KEYS.AGENT_PLAN, input.scope);
    const messages = [
        { role: 'system', content: systemPrompt },
        {
            role: 'user',
            content: buildPlanLlmUserPayload(input.planInput),
        },
    ];
    try {
        const { model, messages: fittedMessages } = await input.llmService.createLangChainChatModelForMessages(messages, {
            budgetHints: { callKind: 'plan' },
        });
        const structuredModel = model.withStructuredOutput(exports.llmTaskPlanSchema);
        return (await structuredModel.invoke(fittedMessages));
    }
    catch (_a) {
        const result = await input.llmService.chat({
            messages,
            tools: [],
            budgetHints: { callKind: 'plan' },
        });
        const parsed = tryParseJsonObject(result.content);
        if (!parsed) {
            return null;
        }
        const safe = exports.llmTaskPlanSchema.safeParse(parsed);
        return safe.success ? safe.data : null;
    }
}
async function tryBuildTaskPlanViaLlm(input) {
    var _a;
    const scopedRoles = new Set(input.planInput.scopedToolSummaries.map((tool) => tool.role));
    const scopedHostToolNames = new Set(((_a = input.planInput.availableHostTools) !== null && _a !== void 0 ? _a : []).map((tool) => tool.name));
    const llmRaw = await invokeLlmTaskPlan(input);
    if (!llmRaw) {
        return null;
    }
    const normalized = normalizeLlmPlanSteps(llmRaw, scopedRoles, scopedHostToolNames);
    if (!normalized.steps) {
        return null;
    }
    const userMessage = input.planInput.userMessage.trim();
    const plan = (0, task_plan_util_1.buildPlanSnapshot)({
        source: 'llm',
        userMessage,
        goal: (0, plan_goal_util_1.resolvePlanGoal)({ userMessage }),
        deliverable: (0, task_plan_util_1.alignDeliverableWithScopedTools)(llmRaw.deliverable, input.planInput.scopedToolSummaries),
        steps: normalized.steps,
        constraints: (0, plan_goal_util_1.resolveSkillCapabilityConstraints)({
            skillDescription: input.planInput.skillDescription,
            skillName: input.planInput.skillName,
        }),
    });
    return {
        plan,
        method: 'llm',
        droppedHostToolStepIds: normalized.droppedHostToolStepIds,
    };
}
exports.tryBuildTaskPlanViaLlm = tryBuildTaskPlanViaLlm;
async function invokeLlmOuterPlan(input) {
    const systemPrompt = await input.promptRegistry.render(prompt_template_keys_1.PROMPT_KEYS.AGENT_PLAN, input.scope);
    const messages = [
        { role: 'system', content: systemPrompt },
        {
            role: 'user',
            content: buildOuterPlanLlmUserPayload(input.planInput),
        },
    ];
    try {
        const { model, messages: fittedMessages } = await input.llmService.createLangChainChatModelForMessages(messages, {
            budgetHints: { callKind: 'plan' },
        });
        const structuredModel = model.withStructuredOutput(exports.llmOuterPlanSchema);
        return (await structuredModel.invoke(fittedMessages));
    }
    catch (_a) {
        const result = await input.llmService.chat({
            messages,
            tools: [],
            budgetHints: { callKind: 'plan' },
        });
        const parsed = tryParseJsonObject(result.content);
        if (!parsed) {
            return null;
        }
        const safe = exports.llmOuterPlanSchema.safeParse(parsed);
        return safe.success ? safe.data : null;
    }
}
async function tryBuildOuterPlanViaLlm(input) {
    var _a;
    const scopedRoles = new Set(input.planInput.scopedToolSummaries.map((tool) => tool.role));
    const availableSkillIds = new Set(input.planInput.availableSkills.map((skill) => skill.id));
    const scopedHostToolNames = new Set(((_a = input.planInput.availableHostTools) !== null && _a !== void 0 ? _a : []).map((tool) => tool.name));
    const llmRaw = await invokeLlmOuterPlan(input);
    if (!llmRaw) {
        return null;
    }
    const normalized = normalizeOuterLlmPlanSteps(llmRaw, scopedRoles, availableSkillIds, scopedHostToolNames);
    if (!normalized.steps) {
        return null;
    }
    const userMessage = input.planInput.userMessage.trim();
    const plan = (0, task_plan_util_1.buildPlanSnapshot)({
        source: 'llm',
        userMessage,
        goal: (0, plan_goal_util_1.resolvePlanGoal)({ userMessage }),
        deliverable: (0, task_plan_util_1.alignDeliverableWithScopedTools)(llmRaw.deliverable, input.planInput.scopedToolSummaries),
        steps: normalized.steps,
        constraints: [],
    });
    return {
        plan,
        method: 'llm',
        droppedHostToolStepIds: normalized.droppedHostToolStepIds,
    };
}
exports.tryBuildOuterPlanViaLlm = tryBuildOuterPlanViaLlm;
function outerPlanInputAsBuildTaskPlan(planInput) {
    return {
        userMessage: planInput.userMessage,
        scopedToolSummaries: planInput.scopedToolSummaries,
        skillApplied: false,
    };
}
async function resolveOuterPlan(input) {
    const scopedSummaries = input.planInput.scopedToolSummaries;
    const hasWrite = (0, task_plan_util_1.scopedToolsIncludeWrite)(scopedSummaries);
    const userMessage = input.planInput.userMessage.trim();
    const requestedSkillId = input.planInput.requestedSkillId;
    if (requestedSkillId != null) {
        return resolveRequestedSkillOuterPlan(input.planInput);
    }
    const llmResult = await tryBuildOuterPlanViaLlm(input);
    if (llmResult) {
        if ((0, task_plan_util_1.shouldReplacePlanWithMutationTemplate)(llmResult.plan, hasWrite)) {
            return (0, task_plan_util_1.buildDeterministicMutationPlanResult)({
                userMessage,
                goal: llmResult.plan.goal,
                scopedToolSummaries: scopedSummaries,
                llmFallbackReason: 'mutation_template_forced',
            });
        }
        return llmResult;
    }
    const plan = (0, task_plan_util_1.buildTaskPlan)(outerPlanInputAsBuildTaskPlan(input.planInput));
    return {
        plan,
        method: plan.source,
        llmFallbackReason: 'outer_plan_llm_failed',
    };
}
exports.resolveOuterPlan = resolveOuterPlan;
async function resolveTaskPlan(input) {
    var _a, _b;
    if (input.planInput.skillBoundWorkflowPlan) {
        return {
            plan: input.planInput.skillBoundWorkflowPlan,
            method: 'workflow',
        };
    }
    if ((0, task_plan_util_1.shouldUseDeterministicMutationPlan)(input.planInput)) {
        const goal = ((_a = input.planInput.skillDescription) === null || _a === void 0 ? void 0 : _a.trim()) ||
            ((_b = input.planInput.skillName) === null || _b === void 0 ? void 0 : _b.trim()) ||
            input.planInput.userMessage.trim() ||
            'Complete the user request';
        return (0, task_plan_util_1.buildDeterministicMutationPlanResult)({
            userMessage: input.planInput.userMessage.trim(),
            goal,
            scopedToolSummaries: input.planInput.scopedToolSummaries,
        });
    }
    const llmResult = await tryBuildTaskPlanViaLlm(input);
    if (llmResult) {
        const hasWrite = (0, task_plan_util_1.scopedToolsIncludeWrite)(input.planInput.scopedToolSummaries);
        if ((0, task_plan_util_1.shouldReplacePlanWithMutationTemplate)(llmResult.plan, hasWrite, input.planInput)) {
            return (0, task_plan_util_1.buildDeterministicMutationPlanResult)({
                userMessage: input.planInput.userMessage.trim(),
                goal: llmResult.plan.goal,
                scopedToolSummaries: input.planInput.scopedToolSummaries,
                llmFallbackReason: 'mutation_template_forced',
            });
        }
        return llmResult;
    }
    const plan = (0, task_plan_util_1.buildTaskPlan)(input.planInput);
    return {
        plan,
        method: plan.source,
        llmFallbackReason: 'llm_plan_failed',
    };
}
exports.resolveTaskPlan = resolveTaskPlan;
//# sourceMappingURL=task-plan-llm.util.js.map