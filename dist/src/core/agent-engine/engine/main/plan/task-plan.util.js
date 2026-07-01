"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildDeterministicMutationPlanSnapshot = exports.buildMutationSteps = exports.advancePlanAfterStepComplete = exports.isCompliantMutationPlan = exports.isPlanPresentSummarizeStep = exports.isPlanWriteExecutionStepInMutationFlow = exports.isPlanWriteExecutionStep = exports.isPlanWriteFallbackStep = exports.isComposeMutationParameterStep = exports.isPlanComposeWriteStep = exports.PLAN_DRAFT_STEP_ID = exports.WORKFLOW_PRESENT_MUTATION_STEP_ID = exports.PLAN_WRITE_STEP_ID = exports.PLAN_PRESENT_STEP_ID = exports.PLAN_COMPOSE_WRITE_STEP_ID = exports.resolveMutationWriteToolsForPresent = exports.isPlanWriteToolStep = exports.isPlanWriteToolRole = exports.filterScopedToolsForPlanStep = exports.resolveScopedToolRoleForPlan = exports.countConsecutiveLlmRoundsWithoutToolCalls = exports.isPlanToolStepSatisfiedByObservations = exports.listBusinessFieldsForPlanGatherStep = exports.isPendingPlanAnswerStep = exports.getPendingPlanToolStep = exports.isPlanTextGenerationStep = exports.isPlanStepBlockingToolScope = exports.isPlanWorkflowGateStep = exports.isPlanAwaitUserConfirmStep = exports.resolvePlanStepExecutionRoute = exports.getPendingPlanHostToolStep = exports.resolveEffectivePlanStepId = exports.resolveEffectivePlanStep = exports.getPendingPlanStep = exports.resolvePlanExecutionStep = exports.workflowNodeActionForPlanStepId = exports.planExecutionContextFromState = exports.summarizeScopedToolsForPlan = exports.buildTaskPlan = exports.buildRequestedSkillOuterPlanResult = exports.buildPageContextEntityReadPlanResult = exports.buildPageContextInlinePlanResult = exports.buildChitchatPlanResult = exports.planHasChitchatConstraint = exports.resolveOuterSkillPlanDeliverable = exports.buildPlanSnapshot = exports.applyOuterPlanSelectMetadata = exports.alignDeliverableWithScopedTools = exports.PLAN_TOOL_STEP_MAX_SKIPS_WITHOUT_CALLS = exports.parseSkillPlanConfig = void 0;
exports.buildDecisionUserFrame = exports.formatPlanContextForSummarize = exports.resolvePlanSummarizePublishMode = exports.isIntermediatePlanTextGenerationStep = exports.resolveSummarizeUserMessageForPlan = exports.buildPlanSummarizeObservation = exports.completedGatherStepsSatisfiedInObservations = exports.observationsForPlanSummarize = exports.filterObservationsForPlanSummarize = exports.resolveTaskPlanInitialAdvance = exports.shouldContinuePlanAfterSummarize = exports.finalizePlanAfterSummarize = exports.resolveTaskPlanAdvance = exports.resolveTaskPlanAdvanceWhenStepSatisfied = exports.resolveTaskPlanAfterTools = exports.isTerminalEmptyToolRound = exports.toolCallMatchesPendingPlanToolRole = exports.shouldReplacePlanWithMutationTemplate = exports.scopedToolsIncludeWrite = exports.buildDeterministicMutationPlanResult = exports.shouldUseDeterministicMutationPlan = void 0;
const tool_agent_metadata_util_1 = require("../../../../tool-engine/tool-agent-metadata.util");
const skill_runnable_util_1 = require("../../../../skill/skill-runnable.util");
const tool_observation_util_1 = require("../../tool/tool-observation.util");
const list_map_reduce_util_1 = require("../../gather/list-map-reduce.util");
const pagination_1 = require("../../../../mcp-utils/pagination");
const workflow_graph_routing_util_1 = require("../../../../workflow/workflow-graph-routing.util");
const page_context_execution_policy_util_1 = require("../../../../host-bridge/page-context-execution-policy.util");
const page_context_usage_util_1 = require("../../../../host-bridge/page-context-usage.util");
const plan_goal_util_1 = require("./plan-goal.util");
const plan_stack_util_1 = require("./plan-stack.util");
const VALID_DELIVERABLES = [
    'analysis',
    'list',
    'detail',
    'mutation',
    'answer',
];
const VALID_STEP_KINDS = new Set([
    'skill',
    'tool',
    'host_tool',
    'summarize',
    'reason',
    'workflow_gate',
]);
const VALID_STEP_PHASES = new Set(['gather', 'analyze', 'answer', 'mutate']);
function isRecord(value) {
    return value != null && typeof value === 'object' && !Array.isArray(value);
}
function readString(value) {
    return typeof value === 'string' && value.trim().length > 0
        ? value.trim()
        : null;
}
function parseDeliverable(value) {
    if (typeof value !== 'string') {
        return null;
    }
    const normalized = value.trim().toLowerCase();
    return VALID_DELIVERABLES.includes(normalized) ? normalized : null;
}
function readStringArray(raw) {
    if (!Array.isArray(raw)) {
        return undefined;
    }
    const values = raw
        .filter((item) => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean);
    return values.length > 0 ? values : undefined;
}
function parseWorkflowSteps(raw) {
    if (!Array.isArray(raw) || raw.length === 0) {
        return null;
    }
    const steps = [];
    for (const item of raw) {
        if (!isRecord(item)) {
            return null;
        }
        const id = readString(item.id);
        const phase = readString(item.phase);
        const kind = readString(item.kind);
        const objective = readString(item.objective);
        if (!id || !phase || !kind || !objective) {
            return null;
        }
        if (!VALID_STEP_PHASES.has(phase) || !VALID_STEP_KINDS.has(kind)) {
            return null;
        }
        const toolRole = readString(item.toolRole);
        const hostToolNames = readStringArray(item.hostToolNames);
        const stopWhen = readString(item.stopWhen);
        steps.push(Object.assign(Object.assign(Object.assign(Object.assign({ id, phase: phase, kind: kind }, (toolRole ? { toolRole: toolRole } : {})), (hostToolNames ? { hostToolNames } : {})), { objective }), (stopWhen
            ? { stopWhen: stopWhen }
            : {})));
    }
    return steps;
}
function parseSkillPlanConfig(config) {
    var _a, _b, _c, _d;
    if (!isRecord(config)) {
        return {};
    }
    const workflow = isRecord(config.workflow) ? config.workflow : null;
    if (!workflow) {
        return {
            deliverable: (_a = parseDeliverable(config.deliverable)) !== null && _a !== void 0 ? _a : undefined,
        };
    }
    return {
        deliverable: (_c = (_b = parseDeliverable(workflow.deliverable)) !== null && _b !== void 0 ? _b : parseDeliverable(config.deliverable)) !== null && _c !== void 0 ? _c : undefined,
        workflowSteps: (_d = parseWorkflowSteps(workflow.steps)) !== null && _d !== void 0 ? _d : undefined,
    };
}
exports.parseSkillPlanConfig = parseSkillPlanConfig;
function summarizeScopedRoles(scopedToolSummaries) {
    const roles = new Set(scopedToolSummaries.map((tool) => tool.role));
    const hasWrite = roles.has('write-single') ||
        roles.has('write-batch') ||
        roles.has('write-meta') ||
        roles.has('admin');
    return {
        roles,
        hasReadList: roles.has('read-list'),
        hasReadDetail: roles.has('read-detail'),
        hasWrite,
    };
}
function validatePlanStepsAgainstScoped(steps, scopedToolSummaries) {
    const scopedRoles = new Set(scopedToolSummaries.map((tool) => tool.role));
    for (const step of steps) {
        if (step.kind !== 'tool') {
            continue;
        }
        if (!step.toolRole || !scopedRoles.has(step.toolRole)) {
            return null;
        }
    }
    return steps;
}
exports.PLAN_TOOL_STEP_MAX_SKIPS_WITHOUT_CALLS = 2;
function alignDeliverableWithScopedTools(deliverable, scopedToolSummaries) {
    const { hasReadList, hasReadDetail, hasWrite } = summarizeScopedRoles(scopedToolSummaries);
    switch (deliverable) {
        case 'analysis':
        case 'list':
            return hasReadList ? deliverable : 'answer';
        case 'detail':
            if (hasReadList && hasReadDetail) {
                return 'detail';
            }
            if (hasReadDetail) {
                return 'detail';
            }
            if (hasReadList) {
                return 'list';
            }
            return 'answer';
        case 'mutation':
            if (hasWrite) {
                return 'mutation';
            }
            if (hasReadList) {
                return 'list';
            }
            if (hasReadDetail) {
                return 'detail';
            }
            return 'answer';
        default:
            return deliverable;
    }
}
exports.alignDeliverableWithScopedTools = alignDeliverableWithScopedTools;
function inferDeliverableFromTools(scopedToolSummaries, configured, skillApplied, skillRiskLevel, options) {
    const { hasReadList, hasReadDetail, hasWrite } = summarizeScopedRoles(scopedToolSummaries);
    if (configured) {
        if ((options === null || options === void 0 ? void 0 : options.hostOnlySkill) && configured === 'mutation') {
            return 'mutation';
        }
        return alignDeliverableWithScopedTools(configured, scopedToolSummaries);
    }
    if (skillApplied &&
        hasWrite &&
        hasReadDetail &&
        (skillRiskLevel === 'L2' || skillRiskLevel === 'L3')) {
        return 'mutation';
    }
    if (hasWrite) {
        return 'mutation';
    }
    if (hasReadList && hasReadDetail) {
        return 'detail';
    }
    if (hasReadList) {
        return skillApplied ? 'analysis' : 'list';
    }
    if (hasReadDetail) {
        return 'detail';
    }
    return 'answer';
}
function hostOnlySkillFromPlanInput(input) {
    var _a, _b;
    return (0, skill_runnable_util_1.skillIsHostOnlySkill)((0, skill_runnable_util_1.normalizeSkillRunnableCapabilities)({
        skillToolIds: (_a = input.skillToolIds) !== null && _a !== void 0 ? _a : [],
        hostToolIds: (_b = input.skillHostToolIds) !== null && _b !== void 0 ? _b : [],
    }));
}
function buildTemplateSteps(deliverable, scopedToolSummaries) {
    const { hasReadList, hasReadDetail, hasWrite } = summarizeScopedRoles(scopedToolSummaries);
    if (deliverable === 'analysis' && hasReadList) {
        return [
            {
                id: 'fetch',
                phase: 'gather',
                kind: 'tool',
                toolRole: 'read-list',
                objective: 'Call the read-list tool once with filters derived from user_intent. Use default pagination when not specified; the engine will auto-fetch remaining pages when needed.',
                stopWhen: 'observation_fetch_complete',
            },
            {
                id: 'analyze',
                phase: 'analyze',
                kind: 'summarize',
                objective: 'Use observations only. Perform analysis per active_skill / agent_prompt. Do NOT call read-list again unless observations lack required fields.',
                stopWhen: 'always',
            },
        ];
    }
    if (deliverable === 'list' && hasReadList) {
        return [
            {
                id: 'fetch',
                phase: 'gather',
                kind: 'tool',
                toolRole: 'read-list',
                objective: 'Call read-list once to satisfy user_intent. Do not repeat the same call.',
                stopWhen: 'observation_non_empty',
            },
            {
                id: 'answer',
                phase: 'answer',
                kind: 'summarize',
                objective: 'Summarize the list from observations for the user. No further read-list calls.',
                stopWhen: 'always',
            },
        ];
    }
    if (deliverable === 'detail') {
        const steps = [];
        if (hasReadList && hasReadDetail) {
            steps.push({
                id: 'list',
                phase: 'gather',
                kind: 'tool',
                toolRole: 'read-list',
                objective: 'When entity id is unknown, call read-list once to discover candidates.',
                stopWhen: 'observation_non_empty',
            }, {
                id: 'detail',
                phase: 'gather',
                kind: 'tool',
                toolRole: 'read-detail',
                objective: 'Call read-detail for the target entity using ids from observations or user_intent.',
                stopWhen: 'observation_non_empty',
            });
        }
        else if (hasReadDetail) {
            steps.push({
                id: 'detail',
                phase: 'gather',
                kind: 'tool',
                toolRole: 'read-detail',
                objective: 'Call read-detail once with identifiers from user_intent or observations.',
                stopWhen: 'observation_non_empty',
            });
        }
        else if (hasReadList) {
            return buildTemplateSteps('list', scopedToolSummaries);
        }
        steps.push({
            id: 'answer',
            phase: 'answer',
            kind: 'summarize',
            objective: 'Answer from observations. Do not re-fetch unless data is missing.',
            stopWhen: 'always',
        });
        return steps;
    }
    if (deliverable === 'mutation' && hasWrite) {
        return buildMutationSteps(scopedToolSummaries);
    }
    if (deliverable === 'answer' && hasReadDetail) {
        return [
            {
                id: 'read_detail',
                phase: 'gather',
                kind: 'tool',
                toolRole: 'read-detail',
                objective: 'Call read-detail once with identifiers from user_intent. Load entity data needed for the answer.',
                stopWhen: 'observation_non_empty',
            },
            {
                id: 'answer',
                phase: 'answer',
                kind: 'summarize',
                objective: 'Answer from observations and user_intent. If user_intent specifies exact fixed text, output that text. Do not call write tools unless user_intent requires mutation.',
                stopWhen: 'always',
            },
        ];
    }
    if (hasReadList) {
        return buildTemplateSteps('list', scopedToolSummaries);
    }
    if (hasReadDetail) {
        return buildTemplateSteps('detail', scopedToolSummaries);
    }
    return [
        {
            id: 'answer',
            phase: 'answer',
            kind: 'summarize',
            objective: 'Answer from observations and agent context. Use tools only if observations cannot satisfy user_intent.',
            stopWhen: 'always',
        },
    ];
}
function normalizePlanStepsForDeliverable(steps, deliverable) {
    if (deliverable !== 'analysis') {
        return steps;
    }
    return steps.map((step) => {
        if (step.phase === 'gather' &&
            step.kind === 'tool' &&
            step.toolRole === 'read-list') {
            return Object.assign(Object.assign({}, step), { stopWhen: 'observation_fetch_complete' });
        }
        return step;
    });
}
function finalizePlanSnapshot(input) {
    var _a, _b, _c, _d, _e;
    const steps = normalizePlanStepsForDeliverable(input.steps, input.deliverable);
    const pendingStepIds = steps.map((step) => step.id);
    const first = (_a = steps[0]) !== null && _a !== void 0 ? _a : null;
    return {
        source: input.source,
        originalUserRequest: input.userMessage.trim(),
        goal: input.goal,
        deliverable: input.deliverable,
        constraints: (_b = input.constraints) !== null && _b !== void 0 ? _b : [],
        steps,
        pendingStepIds,
        completedStepIds: [],
        taskPhase: (_c = first === null || first === void 0 ? void 0 : first.phase) !== null && _c !== void 0 ? _c : 'answer',
        currentObjective: (_d = first === null || first === void 0 ? void 0 : first.objective) !== null && _d !== void 0 ? _d : input.goal,
        currentStepId: (_e = first === null || first === void 0 ? void 0 : first.id) !== null && _e !== void 0 ? _e : null,
    };
}
function applyOuterPlanSelectMetadata(plan, meta) {
    return Object.assign(Object.assign(Object.assign({}, plan), (meta.outerSkillSelectMethod != null
        ? { outerSkillSelectMethod: meta.outerSkillSelectMethod }
        : {})), (meta.autoSelectedSkillId !== undefined
        ? { autoSelectedSkillId: meta.autoSelectedSkillId }
        : {}));
}
exports.applyOuterPlanSelectMetadata = applyOuterPlanSelectMetadata;
function buildPlanSnapshot(input) {
    return (0, plan_stack_util_1.wrapSnapshotWithPlanStack)(finalizePlanSnapshot(input));
}
exports.buildPlanSnapshot = buildPlanSnapshot;
function resolveOuterSkillPlanDeliverable(input) {
    var _a, _b;
    const planConfig = parseSkillPlanConfig(input.skill.config);
    const caps = (0, skill_runnable_util_1.normalizeSkillRunnableCapabilities)({
        skillToolIds: (_a = input.skill.skillToolIds) !== null && _a !== void 0 ? _a : [],
        hostToolIds: (_b = input.skill.hostToolIds) !== null && _b !== void 0 ? _b : [],
    });
    const hostPrimary = input.pageHostPrimary === true || (0, skill_runnable_util_1.skillIsHostOnlySkill)(caps);
    if (planConfig.deliverable) {
        return hostPrimary
            ? planConfig.deliverable
            : alignDeliverableWithScopedTools(planConfig.deliverable, input.scopedToolSummaries);
    }
    if (hostPrimary) {
        return 'answer';
    }
    return inferDeliverableFromTools(input.scopedToolSummaries, undefined, true, input.skill.riskLevel, { hostOnlySkill: (0, skill_runnable_util_1.skillIsHostOnlySkill)(caps) });
}
exports.resolveOuterSkillPlanDeliverable = resolveOuterSkillPlanDeliverable;
function planHasChitchatConstraint(plan) {
    return (plan === null || plan === void 0 ? void 0 : plan.constraints.includes('chitchat')) === true;
}
exports.planHasChitchatConstraint = planHasChitchatConstraint;
function buildChitchatPlanResult(input) {
    const userMessage = input.userMessage.trim();
    const goal = userMessage || 'Reply naturally to the user';
    const plan = buildPlanSnapshot({
        source: 'minimal',
        userMessage,
        goal,
        deliverable: 'answer',
        steps: [
            {
                id: 'chitchat_reply',
                phase: 'answer',
                kind: 'reason',
                objective: 'Reply naturally and concisely in the same language as the user. Do not call tools.',
                stopWhen: 'always',
            },
        ],
        constraints: ['chitchat'],
    });
    return { plan, method: 'minimal' };
}
exports.buildChitchatPlanResult = buildChitchatPlanResult;
function buildPageContextInlinePlanResult(input) {
    var _a;
    const userMessage = input.userMessage.trim();
    const goal = userMessage ||
        `Analyze current ${(_a = input.pageContextUsage.entityType) !== null && _a !== void 0 ? _a : 'page'} context`;
    const plan = buildPlanSnapshot({
        source: 'page_context',
        userMessage,
        goal,
        deliverable: 'analysis',
        steps: [
            {
                id: 'summarize_page_context',
                phase: 'analyze',
                kind: 'summarize',
                objective: 'Analyze the entity content from page_context / working_memory_observations. Do not call read-list or read-detail unless the user explicitly requests a server refresh.',
                stopWhen: 'always',
            },
        ],
        constraints: ['page_context_inline'],
    });
    return { plan, method: 'page_context' };
}
exports.buildPageContextInlinePlanResult = buildPageContextInlinePlanResult;
function buildPageContextEntityReadPlanResult(input) {
    var _a, _b;
    const userMessage = input.userMessage.trim();
    const entityId = (_a = input.pageContextUsage.entityId) !== null && _a !== void 0 ? _a : 'unknown';
    const entityType = (_b = input.pageContextUsage.entityType) !== null && _b !== void 0 ? _b : 'entity';
    const goal = userMessage || `Answer using current page ${entityType} ${entityId}`;
    const { hasReadDetail } = summarizeScopedRoles(input.scopedToolSummaries);
    const steps = [];
    if (hasReadDetail) {
        steps.push({
            id: 'read_page_entity',
            phase: 'gather',
            kind: 'tool',
            toolRole: 'read-detail',
            objective: `Call read-detail once for ${entityType} id ${entityId} from page_context. Do not call read-list.`,
            stopWhen: 'observation_non_empty',
        });
    }
    else {
        steps.push({
            id: 'list_page_entity',
            phase: 'gather',
            kind: 'tool',
            toolRole: 'read-list',
            objective: `Call read-list once filtered to ${entityType} id ${entityId} from page_context. Do not use unfiltered pagination.`,
            stopWhen: 'observation_non_empty',
        });
    }
    steps.push({
        id: 'summarize_page_entity',
        phase: 'analyze',
        kind: 'summarize',
        objective: 'Answer the user from observations.',
        stopWhen: 'always',
    });
    const plan = buildPlanSnapshot({
        source: 'page_context',
        userMessage,
        goal,
        deliverable: 'analysis',
        steps,
        constraints: ['page_context_entity'],
    });
    return { plan, method: 'page_context' };
}
exports.buildPageContextEntityReadPlanResult = buildPageContextEntityReadPlanResult;
function buildRequestedSkillOuterPlanResult(input) {
    var _a, _b;
    const userMessage = input.userMessage.trim();
    const goal = (0, plan_goal_util_1.resolvePlanGoal)({
        userMessage,
        skillDescription: input.skill.description,
        skillName: input.skill.name,
    });
    const constraints = (0, plan_goal_util_1.resolveSkillCapabilityConstraints)({
        skillDescription: input.skill.description,
        skillName: input.skill.name,
    });
    const skillObjective = ((_a = input.skill.description) === null || _a === void 0 ? void 0 : _a.trim()) ||
        input.skill.name.trim() ||
        'Execute selected skill';
    const deliverable = resolveOuterSkillPlanDeliverable({
        skill: input.skill,
        scopedToolSummaries: input.scopedToolSummaries,
        pageHostPrimary: input.pageHostPrimary,
    });
    const phase = deliverable === 'mutation'
        ? 'mutate'
        : deliverable === 'answer'
            ? 'answer'
            : deliverable === 'analysis'
                ? 'analyze'
                : 'gather';
    const plan = buildPlanSnapshot({
        source: 'template',
        userMessage,
        goal,
        deliverable,
        steps: [
            {
                id: 'requested-skill',
                phase,
                kind: 'skill',
                skillId: input.skill.id,
                objective: skillObjective,
            },
        ],
        constraints,
    });
    return {
        plan,
        method: 'template',
        outerSkillSelectMethod: (_b = input.outerSkillSelectMethod) !== null && _b !== void 0 ? _b : (input.pageHostPrimary ? 'page_host_unique' : 'requested'),
        autoSelectedSkillId: input.pageHostPrimary ? input.skill.id : null,
    };
}
exports.buildRequestedSkillOuterPlanResult = buildRequestedSkillOuterPlanResult;
function buildTaskPlan(input) {
    const userMessage = input.userMessage.trim();
    const scopedToolSummaries = input.scopedToolSummaries;
    const planConfig = parseSkillPlanConfig(input.skillConfig);
    const hostOnlySkill = hostOnlySkillFromPlanInput(input);
    const goal = (0, plan_goal_util_1.resolvePlanGoal)({
        userMessage,
        skillDescription: input.skillDescription,
        skillName: input.skillName,
    });
    const skillConstraints = (0, plan_goal_util_1.resolveSkillCapabilityConstraints)({
        skillDescription: input.skillDescription,
        skillName: input.skillName,
    });
    const deliverable = inferDeliverableFromTools(scopedToolSummaries, planConfig.deliverable, input.skillApplied, input.skillRiskLevel, { hostOnlySkill });
    const templateSteps = buildTemplateSteps(deliverable, scopedToolSummaries);
    return buildPlanSnapshot({
        source: templateSteps.length <= 1 ? 'minimal' : 'template',
        userMessage,
        goal,
        deliverable,
        steps: templateSteps,
        constraints: skillConstraints,
    });
}
exports.buildTaskPlan = buildTaskPlan;
function summarizeScopedToolsForPlan(tools) {
    return tools.map((tool) => ({
        name: tool.name,
        role: (0, tool_agent_metadata_util_1.resolveToolDecisionRole)({
            agentMetadata: tool.agentMetadata,
            responseProfile: tool.responseProfile,
            method: tool.method,
            name: tool.name,
            description: tool.description,
        }),
    }));
}
exports.summarizeScopedToolsForPlan = summarizeScopedToolsForPlan;
function getStepById(plan, stepId) {
    var _a;
    if (!stepId) {
        return null;
    }
    return (_a = plan.steps.find((step) => step.id === stepId)) !== null && _a !== void 0 ? _a : null;
}
function planExecutionContextFromState(input) {
    return {
        taskPlan: input.taskPlan,
        workflowRun: input.workflowRun,
        workflowNodeDefs: input.workflowNodeDefs,
    };
}
exports.planExecutionContextFromState = planExecutionContextFromState;
function workflowNodeActionForPlanStepId(workflowNodeDefs, stepId) {
    var _a, _b;
    return (_b = (_a = (0, workflow_graph_routing_util_1.getWorkflowNodeDef)(workflowNodeDefs, stepId)) === null || _a === void 0 ? void 0 : _a.action) !== null && _b !== void 0 ? _b : null;
}
exports.workflowNodeActionForPlanStepId = workflowNodeActionForPlanStepId;
function resolvePlanExecutionStep(ctx) {
    var _a, _b;
    const step = resolveEffectivePlanStep({
        taskPlan: ctx.taskPlan,
        workflowRun: ctx.workflowRun,
    });
    const stepId = (_a = step === null || step === void 0 ? void 0 : step.id) !== null && _a !== void 0 ? _a : (((_b = ctx.workflowRun) === null || _b === void 0 ? void 0 : _b.status) === 'running'
        ? ctx.workflowRun.currentNodeId
        : null);
    return {
        step,
        workflowNodeAction: workflowNodeActionForPlanStepId(ctx.workflowNodeDefs, stepId),
    };
}
exports.resolvePlanExecutionStep = resolvePlanExecutionStep;
function getPendingPlanStep(plan) {
    var _a;
    if (!plan) {
        return null;
    }
    const stepId = (_a = plan.pendingStepIds[0]) !== null && _a !== void 0 ? _a : plan.currentStepId;
    return getStepById(plan, stepId);
}
exports.getPendingPlanStep = getPendingPlanStep;
function resolveEffectivePlanStep(input) {
    const plan = input.taskPlan;
    if (!plan) {
        return null;
    }
    const run = input.workflowRun;
    if ((run === null || run === void 0 ? void 0 : run.status) === 'running' && run.currentNodeId) {
        const fromWorkflow = getStepById(plan, run.currentNodeId);
        if (fromWorkflow) {
            return fromWorkflow;
        }
    }
    return getPendingPlanStep(plan);
}
exports.resolveEffectivePlanStep = resolveEffectivePlanStep;
function resolveEffectivePlanStepId(input) {
    var _a, _b;
    return (_b = (_a = resolveEffectivePlanStep(input)) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : null;
}
exports.resolveEffectivePlanStepId = resolveEffectivePlanStepId;
function getPendingPlanHostToolStep(plan, workflowRun) {
    const step = resolveEffectivePlanStep({ taskPlan: plan, workflowRun });
    return (step === null || step === void 0 ? void 0 : step.kind) === 'host_tool' ? step : null;
}
exports.getPendingPlanHostToolStep = getPendingPlanHostToolStep;
function resolvePlanStepExecutionRoute(step, workflowNodeAction) {
    if (!step) {
        return 'terminal';
    }
    if (isPlanAwaitUserConfirmStep(step, workflowNodeAction)) {
        return 'workflow';
    }
    if (step.kind === 'summarize' || step.kind === 'reason') {
        return 'summarize';
    }
    if (step.kind === 'workflow_gate') {
        return 'workflow';
    }
    return 'llm';
}
exports.resolvePlanStepExecutionRoute = resolvePlanStepExecutionRoute;
function isPlanAwaitUserConfirmStep(step, workflowNodeAction) {
    return ((step === null || step === void 0 ? void 0 : step.kind) === 'workflow_gate' ||
        workflowNodeAction === 'await_user_confirm');
}
exports.isPlanAwaitUserConfirmStep = isPlanAwaitUserConfirmStep;
function isPlanWorkflowGateStep(step, workflowNodeAction) {
    return resolvePlanStepExecutionRoute(step, workflowNodeAction) === 'workflow';
}
exports.isPlanWorkflowGateStep = isPlanWorkflowGateStep;
function isPlanStepBlockingToolScope(step, workflowNodeAction) {
    const route = resolvePlanStepExecutionRoute(step, workflowNodeAction);
    return route === 'summarize' || route === 'workflow';
}
exports.isPlanStepBlockingToolScope = isPlanStepBlockingToolScope;
function isPlanTextGenerationStep(step, workflowNodeAction) {
    return resolvePlanStepExecutionRoute(step, workflowNodeAction) === 'summarize';
}
exports.isPlanTextGenerationStep = isPlanTextGenerationStep;
function getPendingPlanToolStep(plan, workflowRun) {
    const step = resolveEffectivePlanStep({ taskPlan: plan, workflowRun });
    return (step === null || step === void 0 ? void 0 : step.kind) === 'tool' ? step : null;
}
exports.getPendingPlanToolStep = getPendingPlanToolStep;
function isPendingPlanAnswerStep(plan, workflowRun, workflowNodeDefs) {
    const { step, workflowNodeAction } = resolvePlanExecutionStep({
        taskPlan: plan,
        workflowRun,
        workflowNodeDefs,
    });
    return isPlanTextGenerationStep(step, workflowNodeAction);
}
exports.isPendingPlanAnswerStep = isPendingPlanAnswerStep;
function matchingToolNamesForPlanStep(step, scopedTools) {
    if (!step.toolRole || !(scopedTools === null || scopedTools === void 0 ? void 0 : scopedTools.length)) {
        return null;
    }
    const names = scopedTools
        .filter((tool) => resolveScopedToolRoleForPlan(tool) === step.toolRole)
        .map((tool) => tool.name);
    return names.length > 0 ? new Set(names) : null;
}
function listBusinessFieldsForPlanGatherStep(step, scopedTools) {
    var _a;
    const matchingToolNames = matchingToolNamesForPlanStep(step, scopedTools);
    if (!matchingToolNames) {
        return [];
    }
    const fields = new Set();
    for (const tool of scopedTools) {
        if (!matchingToolNames.has(tool.name)) {
            continue;
        }
        const meta = (0, tool_agent_metadata_util_1.parseAgentMetadata)(tool.agentMetadata);
        for (const field of (_a = meta === null || meta === void 0 ? void 0 : meta.businessFields) !== null && _a !== void 0 ? _a : []) {
            if (field.trim()) {
                fields.add(field.trim());
            }
        }
    }
    return [...fields];
}
exports.listBusinessFieldsForPlanGatherStep = listBusinessFieldsForPlanGatherStep;
function observationsForPlanToolStep(input) {
    const matchingToolNames = matchingToolNamesForPlanStep(input.step, input.scopedTools);
    if (!matchingToolNames) {
        return input.observations;
    }
    return input.observations.filter((row) => {
        if (matchingToolNames.has(row.name)) {
            return true;
        }
        if (!(0, page_context_usage_util_1.isPageContextSourcedObservation)(row)) {
            return false;
        }
        if (input.step.toolRole !== 'read-detail') {
            return false;
        }
        return (0, page_context_usage_util_1.pageContextObservationMatchesEntity)({
            observation: row,
            entityId: input.pageContextEntityId,
        });
    });
}
function observationsSatisfyPlanToolStepStopWhen(step, observations, planContext) {
    var _a;
    const stopWhen = (_a = step.stopWhen) !== null && _a !== void 0 ? _a : 'observation_non_empty';
    if (stopWhen === 'always') {
        return true;
    }
    if (stopWhen === 'observation_fetch_complete') {
        if (observations.some((row) => (0, list_map_reduce_util_1.resolveMapReduceGatherPhase)(row.output) === 'resumable')) {
            return false;
        }
        if (observations.some((row) => {
            const phase = (0, list_map_reduce_util_1.resolveMapReduceGatherPhase)(row.output);
            return phase === 'complete' || phase === 'partial';
        })) {
            return true;
        }
        if (!(0, tool_observation_util_1.hasSummarizableToolObservations)(observations)) {
            return false;
        }
        return !observations.some((row) => {
            var _a;
            return (0, pagination_1.observationNeedsPagedFetch)({
                output: row.output,
                args: (_a = row.llmPayload) === null || _a === void 0 ? void 0 : _a.args,
                llmPayload: row.llmPayload,
            });
        });
    }
    return (0, tool_observation_util_1.hasSummarizableToolObservations)(observations);
}
function isPlanToolStepSatisfiedByObservations(input) {
    var _a;
    const purpose = (_a = input.purpose) !== null && _a !== void 0 ? _a : 'pre_tools_advance';
    if (input.step.kind !== 'tool' || !input.step.toolRole) {
        return false;
    }
    if (purpose === 'pre_tools_advance' &&
        isPlanWriteToolRole(input.step.toolRole)) {
        return false;
    }
    const relevant = observationsForPlanToolStep({
        step: input.step,
        observations: input.observations,
        scopedTools: input.scopedTools,
        pageContextEntityId: input.pageContextEntityId,
    });
    return observationsSatisfyPlanToolStepStopWhen(input.step, relevant, {
        taskPlan: input.taskPlan,
        skillConfig: input.skillConfig,
    });
}
exports.isPlanToolStepSatisfiedByObservations = isPlanToolStepSatisfiedByObservations;
function countConsecutiveLlmRoundsWithoutToolCalls(steps) {
    let count = 0;
    for (let index = steps.length - 1; index >= 0; index -= 1) {
        const row = steps[index];
        if ((row === null || row === void 0 ? void 0 : row.type) === 'result_check' || (row === null || row === void 0 ? void 0 : row.type) === 'tool') {
            continue;
        }
        if ((row === null || row === void 0 ? void 0 : row.type) !== 'llm') {
            break;
        }
        const output = row.output;
        if (!isRecord(output)) {
            break;
        }
        const toolCalls = output.toolCalls;
        if (!Array.isArray(toolCalls) || toolCalls.length > 0) {
            break;
        }
        count += 1;
    }
    return count;
}
exports.countConsecutiveLlmRoundsWithoutToolCalls = countConsecutiveLlmRoundsWithoutToolCalls;
function resolveScopedToolRoleForPlan(tool) {
    return (0, tool_agent_metadata_util_1.resolveToolDecisionRole)({
        agentMetadata: tool.agentMetadata,
        responseProfile: tool.responseProfile,
        method: tool.method,
        name: tool.name,
        description: tool.description,
    });
}
exports.resolveScopedToolRoleForPlan = resolveScopedToolRoleForPlan;
function filterScopedToolsForPlanStep(tools, taskPlan, workflowRun, workflowNodeDefs) {
    const { step: executionStep, workflowNodeAction } = resolvePlanExecutionStep({
        taskPlan,
        workflowRun,
        workflowNodeDefs,
    });
    if (isPlanStepBlockingToolScope(executionStep, workflowNodeAction)) {
        return [];
    }
    if (getPendingPlanHostToolStep(taskPlan, workflowRun)) {
        return [];
    }
    const step = getPendingPlanToolStep(taskPlan, workflowRun);
    if (!step || step.kind !== 'tool' || !step.toolRole) {
        return tools;
    }
    const filtered = tools.filter((tool) => resolveScopedToolRoleForPlan(tool) === step.toolRole);
    return filtered.length > 0 ? filtered : tools;
}
exports.filterScopedToolsForPlanStep = filterScopedToolsForPlanStep;
const WRITE_TOOL_ROLES = [
    'write-single',
    'write-batch',
    'write-meta',
    'admin',
];
function isPlanWriteToolRole(role) {
    return (role != null &&
        WRITE_TOOL_ROLES.includes(role));
}
exports.isPlanWriteToolRole = isPlanWriteToolRole;
function isPlanWriteToolStep(step) {
    return (step === null || step === void 0 ? void 0 : step.kind) === 'tool' && isPlanWriteToolRole(step.toolRole);
}
exports.isPlanWriteToolStep = isPlanWriteToolStep;
function resolveMutationWriteToolsForPresent(scopedTools, taskPlan, composedToolName) {
    const trimmed = composedToolName === null || composedToolName === void 0 ? void 0 : composedToolName.trim();
    if (trimmed) {
        const bound = scopedTools.find((tool) => tool.name === trimmed);
        if (bound) {
            return [bound];
        }
    }
    if (!taskPlan) {
        return [];
    }
    const writeStep = taskPlan.steps.find((step) => isPlanWriteExecutionStepInMutationFlow(step));
    if (!writeStep) {
        return [];
    }
    const planForWriteStep = Object.assign(Object.assign({}, taskPlan), { currentStepId: writeStep.id, currentObjective: writeStep.objective, taskPhase: writeStep.phase, pendingStepIds: taskPlan.pendingStepIds.includes(writeStep.id)
            ? taskPlan.pendingStepIds
            : [writeStep.id, ...taskPlan.pendingStepIds] });
    return filterScopedToolsForPlanStep(scopedTools, planForWriteStep);
}
exports.resolveMutationWriteToolsForPresent = resolveMutationWriteToolsForPresent;
exports.PLAN_COMPOSE_WRITE_STEP_ID = 'compose_write';
exports.PLAN_PRESENT_STEP_ID = 'present';
exports.PLAN_WRITE_STEP_ID = 'write';
exports.WORKFLOW_PRESENT_MUTATION_STEP_ID = 'present_mutation';
exports.PLAN_DRAFT_STEP_ID = 'draft';
function isPlanComposeWriteStep(step) {
    return ((step === null || step === void 0 ? void 0 : step.kind) === 'tool' &&
        step.id === exports.PLAN_COMPOSE_WRITE_STEP_ID &&
        isPlanWriteToolStep(step));
}
exports.isPlanComposeWriteStep = isPlanComposeWriteStep;
function isComposeMutationParameterStep(step, workflowNodeAction) {
    if (isPlanComposeWriteStep(step)) {
        return true;
    }
    if (workflowNodeAction === 'compose_mutation') {
        return ((step === null || step === void 0 ? void 0 : step.kind) === 'tool' &&
            step.phase === 'analyze' &&
            isPlanWriteToolStep(step));
    }
    return ((step === null || step === void 0 ? void 0 : step.kind) === 'tool' &&
        step.phase === 'analyze' &&
        isPlanWriteToolStep(step) &&
        step.id !== exports.PLAN_WRITE_STEP_ID);
}
exports.isComposeMutationParameterStep = isComposeMutationParameterStep;
function isPlanWriteFallbackStep(step) {
    return ((step === null || step === void 0 ? void 0 : step.kind) === 'tool' &&
        step.id === exports.PLAN_WRITE_STEP_ID &&
        isPlanWriteToolStep(step));
}
exports.isPlanWriteFallbackStep = isPlanWriteFallbackStep;
function isPlanWriteExecutionStep(step, workflowNodeAction) {
    if (isPlanWriteFallbackStep(step)) {
        return true;
    }
    if ((step === null || step === void 0 ? void 0 : step.kind) !== 'tool' ||
        step.phase !== 'mutate' ||
        !isPlanWriteToolStep(step)) {
        return false;
    }
    if (workflowNodeAction === 'write_data') {
        return true;
    }
    return step.id === exports.PLAN_WRITE_STEP_ID;
}
exports.isPlanWriteExecutionStep = isPlanWriteExecutionStep;
function isPlanWriteExecutionStepInMutationFlow(step) {
    if (isPlanWriteFallbackStep(step)) {
        return true;
    }
    return ((step === null || step === void 0 ? void 0 : step.kind) === 'tool' &&
        step.phase === 'mutate' &&
        isPlanWriteToolStep(step));
}
exports.isPlanWriteExecutionStepInMutationFlow = isPlanWriteExecutionStepInMutationFlow;
function isPlanPresentSummarizeStep(step, workflowNodeDefs) {
    if ((step === null || step === void 0 ? void 0 : step.kind) !== 'summarize') {
        return false;
    }
    if (step.id === exports.PLAN_PRESENT_STEP_ID ||
        step.id === exports.PLAN_DRAFT_STEP_ID ||
        step.id === exports.WORKFLOW_PRESENT_MUTATION_STEP_ID) {
        return true;
    }
    const def = workflowNodeDefs === null || workflowNodeDefs === void 0 ? void 0 : workflowNodeDefs.find((row) => row.id === step.id);
    return (def === null || def === void 0 ? void 0 : def.action) === 'present_mutation';
}
exports.isPlanPresentSummarizeStep = isPlanPresentSummarizeStep;
const MUTATION_CORE_STEP_IDS = [
    exports.PLAN_COMPOSE_WRITE_STEP_ID,
    exports.PLAN_PRESENT_STEP_ID,
    exports.PLAN_WRITE_STEP_ID,
];
function mutationStepById(steps, id) {
    return steps.find((step) => step.id === id);
}
function isCompliantMutationPlan(steps) {
    for (const id of MUTATION_CORE_STEP_IDS) {
        if (!mutationStepById(steps, id)) {
            return false;
        }
    }
    const compose = mutationStepById(steps, exports.PLAN_COMPOSE_WRITE_STEP_ID);
    const present = mutationStepById(steps, exports.PLAN_PRESENT_STEP_ID);
    const write = mutationStepById(steps, exports.PLAN_WRITE_STEP_ID);
    if ((compose === null || compose === void 0 ? void 0 : compose.kind) !== 'tool' ||
        !isPlanWriteToolRole(compose.toolRole) ||
        (present === null || present === void 0 ? void 0 : present.kind) !== 'summarize' ||
        (write === null || write === void 0 ? void 0 : write.kind) !== 'tool' ||
        !isPlanWriteToolRole(write.toolRole)) {
        return false;
    }
    const composeIndex = steps.findIndex((step) => step.id === exports.PLAN_COMPOSE_WRITE_STEP_ID);
    const presentIndex = steps.findIndex((step) => step.id === exports.PLAN_PRESENT_STEP_ID);
    const writeIndex = steps.findIndex((step) => step.id === exports.PLAN_WRITE_STEP_ID);
    return composeIndex < presentIndex && presentIndex < writeIndex;
}
exports.isCompliantMutationPlan = isCompliantMutationPlan;
function advancePlanAfterStepComplete(plan, completedStepId) {
    return buildPlanAdvanceAfterStepComplete(plan, completedStepId);
}
exports.advancePlanAfterStepComplete = advancePlanAfterStepComplete;
function buildMutationSteps(scopedToolSummaries) {
    const { hasReadList, hasReadDetail } = summarizeScopedRoles(scopedToolSummaries);
    const writeToolRole = pickWriteToolRoleForTemplate(scopedToolSummaries);
    const steps = [];
    if (hasReadDetail) {
        steps.push({
            id: 'read_detail',
            phase: 'gather',
            kind: 'tool',
            toolRole: 'read-detail',
            objective: 'Call read-detail once with identifiers from user_intent. Load data required before write.',
            stopWhen: 'observation_non_empty',
        });
    }
    else if (hasReadList) {
        steps.push({
            id: 'list',
            phase: 'gather',
            kind: 'tool',
            toolRole: 'read-list',
            objective: 'When entity id is unknown, call read-list once before write.',
            stopWhen: 'observation_non_empty',
        });
    }
    steps.push({
        id: 'compose_write',
        phase: 'analyze',
        kind: 'tool',
        toolRole: writeToolRole,
        objective: 'Compose write parameters only: emit one bound write tool_call with all required parameters from tool_schema (identifiers, headers, enums) and full submit body from read observations. Runtime stores plan_compose_write; do not wait for user draft.',
    });
    steps.push({
        id: 'present',
        phase: 'answer',
        kind: 'summarize',
        objective: 'Present user-facing draft from plan_compose_write observation. Quote the submit body from composed arguments verbatim. Do not call write tools.',
        stopWhen: 'always',
    });
    steps.push({
        id: 'write',
        phase: 'mutate',
        kind: 'tool',
        toolRole: writeToolRole,
        objective: 'Fallback only if present did not gate: call the bound write tool from <tool_schema> using plan_compose_write arguments verbatim. Never call observation names as tools.',
        stopWhen: 'observation_non_empty',
    });
    steps.push({
        id: 'confirm',
        phase: 'answer',
        kind: 'summarize',
        objective: 'Summarize whether the write succeeded and what changed, citing observations.',
        stopWhen: 'always',
    });
    return steps;
}
exports.buildMutationSteps = buildMutationSteps;
function pickWriteToolRoleForTemplate(scopedToolSummaries) {
    const roles = new Set(scopedToolSummaries.map((tool) => tool.role));
    for (const role of WRITE_TOOL_ROLES) {
        if (roles.has(role)) {
            return role;
        }
    }
    return 'write-single';
}
function buildDeterministicMutationPlanSnapshot(input) {
    const userMessage = input.userMessage.trim();
    const goal = (0, plan_goal_util_1.resolvePlanGoal)({ userMessage });
    return buildPlanSnapshot({
        source: 'template',
        userMessage,
        goal,
        deliverable: 'mutation',
        steps: buildMutationSteps(input.scopedToolSummaries),
        constraints: [],
    });
}
exports.buildDeterministicMutationPlanSnapshot = buildDeterministicMutationPlanSnapshot;
function shouldUseDeterministicMutationPlan(planInput) {
    const planConfig = parseSkillPlanConfig(planInput.skillConfig);
    if (planConfig.deliverable === 'answer') {
        return false;
    }
    const { hasWrite, hasReadDetail, hasReadList } = summarizeScopedRoles(planInput.scopedToolSummaries);
    if (!hasWrite) {
        return false;
    }
    if (planConfig.deliverable === 'mutation') {
        return true;
    }
    if (!planInput.skillApplied) {
        return true;
    }
    const risk = planInput.skillRiskLevel;
    if (risk === 'L2' || risk === 'L3') {
        return hasReadDetail || hasReadList;
    }
    return false;
}
exports.shouldUseDeterministicMutationPlan = shouldUseDeterministicMutationPlan;
function buildDeterministicMutationPlanResult(input) {
    const plan = buildDeterministicMutationPlanSnapshot({
        userMessage: input.userMessage,
        goal: input.goal,
        scopedToolSummaries: input.scopedToolSummaries,
    });
    return {
        plan,
        method: 'template',
        llmFallbackReason: input.llmFallbackReason,
    };
}
exports.buildDeterministicMutationPlanResult = buildDeterministicMutationPlanResult;
function scopedToolsIncludeWrite(scopedToolSummaries) {
    return summarizeScopedRoles(scopedToolSummaries).hasWrite;
}
exports.scopedToolsIncludeWrite = scopedToolsIncludeWrite;
function planHasNonCompliantMutationSteps(plan) {
    if (plan.deliverable === 'mutation') {
        return !isCompliantMutationPlan(plan.steps);
    }
    return plan.steps.some((step) => step.kind === 'tool' && isPlanWriteToolRole(step.toolRole));
}
function shouldReplacePlanWithMutationTemplate(plan, hasWrite, planInput) {
    if (!hasWrite) {
        return false;
    }
    if (planInput && !shouldUseDeterministicMutationPlan(planInput)) {
        return false;
    }
    if (plan.steps.some((step) => step.kind === 'skill')) {
        return false;
    }
    return planHasNonCompliantMutationSteps(plan);
}
exports.shouldReplacePlanWithMutationTemplate = shouldReplacePlanWithMutationTemplate;
function toolCallMatchesPendingPlanToolRole(call, taskPlan, scopedTools) {
    const step = getPendingPlanToolStep(taskPlan);
    if (!step || step.kind !== 'tool' || !step.toolRole) {
        return true;
    }
    const tool = scopedTools.find((row) => row.name === call.name);
    if (!tool) {
        return false;
    }
    return resolveScopedToolRoleForPlan(tool) === step.toolRole;
}
exports.toolCallMatchesPendingPlanToolRole = toolCallMatchesPendingPlanToolRole;
function isTerminalEmptyToolRound(executionStatuses) {
    return (executionStatuses.length > 0 &&
        executionStatuses.every((status) => status === 'EMPTY'));
}
exports.isTerminalEmptyToolRound = isTerminalEmptyToolRound;
function observationsForRound(observations, roundObservationIndices) {
    return roundObservationIndices
        .map((index) => observations[index])
        .filter((row) => row != null);
}
function roundObservationsForPlanToolStep(input) {
    const roundObservations = observationsForRound(input.observations, input.roundObservationIndices);
    const matchingToolNames = matchingToolNamesForPlanStep(input.step, input.scopedTools);
    if (!matchingToolNames) {
        return roundObservations;
    }
    return roundObservations.filter((row) => matchingToolNames.has(row.name));
}
function isToolStepComplete(input) {
    if (input.executionStatuses.includes('ERROR')) {
        return false;
    }
    if (input.executionStatuses.length === 0) {
        return false;
    }
    return observationsSatisfyPlanToolStepStopWhen(input.step, input.roundObservations, {
        taskPlan: input.taskPlan,
        skillConfig: input.skillConfig,
    });
}
function roundToolCallsMatchPendingPlanStep(input) {
    const step = getPendingPlanToolStep(input.plan);
    if (!step || step.kind !== 'tool' || !step.toolRole) {
        return true;
    }
    if (input.toolCalls.length === 0) {
        return false;
    }
    return input.toolCalls.every((call) => {
        var _a;
        return toolCallMatchesPendingPlanToolRole(call, input.plan, (_a = input.scopedTools) !== null && _a !== void 0 ? _a : []);
    });
}
function applyPlanAdvance(plan, completedStepId) {
    const normalized = plan.frames.length === 0 ? (0, plan_stack_util_1.wrapSnapshotWithPlanStack)(plan) : plan;
    return (0, plan_stack_util_1.syncPlanFromActiveFrame)((0, plan_stack_util_1.applyActiveFrameStepComplete)(normalized, completedStepId));
}
function resolveTaskPlanAfterTools(input) {
    var _a, _b;
    const currentStepId = (_a = input.plan.pendingStepIds[0]) !== null && _a !== void 0 ? _a : input.plan.currentStepId;
    const currentStep = getStepById(input.plan, currentStepId);
    if (!currentStep || currentStep.kind !== 'tool') {
        return null;
    }
    if (!roundToolCallsMatchPendingPlanStep({
        plan: input.plan,
        scopedTools: input.scopedTools,
        toolCalls: (_b = input.toolCalls) !== null && _b !== void 0 ? _b : [],
    })) {
        return null;
    }
    const roundObservations = roundObservationsForPlanToolStep({
        step: currentStep,
        observations: input.observations,
        roundObservationIndices: input.roundObservationIndices,
        scopedTools: input.scopedTools,
    });
    if (!isToolStepComplete({
        step: currentStep,
        roundObservations,
        executionStatuses: input.executionStatuses,
        taskPlan: input.plan,
        skillConfig: input.skillConfig,
    })) {
        return null;
    }
    if (isTerminalEmptyToolRound(input.executionStatuses)) {
        return null;
    }
    return buildPlanAdvanceAfterStepComplete(input.plan, currentStep.id);
}
exports.resolveTaskPlanAfterTools = resolveTaskPlanAfterTools;
function buildPlanAdvanceAfterStepComplete(plan, completedStepId) {
    const updatedPlan = applyPlanAdvance(plan, completedStepId);
    const nextStep = getPendingPlanStep(updatedPlan);
    const route = resolvePlanStepExecutionRoute(nextStep);
    if (route === 'terminal') {
        return {
            updatedPlan,
            route: 'summarize',
            reason: 'plan_complete',
        };
    }
    if (route === 'summarize') {
        return {
            updatedPlan,
            route: 'summarize',
            reason: 'plan_advance_summarize',
        };
    }
    return {
        updatedPlan,
        route: 'llm',
        reason: planAdvanceReasonForLlmStep(nextStep),
    };
}
function planAdvanceReasonForLlmStep(step) {
    switch (step.kind) {
        case 'skill':
            return 'plan_advance_skill_step';
        case 'host_tool':
            return 'plan_advance_host_tool_step';
        default:
            return 'plan_advance_tool_step';
    }
}
function resolveTaskPlanAdvanceWhenStepSatisfied(input) {
    var _a, _b;
    const currentStepId = (_a = input.plan.pendingStepIds[0]) !== null && _a !== void 0 ? _a : input.plan.currentStepId;
    const currentStep = getStepById(input.plan, currentStepId);
    if (!currentStep || currentStep.kind !== 'tool') {
        return null;
    }
    if (!isPlanToolStepSatisfiedByObservations({
        step: currentStep,
        observations: input.observations,
        scopedTools: input.scopedTools,
        taskPlan: input.plan,
        skillConfig: input.skillConfig,
        purpose: (_b = input.purpose) !== null && _b !== void 0 ? _b : 'pre_tools_advance',
        pageContextEntityId: input.pageContextEntityId,
    })) {
        return null;
    }
    return buildPlanAdvanceAfterStepComplete(input.plan, currentStep.id);
}
exports.resolveTaskPlanAdvanceWhenStepSatisfied = resolveTaskPlanAdvanceWhenStepSatisfied;
function resolveTaskPlanAdvance(input) {
    var _a;
    if (input.phase === 'post_tools') {
        return resolveTaskPlanAfterTools({
            plan: input.plan,
            observations: input.observations,
            executionStatuses: input.executionStatuses,
            roundObservationIndices: input.roundObservationIndices,
            scopedTools: input.scopedTools,
            toolCalls: input.toolCalls,
            skillConfig: input.skillConfig,
        });
    }
    return resolveTaskPlanAdvanceWhenStepSatisfied({
        plan: input.plan,
        observations: input.observations,
        scopedTools: input.scopedTools,
        skillConfig: input.skillConfig,
        purpose: (_a = input.purpose) !== null && _a !== void 0 ? _a : 'pre_tools_advance',
    });
}
exports.resolveTaskPlanAdvance = resolveTaskPlanAdvance;
function finalizePlanAfterSummarize(plan) {
    var _a;
    if (!plan) {
        return null;
    }
    const normalized = plan.frames.length === 0 ? (0, plan_stack_util_1.wrapSnapshotWithPlanStack)(plan) : plan;
    const stepId = (_a = normalized.pendingStepIds[0]) !== null && _a !== void 0 ? _a : normalized.currentStepId;
    const step = getStepById(normalized, stepId);
    if (!step || !isPlanTextGenerationStep(step)) {
        return normalized;
    }
    const updated = applyPlanAdvance(normalized, step.id);
    return updated.pendingStepIds.length > 0 ? updated : null;
}
exports.finalizePlanAfterSummarize = finalizePlanAfterSummarize;
function shouldContinuePlanAfterSummarize(plan, workflowRun, workflowNodeDefs) {
    const { step, workflowNodeAction } = resolvePlanExecutionStep({
        taskPlan: plan,
        workflowRun,
        workflowNodeDefs,
    });
    const route = resolvePlanStepExecutionRoute(step, workflowNodeAction);
    return route === 'llm' || route === 'workflow';
}
exports.shouldContinuePlanAfterSummarize = shouldContinuePlanAfterSummarize;
function resolveTaskPlanInitialAdvance(input) {
    var _a, _b;
    const firstStepId = (_a = input.plan.pendingStepIds[0]) !== null && _a !== void 0 ? _a : input.plan.currentStepId;
    const firstStep = getStepById(input.plan, firstStepId);
    if (!firstStep || !isPlanTextGenerationStep(firstStep)) {
        return null;
    }
    if (input.plan.constraints.includes('chitchat')) {
        return null;
    }
    const planRunContext = (_b = input.planRunContext) !== null && _b !== void 0 ? _b : 'fresh';
    if (planRunContext !== 'resume' &&
        !(0, page_context_execution_policy_util_1.planInitialSummarizeReadyOnFresh)({
            planSource: input.plan.source,
            planConstraints: input.plan.constraints,
            runOwnedObservations: input.runOwnedObservations,
            allObservations: input.allObservations,
        })) {
        return null;
    }
    const merged = input.buildMergedObservation(input.allObservations);
    const summaryObservation = buildPlanSummarizeObservation({
        userMessage: input.userMessage,
        merged,
    });
    return {
        updatedPlan: input.plan,
        summaryObservation,
        reason: 'plan_initial_summarize',
    };
}
exports.resolveTaskPlanInitialAdvance = resolveTaskPlanInitialAdvance;
function observationArgsFingerprint(observation) {
    var _a;
    const args = (_a = observation.llmPayload) === null || _a === void 0 ? void 0 : _a.args;
    if (!args || typeof args !== 'object') {
        return '';
    }
    try {
        return JSON.stringify(args);
    }
    catch (_b) {
        return '';
    }
}
function completedGatherToolStepsForPlan(plan, workflowRun) {
    const pending = new Set(plan.pendingStepIds);
    let steps = plan.steps.filter((step) => step.kind === 'tool' && step.toolRole && !pending.has(step.id));
    if (plan.deliverable === 'detail') {
        const detailSteps = steps.filter((step) => step.toolRole === 'read-detail');
        if (detailSteps.length > 0) {
            steps = detailSteps;
        }
    }
    else if (plan.deliverable === 'list' || plan.deliverable === 'analysis') {
        const listSteps = steps.filter((step) => step.toolRole === 'read-list');
        if (listSteps.length > 0) {
            steps = listSteps;
        }
    }
    else if (plan.deliverable === 'mutation') {
        const readSteps = steps.filter((step) => step.toolRole === 'read-detail' || step.toolRole === 'read-list');
        const pendingStep = resolveEffectivePlanStep({
            taskPlan: plan,
            workflowRun,
        });
        const terminalMutationSummarize = (pendingStep === null || pendingStep === void 0 ? void 0 : pendingStep.kind) === 'summarize' && plan.pendingStepIds.length <= 1;
        const writeSteps = terminalMutationSummarize
            ? steps.filter((step) => isPlanWriteExecutionStepInMutationFlow(step))
            : [];
        steps =
            readSteps.length > 0 || writeSteps.length > 0
                ? [...readSteps, ...writeSteps]
                : [];
    }
    return steps;
}
function filterObservationsForPlanSummarize(input) {
    const strict = input.strict === true;
    const gatherSteps = completedGatherToolStepsForPlan(input.plan, input.workflowRun);
    if (gatherSteps.length === 0) {
        return { observations: input.observations, filterMiss: false };
    }
    const allowedToolNames = new Set();
    for (const step of gatherSteps) {
        const names = matchingToolNamesForPlanStep(step, input.scopedTools);
        if (names) {
            for (const name of names) {
                allowedToolNames.add(name);
            }
        }
    }
    if (allowedToolNames.size === 0) {
        return {
            observations: strict ? [] : input.observations,
            filterMiss: strict && input.observations.length > 0,
        };
    }
    const filtered = input.observations.filter((row) => allowedToolNames.has(row.name));
    if (filtered.length === 0) {
        return {
            observations: strict ? [] : input.observations,
            filterMiss: strict && input.observations.length > 0,
        };
    }
    const deduped = new Map();
    for (const row of filtered) {
        const key = `${row.name}:${observationArgsFingerprint(row)}`;
        deduped.set(key, row);
    }
    return { observations: [...deduped.values()], filterMiss: false };
}
exports.filterObservationsForPlanSummarize = filterObservationsForPlanSummarize;
function observationsForPlanSummarize(input) {
    return filterObservationsForPlanSummarize(Object.assign(Object.assign({}, input), { strict: false })).observations;
}
exports.observationsForPlanSummarize = observationsForPlanSummarize;
function completedGatherStepsSatisfiedInObservations(input) {
    const gatherSteps = completedGatherToolStepsForPlan(input.plan);
    return gatherSteps.some((step) => isPlanToolStepSatisfiedByObservations({
        step,
        observations: input.observations,
        scopedTools: input.scopedTools,
        taskPlan: input.plan,
        purpose: 'observation_bucket',
    }));
}
exports.completedGatherStepsSatisfiedInObservations = completedGatherStepsSatisfiedInObservations;
function buildPlanSummarizeObservation(input) {
    var _a;
    const resolved = (_a = input.summarizeObservation) !== null && _a !== void 0 ? _a : input.merged;
    return (resolved !== null && resolved !== void 0 ? resolved : {
        name: 'direct_user',
        output: { userMessage: input.userMessage.trim() },
    });
}
exports.buildPlanSummarizeObservation = buildPlanSummarizeObservation;
function resolveSummarizeUserMessageForPlan(latestUserMessage, plan) {
    var _a;
    const original = (_a = plan === null || plan === void 0 ? void 0 : plan.originalUserRequest) === null || _a === void 0 ? void 0 : _a.trim();
    if (original) {
        return original;
    }
    return latestUserMessage.trim();
}
exports.resolveSummarizeUserMessageForPlan = resolveSummarizeUserMessageForPlan;
function isIntermediatePlanTextGenerationStep(plan) {
    var _a;
    const step = getPendingPlanStep(plan);
    if (!step || !isPlanTextGenerationStep(step)) {
        return false;
    }
    if (step.kind === 'reason') {
        return true;
    }
    return ((_a = plan === null || plan === void 0 ? void 0 : plan.pendingStepIds.length) !== null && _a !== void 0 ? _a : 0) > 1;
}
exports.isIntermediatePlanTextGenerationStep = isIntermediatePlanTextGenerationStep;
function resolvePlanSummarizePublishMode(plan) {
    if (isIntermediatePlanTextGenerationStep(plan)) {
        return { artifactPhase: 'draft', emitAuthoritativeFull: false };
    }
    return { artifactPhase: 'final', emitAuthoritativeFull: true };
}
exports.resolvePlanSummarizePublishMode = resolvePlanSummarizePublishMode;
function formatPlanContextForSummarize(plan) {
    if (!plan) {
        return null;
    }
    const step = getPendingPlanToolStep(plan);
    const constraintBlock = (0, plan_goal_util_1.formatPlanConstraintsForPrompt)(plan.constraints);
    const lines = [
        `Goal: ${plan.goal}`,
        `Deliverable: ${plan.deliverable}`,
        `Original request: ${plan.originalUserRequest}`,
        ...(constraintBlock ? [`Constraints:\n${constraintBlock}`] : []),
        step
            ? `Current step (${step.id}, kind=${step.kind}, phase=${step.phase}): ${step.objective}`
            : `Current objective: ${plan.currentObjective}`,
    ];
    return lines.join('\n');
}
exports.formatPlanContextForSummarize = formatPlanContextForSummarize;
function buildDecisionUserFrame(input) {
    const trimmed = input.latestUserMessage.trim();
    if (input.taskPlan) {
        const parts = [
            `<user_intent>\nOriginal request: ${input.taskPlan.originalUserRequest}\nGoal: ${input.taskPlan.goal}\nDeliverable: ${input.taskPlan.deliverable}\n</user_intent>`,
            `<current_objective>\n${input.taskPlan.currentObjective}\n</current_objective>`,
        ];
        return {
            role: 'user',
            content: parts.join('\n\n'),
        };
    }
    if (!trimmed) {
        return null;
    }
    return {
        role: 'user',
        content: `<current_user_request>\n${trimmed}\n</current_user_request>`,
    };
}
exports.buildDecisionUserFrame = buildDecisionUserFrame;
//# sourceMappingURL=task-plan.util.js.map