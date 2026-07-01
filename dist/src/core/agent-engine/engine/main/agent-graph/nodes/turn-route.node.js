"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTurnRouteNode = void 0;
const client_1 = require("../../../../../../../generated/prisma/client");
const host_tool_resolve_debug_util_1 = require("../../../../../host-bridge/host-tool-resolve-debug.util");
const agent_run_steps_util_1 = require("../../run/agent-run-steps.util");
const outer_plan_skill_resolve_util_1 = require("../../plan/outer-plan-skill-resolve.util");
const turn_routing_llm_util_1 = require("../../../turn/turn-routing-llm.util");
const finalize_turn_write_channel_util_1 = require("../../../turn/finalize-turn-write-channel.util");
const turn_execution_contract_util_1 = require("../../../turn/turn-execution-contract.util");
const derive_skill_execution_channels_util_1 = require("../../../../../workflow/derive-skill-execution-channels.util");
const load_skill_execution_channels_util_1 = require("../../../../../workflow/load-skill-execution-channels.util");
const turn_scoped_tools_util_1 = require("../../../turn/turn-scoped-tools.util");
const turn_routing_util_1 = require("../../../turn/turn-routing.util");
const page_context_usage_util_1 = require("../../../../../host-bridge/page-context-usage.util");
const page_context_execution_policy_util_1 = require("../../../../../host-bridge/page-context-execution-policy.util");
const skill_runnable_util_1 = require("../../../../../skill/skill-runnable.util");
function resolveRequestedSkillRowForTurnRoute(input) {
    var _a;
    if (input.requestedSkillId == null) {
        return null;
    }
    return ((_a = input.availableSkills.find((skill) => skill.id === input.requestedSkillId)) !== null && _a !== void 0 ? _a : null);
}
function resolveRequestedSkillForContract(input) {
    if (input.requestedSkillId == null) {
        return null;
    }
    if (input.requestedSkillRow) {
        return {
            id: input.requestedSkillRow.id,
            name: input.requestedSkillRow.name,
            skillToolIds: input.requestedSkillRow.skillToolIds,
            hostToolIds: input.requestedSkillRow.hostToolIds,
            runnableKind: input.requestedSkillRow.runnableKind,
            workflowId: input.requestedSkillRow.workflowId,
            workflowVersion: input.requestedSkillRow.workflowVersion,
            riskLevel: input.requestedSkillRow.riskLevel,
            config: input.requestedSkillRow.config,
        };
    }
    if (input.requestedSkillCtx &&
        input.requestedSkillCtx.skillId === input.requestedSkillId) {
        const caps = (0, skill_runnable_util_1.normalizeSkillRunnableCapabilities)(input.requestedSkillCtx.skill);
        return {
            id: input.requestedSkillCtx.skillId,
            name: input.requestedSkillCtx.skill.name,
            skillToolIds: caps.skillToolIds,
            hostToolIds: caps.hostToolIds,
            runnableKind: (0, skill_runnable_util_1.deriveSkillRunnableKind)(caps),
        };
    }
    return null;
}
async function resolveRequestedSkillExecutionChannels(prisma, requestedSkill) {
    var _a, _b, _c, _d;
    if (!requestedSkill) {
        return derive_skill_execution_channels_util_1.EMPTY_SKILL_EXECUTION_CHANNELS;
    }
    let workflowId = (_a = requestedSkill.workflowId) !== null && _a !== void 0 ? _a : null;
    let workflowVersion = (_b = requestedSkill.workflowVersion) !== null && _b !== void 0 ? _b : null;
    if (workflowId == null || workflowId <= 0) {
        const skillRow = await prisma.skill.findUnique({
            where: { id: requestedSkill.id },
            select: { workflowId: true, workflowVersion: true },
        });
        workflowId = (_c = skillRow === null || skillRow === void 0 ? void 0 : skillRow.workflowId) !== null && _c !== void 0 ? _c : null;
        workflowVersion = (_d = skillRow === null || skillRow === void 0 ? void 0 : skillRow.workflowVersion) !== null && _d !== void 0 ? _d : workflowVersion;
    }
    if (workflowId != null && workflowId > 0) {
        return (0, load_skill_execution_channels_util_1.loadSkillExecutionChannels)(prisma, {
            workflowId,
            workflowVersion,
            skillToolIds: requestedSkill.skillToolIds,
            hostToolIds: requestedSkill.hostToolIds,
        });
    }
    return (0, derive_skill_execution_channels_util_1.deriveSkillExecutionChannels)({
        nodes: [],
        skillToolIds: requestedSkill.skillToolIds,
        hostToolIds: requestedSkill.hostToolIds,
    });
}
function readIntentStepOutput(steps) {
    for (let i = steps.length - 1; i >= 0; i -= 1) {
        const row = steps[i];
        if (row.type !== 'intent') {
            continue;
        }
        if (row.output && typeof row.output === 'object') {
            return row.output;
        }
    }
    return null;
}
function intentRecallMatchesFromStep(intentOutput) {
    const raw = intentOutput === null || intentOutput === void 0 ? void 0 : intentOutput.recallMatches;
    if (!Array.isArray(raw)) {
        return [];
    }
    return raw
        .map((row) => {
        if (!row || typeof row !== 'object') {
            return null;
        }
        const item = row;
        const id = item.id;
        const label = item.label;
        const score = item.score;
        if (typeof id !== 'number' || typeof label !== 'string') {
            return null;
        }
        return {
            id,
            label,
            score: typeof score === 'number' ? score : 0,
        };
    })
        .filter((row) => row != null);
}
function createTurnRouteNode(bundle) {
    const { deps, ctx, runHelpers } = bundle;
    return async (state) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
        const stepNum = (0, agent_run_steps_util_1.nextRunStepNumber)(state.steps);
        deps.sse.emitThink(ctx.input.sessionId, ctx.input.runId, '正在判断本轮任务类型…\n', 'replace');
        const requestedSkillId = (_a = ctx.input.requestedSkillId) !== null && _a !== void 0 ? _a : null;
        const pageContextForRoute = (_c = (_b = state.pageContext) !== null && _b !== void 0 ? _b : ctx.input.pageContext) !== null && _c !== void 0 ? _c : null;
        const hostBundle = await runHelpers.loadScopedHostTools(ctx.input, pageContextForRoute, requestedSkillId);
        const scopedHostToolIds = hostBundle.scopedHostTools.map((tool) => tool.id);
        const availableSkills = await deps.skillService.resolveSkillsForOuterPlan({
            agentId: ctx.input.agentId,
            userId: ctx.input.userId,
            appClientId: ctx.input.appClientId,
            scopedTools: state.scopedTools,
            scopedHostToolIds,
            requestedSkillId,
        });
        const autoSkillCandidate = scopedHostToolIds.length > 0
            ? (0, outer_plan_skill_resolve_util_1.resolveAutoOuterPlanSkill)({
                availableSkills,
                scopedHostToolIds,
            })
            : null;
        const intentOutput = readIntentStepOutput(state.steps);
        const requestedSkillRow = resolveRequestedSkillRowForTurnRoute({
            requestedSkillId,
            availableSkills,
        });
        const requestedSkillBase = resolveRequestedSkillForContract({
            requestedSkillId,
            requestedSkillRow,
            requestedSkillCtx: ctx.requestedSkillCtx,
        });
        const executionChannels = await resolveRequestedSkillExecutionChannels(deps.prisma, requestedSkillBase);
        const routeInput = {
            userMessage: ctx.input.latestUserMessage,
            pageContext: pageContextForRoute,
            intentRecallMatches: intentRecallMatchesFromStep(intentOutput),
            availableSkills: availableSkills.map((skill) => ({
                id: skill.id,
                name: skill.name,
                description: skill.description,
            })),
            availableHostTools: hostBundle.scopedHostTools.map((tool) => ({
                name: tool.name,
                description: tool.description,
            })),
            pageHostSkillCandidate: autoSkillCandidate
                ? {
                    id: autoSkillCandidate.skill.id,
                    name: autoSkillCandidate.skill.name,
                }
                : null,
            requestedSkill: requestedSkillRow
                ? {
                    id: requestedSkillRow.id,
                    name: requestedSkillRow.name,
                    description: requestedSkillRow.description,
                }
                : null,
            requestedSkillExecutionChannels: executionChannels,
        };
        const llmRoutingDecision = await (0, turn_routing_llm_util_1.resolveTurnRoute)({
            llmService: deps.llmService,
            promptRegistry: deps.promptRegistry,
            scope: ctx.promptScope,
            routeInput,
        });
        const turnRoutingDecisionRaw = (0, turn_routing_util_1.finalizeTurnRoutingDecision)({
            decision: llmRoutingDecision,
            pageContext: pageContextForRoute,
        });
        const requestedSkillForContract = requestedSkillBase
            ? Object.assign(Object.assign({}, requestedSkillBase), { executionChannels }) : null;
        const { writeChannel: effectiveWriteChannel, routing: turnRoutingDecision, skillChannelAnchored, } = (0, finalize_turn_write_channel_util_1.finalizeTurnWriteChannel)({
            routing: turnRoutingDecisionRaw,
            skillChannels: (_d = requestedSkillForContract === null || requestedSkillForContract === void 0 ? void 0 : requestedSkillForContract.executionChannels) !== null && _d !== void 0 ? _d : null,
        });
        const pageContextAppliesBoosted = turnRoutingDecision.pageContextApplies &&
            !llmRoutingDecision.pageContextApplies;
        const pageContextRouteCorrected = llmRoutingDecision.route !== turnRoutingDecision.route;
        const pageContextTaskKindBoosted = turnRoutingDecision.pageContextTaskKind !==
            llmRoutingDecision.pageContextTaskKind;
        const hostMutationIntentBoosted = turnRoutingDecision.hostMutationIntent &&
            !llmRoutingDecision.hostMutationIntent;
        const llmWriteChannelCorrected = llmRoutingDecision.llmWriteChannel !== effectiveWriteChannel;
        const turnExecutionContract = (0, turn_execution_contract_util_1.buildTurnExecutionContract)({
            routing: turnRoutingDecision,
            userMessage: ctx.input.latestUserMessage,
            toolsEnabled: true,
            requestedSkillId,
            requestedSkill: requestedSkillForContract,
            effectiveWriteChannel,
            pageHostCandidateId: (_e = autoSkillCandidate === null || autoSkillCandidate === void 0 ? void 0 : autoSkillCandidate.skill.id) !== null && _e !== void 0 ? _e : null,
            pageContext: pageContextForRoute,
        });
        const shouldMaterializePageContext = (0, page_context_execution_policy_util_1.shouldMaterializePageContextFromUsage)(turnExecutionContract.plan.pageContextUsage);
        const preloadedFromPageContext = shouldMaterializePageContext
            ? (0, page_context_usage_util_1.mergePageContextPreloadedObservations)((_f = state.preloadedToolObservations) !== null && _f !== void 0 ? _f : [], pageContextForRoute)
            : (_g = state.preloadedToolObservations) !== null && _g !== void 0 ? _g : [];
        (0, host_tool_resolve_debug_util_1.logHostToolResolve)('turn_route_decision', {
            runId: ctx.input.runId,
            sessionId: ctx.input.sessionId,
            route: turnRoutingDecision.route,
            method: turnRoutingDecision.method,
            reason: turnRoutingDecision.reason,
            suggestedSkillId: turnRoutingDecision.suggestedSkillId,
            pageHostSkillCandidateId: (_h = autoSkillCandidate === null || autoSkillCandidate === void 0 ? void 0 : autoSkillCandidate.skill.id) !== null && _h !== void 0 ? _h : null,
            hostToolNames: hostBundle.scopedHostTools.map((tool) => tool.name),
            pageContextUsage: turnExecutionContract.plan.pageContextUsage,
            pageContextPlan: turnExecutionContract.plan.pageContextPlan,
            pageContextAppliesBoosted,
            pageContextTaskKindBoosted,
            hostMutationIntent: turnRoutingDecision.hostMutationIntent,
            llmHostMutationIntent: llmRoutingDecision.hostMutationIntent,
            hostMutationIntentBoosted,
            pageContextRouteCorrected,
            llmRoute: llmRoutingDecision.route,
            skillAlignment: turnExecutionContract.skillAlignment,
        });
        const routeStep = {
            step: stepNum,
            type: 'route_plan',
            output: runHelpers.normalizeJsonLike({
                route: turnRoutingDecision.route,
                method: turnRoutingDecision.method,
                reason: turnRoutingDecision.reason,
                routeFallback: turnRoutingDecision.method !== 'llm',
                suggestedSkillId: turnRoutingDecision.suggestedSkillId,
                pageHostSkillCandidateId: (_j = autoSkillCandidate === null || autoSkillCandidate === void 0 ? void 0 : autoSkillCandidate.skill.id) !== null && _j !== void 0 ? _j : null,
                requestedSkillId,
                skillSelect: turnExecutionContract.plan.skillSelect,
                scopedToolsSource: turnExecutionContract.plan.scopedToolsSource,
                allowHostToolSteps: turnExecutionContract.plan.allowHostToolSteps,
                availableSkillIds: availableSkills.map((skill) => skill.id),
                availableHostToolNames: hostBundle.scopedHostTools.map((tool) => tool.name),
                pageContextUsage: turnExecutionContract.plan.pageContextUsage,
                pageContextPlan: turnExecutionContract.plan.pageContextPlan,
                pageContextTaskKind: turnRoutingDecision.pageContextTaskKind,
                hostMutationIntent: turnRoutingDecision.hostMutationIntent,
                llmWriteChannel: llmRoutingDecision.llmWriteChannel,
                llmWriteChannelDraft: llmRoutingDecision.llmWriteChannel,
                llmWriteChannelCorrected,
                llmPageContextApplies: llmRoutingDecision.pageContextApplies,
                llmPageContextTaskKind: llmRoutingDecision.llmPageContextTaskKind,
                llmHostMutationIntent: llmRoutingDecision.hostMutationIntent,
                pageContextAppliesBoosted,
                pageContextTaskKindBoosted,
                hostMutationIntentBoosted,
                pageContextRouteCorrected,
                skillChannelAnchored,
                effectiveWriteChannel,
                skillExecutionChannels: executionChannels,
                llmRoute: llmRoutingDecision.route,
                skillAlignment: turnExecutionContract.skillAlignment,
            }),
        };
        const stepsWithRoute = [...state.steps, routeStep];
        if (turnExecutionContract.terminalRespond) {
            const sessionGoa = ctx.getSessionGoa();
            if (((_k = sessionGoa === null || sessionGoa === void 0 ? void 0 : sessionGoa.activeTask) === null || _k === void 0 ? void 0 : _k.status) === 'in_progress' ||
                ((_l = sessionGoa === null || sessionGoa === void 0 ? void 0 : sessionGoa.activeTask) === null || _l === void 0 ? void 0 : _l.status) === 'awaiting_confirmation') {
                await deps.goaService.abandonActiveTask(ctx.input.sessionId);
                ctx.setSessionGoa(await deps.goaService.getPayload(ctx.input.sessionId));
            }
            await runHelpers.updateRun(ctx.input.runId, stepsWithRoute, client_1.AgentRunStatus.running);
            return runHelpers.buildTurnRespondState(Object.assign(Object.assign({}, state), { turnRoutingDecision,
                turnExecutionContract }), stepsWithRoute, Object.assign(Object.assign({}, turnExecutionContract.terminalRespond), { userMessage: ctx.input.latestUserMessage }));
        }
        await runHelpers.updateRun(ctx.input.runId, stepsWithRoute, client_1.AgentRunStatus.running);
        const intentScopedTools = (_m = state.intentScopedToolsBundle) !== null && _m !== void 0 ? _m : (0, turn_scoped_tools_util_1.bundleFromAllowedRunInput)({
            tools: ctx.input.tools,
            langChainTools: ctx.input.langChainTools,
            allowedToolIds: ctx.input.allowedToolIds,
        });
        const activeScopedTools = (0, turn_scoped_tools_util_1.applyTurnScopedToolsFromContract)({
            contract: turnExecutionContract,
            intentScopedTools,
            requestedSkillCtx: ctx.requestedSkillCtx,
        });
        const nextState = Object.assign(Object.assign(Object.assign({}, state), { steps: stepsWithRoute, turnRoutingDecision,
            turnExecutionContract, pageContext: pageContextForRoute, preloadedToolObservations: preloadedFromPageContext, scopedHostTools: hostBundle.scopedHostTools, scopedHostLangChainTools: hostBundle.scopedHostLangChainTools }), (0, turn_scoped_tools_util_1.spreadScopedToolsBundle)(activeScopedTools));
        return nextState;
    };
}
exports.createTurnRouteNode = createTurnRouteNode;
//# sourceMappingURL=turn-route.node.js.map