"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSummarizeNode = void 0;
const workflow_summarize_sync_util_1 = require("../../../../../workflow/workflow-summarize-sync.util");
const workflow_graph_routing_util_1 = require("../../../../../workflow/workflow-graph-routing.util");
const workflow_mutation_write_gate_util_1 = require("../../../../../workflow/workflow-mutation-write-gate.util");
const workflow_init_skip_util_1 = require("../../../../../workflow/workflow-init-skip.util");
const client_1 = require("../../../../../../../generated/prisma/client");
const agent_run_user_messages_util_1 = require("../../../agent-run-user-messages.util");
const graph_tool_observations_util_1 = require("../../../graph-tool-observations.util");
const host_tool_push_success_util_1 = require("../../host-tool/host-tool-push-success.util");
const observation_format_util_1 = require("../../../observation-format.util");
const message_blocks_util_1 = require("../../../message/message-blocks.util");
const tool_execution_status_util_1 = require("../../../tool/tool-execution-status.util");
const tool_plan_error_util_1 = require("../../../tool/tool-plan-error.util");
const turn_respond_util_1 = require("../../../turn/turn-respond.util");
const write_confirm_resume_summary_util_1 = require("../../../write-confirm-resume-summary.util");
const agent_run_steps_util_1 = require("../../run/agent-run-steps.util");
const plan_draft_reply_util_1 = require("../../plan-present/plan-draft-reply.util");
const plan_draft_summarize_util_1 = require("../../plan-present/plan-draft-summarize.util");
const plan_host_fill_util_1 = require("../../plan-present/plan-host-fill.util");
const host_tool_plan_util_1 = require("../../host-tool/host-tool-plan.util");
const plan_compose_write_util_1 = require("../../plan-present/plan-compose-write.util");
const task_plan_util_1 = require("../../plan/task-plan.util");
const plan_summarize_gate_util_1 = require("../../plan/plan-summarize-gate.util");
const plan_gather_clarification_gate_util_1 = require("../../plan/plan-gather-clarification-gate.util");
const plan_observation_scope_util_1 = require("../../plan/plan-observation-scope.util");
function createSummarizeNode(bundle) {
    const { deps, ctx, runHelpers, decision, summarize, hostToolHandle } = bundle;
    function mergeWorkflowSummarizeCompletion(base, input) {
        return Object.assign(Object.assign({}, base), (0, workflow_summarize_sync_util_1.applyWorkflowAfterSummarize)(base, input));
    }
    return async (state) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0;
        const pendingObservation = (0, turn_respond_util_1.resolveObservationForSummarize)(state.pendingRespond);
        if (!pendingObservation) {
            return state;
        }
        if ((0, plan_gather_clarification_gate_util_1.isPrematureGatherClarification)({
            taskPlan: state.taskPlan,
            workflowRun: state.workflowRun,
            observationBuckets: (0, plan_observation_scope_util_1.planObservationBucketsFromState)(state),
            pendingRespond: state.pendingRespond,
        })) {
            deps.logger.warn(`summarize suppressed premature gather clarification runId=${ctx.input.runId}`);
            const summarizeGate = (0, plan_summarize_gate_util_1.assessPlanSummarizeGate)({
                plan: state.taskPlan,
                observationBuckets: (0, plan_observation_scope_util_1.planObservationBucketsFromState)(state),
                scopedTools: state.scopedTools,
                workflowRun: state.workflowRun,
                workflowNodeDefs: state.workflowNodeDefs,
            });
            if (summarizeGate.status === 'rewind_gather') {
                return (0, plan_summarize_gate_util_1.applyPlanSummarizeRewind)(Object.assign(Object.assign({}, state), { pendingRespond: null }), summarizeGate);
            }
            const gatherRewind = (0, plan_summarize_gate_util_1.resolvePlanGatherRewindWhenToolsMissing)({
                plan: state.taskPlan,
                observationBuckets: (0, plan_observation_scope_util_1.planObservationBucketsFromState)(state),
                scopedTools: state.scopedTools,
                workflowRun: state.workflowRun,
                workflowNodeDefs: state.workflowNodeDefs,
            });
            if (gatherRewind) {
                return (0, plan_summarize_gate_util_1.applyPlanSummarizeRewind)(Object.assign(Object.assign({}, state), { pendingRespond: null }), gatherRewind);
            }
            return Object.assign(Object.assign({}, state), { pendingRespond: null });
        }
        if ((0, write_confirm_resume_summary_util_1.isWriteConfirmResumeSummaryObservation)(pendingObservation)) {
            const payload = pendingObservation.output;
            const summarizeObservation = summarize.buildSummarizeObservationFromState(state, {
                taskPlan: state.taskPlan,
                scopedTools: state.scopedTools,
            });
            const toolResultsText = summarizeObservation != null &&
                (0, observation_format_util_1.isSplitToolObservationsOutput)(summarizeObservation.output)
                ? (0, observation_format_util_1.formatSplitToolObservationsForSummarize)(summarizeObservation.output)
                : summarizeObservation != null
                    ? decision.stringifyForPrompt(summarizeObservation.output)
                    : undefined;
            const summarized = await summarize.summarizeWriteConfirmResume({
                payload,
                mergedToolOutput: summarizeObservation === null || summarizeObservation === void 0 ? void 0 : summarizeObservation.output,
                toolResultsText,
                confirmedPreviewSerialized: (_a = state.confirmedPreviewSerialized) !== null && _a !== void 0 ? _a : null,
                promptMessages: ctx.input.promptMessages,
                sessionId: ctx.input.sessionId,
                runId: ctx.input.runId,
                turnId: ctx.input.turnId,
                scope: ctx.promptScope,
                taskPlan: state.taskPlan,
            });
            const resolved = runHelpers.resolveAssistantOutputFromArtifact(ctx.input.sessionId, ctx.input.runId, summarized);
            const summaryStep = {
                step: (0, agent_run_steps_util_1.nextRunStepNumber)(state.steps),
                type: 'summarize',
                name: 'write_confirm_resume',
                output: resolved.stepPlain,
            };
            const nextSteps = [...state.steps, summaryStep];
            const taskPlanAfterSummarize = (0, task_plan_util_1.finalizePlanAfterSummarize)(state.taskPlan);
            await runHelpers.updateRun(ctx.input.runId, nextSteps, client_1.AgentRunStatus.success);
            return mergeWorkflowSummarizeCompletion(Object.assign(Object.assign({}, state), { steps: nextSteps, pendingRespond: null, taskPlan: taskPlanAfterSummarize, finalOutput: resolved.serialized, status: client_1.AgentRunStatus.success, finished: true }), { continuePlan: false, finished: true });
        }
        const primaryObservation = (0, observation_format_util_1.resolvePrimaryObservationForSummarize)(pendingObservation.output);
        const hostPushSuccess = (0, host_tool_push_success_util_1.resolveHostToolPushSuccessContent)({
            taskPlan: state.taskPlan,
            observations: (0, graph_tool_observations_util_1.allToolObservations)(state),
        });
        if (hostPushSuccess) {
            const stored = (0, message_blocks_util_1.serializeMessageBlocksForStorage)(hostPushSuccess.blocks);
            deps.sse.publishAssistantBlocks(ctx.input.sessionId, ctx.input.runId, hostPushSuccess.blocks);
            const summaryStep = {
                step: (0, agent_run_steps_util_1.nextRunStepNumber)(state.steps),
                type: 'summarize',
                name: hostPushSuccess.summaryStepName,
                output: hostPushSuccess.plainText,
            };
            const nextSteps = [...state.steps, summaryStep];
            await runHelpers.updateRun(ctx.input.runId, nextSteps, client_1.AgentRunStatus.success);
            return mergeWorkflowSummarizeCompletion(Object.assign(Object.assign({}, state), { steps: nextSteps, pendingRespond: null, taskPlan: (0, task_plan_util_1.finalizePlanAfterSummarize)(state.taskPlan), finalOutput: (_b = deps.assistantArtifact.peekSerialized(ctx.input.sessionId, ctx.input.runId)) !== null && _b !== void 0 ? _b : stored, status: client_1.AgentRunStatus.success, finished: true }), { continuePlan: false, finished: true });
        }
        const effectiveToolName = pendingObservation.name === observation_format_util_1.SPLIT_TOOL_OBSERVATIONS_NAME &&
            primaryObservation
            ? primaryObservation.name
            : pendingObservation.name;
        const toolDef = state.scopedTools.find((tool) => tool.name === effectiveToolName);
        const toolErrorObs = (0, agent_run_user_messages_util_1.isAgentToolErrorObservation)(pendingObservation.output)
            ? pendingObservation.output
            : null;
        const shouldSummarizeToolErrorWithLlm = toolErrorObs != null &&
            ((0, tool_execution_status_util_1.isMutationTool)(toolDef === null || toolDef === void 0 ? void 0 : toolDef.agentMetadata) ||
                ((_c = state.taskPlan) === null || _c === void 0 ? void 0 : _c.taskPhase) === 'mutate');
        const toolErrorHint = (0, agent_run_user_messages_util_1.extractToolErrorUserHint)(pendingObservation.output);
        if (toolErrorHint && !shouldSummarizeToolErrorWithLlm) {
            const errorBlocks = (0, message_blocks_util_1.buildRuleBasedMessageBlocks)({
                output: pendingObservation.output,
                userMessage: ctx.input.latestUserMessage,
                fieldLabels: {},
                toolErrorHint,
                downstreamResponseSource: toolErrorObs === null || toolErrorObs === void 0 ? void 0 : toolErrorObs.responseSource,
            });
            const stored = (0, message_blocks_util_1.serializeMessageBlocksForStorage)(errorBlocks);
            deps.sse.publishAssistantBlocks(ctx.input.sessionId, ctx.input.runId, errorBlocks);
            const summaryStep = {
                step: (0, agent_run_steps_util_1.nextRunStepNumber)(state.steps),
                type: 'summarize',
                name: pendingObservation.name,
                output: toolErrorHint,
            };
            const nextSteps = [...state.steps, summaryStep];
            await runHelpers.updateRun(ctx.input.runId, nextSteps, client_1.AgentRunStatus.success);
            return mergeWorkflowSummarizeCompletion(Object.assign(Object.assign({}, state), { steps: nextSteps, pendingRespond: null, taskPlan: state.planAborted
                    ? null
                    : (0, task_plan_util_1.finalizePlanAfterSummarize)(state.taskPlan), finalOutput: (_d = deps.assistantArtifact.peekSerialized(ctx.input.sessionId, ctx.input.runId)) !== null && _d !== void 0 ? _d : stored, status: client_1.AgentRunStatus.success, finished: true, planAborted: state.planAborted }), { continuePlan: false, finished: true });
        }
        const workflowInitSkipReason = (0, workflow_init_skip_util_1.latestWorkflowInitSkipReason)(state.steps);
        const reasonBeforeHostTool = !workflowInitSkipReason &&
            (0, plan_host_fill_util_1.isPlanReasonBeforeHostTool)(state.taskPlan);
        const taskPlanForSummarize = workflowInitSkipReason ? null : state.taskPlan;
        const presentingPlanStepId = taskPlanForSummarize
            ? (0, task_plan_util_1.resolveEffectivePlanStepId)({
                taskPlan: taskPlanForSummarize,
                workflowRun: state.workflowRun,
            })
            : null;
        const planSummarizeUserMessage = workflowInitSkipReason
            ? ctx.input.latestUserMessage
            : (0, task_plan_util_1.resolveSummarizeUserMessageForPlan)(ctx.input.latestUserMessage, state.taskPlan);
        const mergedPlanObservation = !workflowInitSkipReason &&
            (0, task_plan_util_1.isPendingPlanAnswerStep)(state.taskPlan, state.workflowRun, state.workflowNodeDefs)
            ? summarize.buildSummarizeObservationFromState(state, {
                taskPlan: state.taskPlan,
                scopedTools: state.scopedTools,
            })
            : null;
        const draftBeforeWrite = !workflowInitSkipReason &&
            mergedPlanObservation != null &&
            (0, plan_draft_summarize_util_1.isPlanDraftSummarizeBeforeWrite)((0, task_plan_util_1.planExecutionContextFromState)(state));
        const planSummarizePublishMode = draftBeforeWrite
            ? { artifactPhase: 'draft', emitAuthoritativeFull: true }
            : (0, task_plan_util_1.resolvePlanSummarizePublishMode)(state.taskPlan);
        let draftPendingWrite = null;
        let reasonHostFillResult = null;
        let summarized;
        if (reasonBeforeHostTool) {
            const observationForReasonHostFill = mergedPlanObservation !== null && mergedPlanObservation !== void 0 ? mergedPlanObservation : (0, task_plan_util_1.buildPlanSummarizeObservation)({
                userMessage: planSummarizeUserMessage,
            });
            reasonHostFillResult = await summarize.runPlanReasonHostFill(planSummarizeUserMessage, observationForReasonHostFill, (0, graph_tool_observations_util_1.allToolObservations)(state), ctx.input.promptMessages, ctx.input.sessionId, ctx.input.runId, ctx.promptScope, state.taskPlan, (_e = state.scopedHostTools) !== null && _e !== void 0 ? _e : [], (_f = state.pageContext) !== null && _f !== void 0 ? _f : null, ctx.input.turnId);
            summarized = reasonHostFillResult.serialized;
        }
        else if (draftBeforeWrite) {
            draftPendingWrite = await summarize.summarizePlanPresentWithPendingWrite(effectiveToolName, toolDef === null || toolDef === void 0 ? void 0 : toolDef.description, planSummarizeUserMessage, mergedPlanObservation, (0, graph_tool_observations_util_1.allToolObservations)(state), ctx.input.promptMessages, ctx.input.sessionId, ctx.input.runId, ctx.promptScope, state.taskPlan, state.scopedTools, state.workflowRun, state.workflowNodeDefs);
            summarized = draftPendingWrite.serialized;
        }
        else if (pendingObservation.name === turn_respond_util_1.CLARIFICATION_REQUEST_OBSERVATION_NAME) {
            summarized = await summarize.summarizeClarificationRequest(planSummarizeUserMessage, pendingObservation.output, ctx.input.promptMessages, ctx.input.sessionId, ctx.input.runId, ctx.promptScope, state.taskPlan, planSummarizePublishMode);
        }
        else if (pendingObservation.name === 'skill_intent_mismatch') {
            summarized = await summarize.summarizeSkillIntentMismatch(planSummarizeUserMessage, pendingObservation.output, ctx.input.promptMessages, ctx.input.sessionId, ctx.input.runId, ctx.promptScope, planSummarizePublishMode);
        }
        else if (pendingObservation.name === 'direct_user' ||
            pendingObservation.name === 'off_domain') {
            const observationBuckets = (0, plan_observation_scope_util_1.planObservationBucketsFromState)(state);
            const hasGatherEvidence = mergedPlanObservation != null ||
                (0, plan_summarize_gate_util_1.planSummarizeHasToolEvidence)({
                    plan: taskPlanForSummarize,
                    observationBuckets,
                    scopedTools: state.scopedTools,
                    workflowRun: state.workflowRun,
                });
            if ((0, plan_summarize_gate_util_1.planSummarizeRequiresToolEvidence)(taskPlanForSummarize) &&
                !hasGatherEvidence) {
                deps.logger.warn(`summarize blocked without gather evidence runId=${ctx.input.runId}`);
                summarized = (0, message_blocks_util_1.serializeMessageBlocksForStorage)([
                    (0, message_blocks_util_1.textBlock)('尚未拉取到可分析的真实数据。系统将先调用数据接口获取结果，再为您生成分析。'),
                ]);
            }
            else if (mergedPlanObservation) {
                summarized = await summarize.summarizeToolOutputForUser(mergedPlanObservation.name, (_g = state.scopedTools.find((tool) => tool.name === mergedPlanObservation.name)) === null || _g === void 0 ? void 0 : _g.description, planSummarizeUserMessage, mergedPlanObservation.output, (_h = mergedPlanObservation.fieldLabels) !== null && _h !== void 0 ? _h : {}, (_j = mergedPlanObservation.fieldDescriptions) !== null && _j !== void 0 ? _j : {}, (_k = mergedPlanObservation.enumLabelsByPath) !== null && _k !== void 0 ? _k : {}, ctx.input.promptMessages, ctx.input.sessionId, ctx.input.runId, ctx.promptScope, state.taskPlan, undefined, undefined, planSummarizePublishMode, undefined, state.workflowRun, state.workflowNodeDefs);
            }
            else {
                summarized = await summarize.summarizeDirectUserMessage(planSummarizeUserMessage, pendingObservation.output, ctx.input.promptMessages, ctx.input.sessionId, ctx.input.runId, ctx.promptScope, taskPlanForSummarize, planSummarizePublishMode, state.workflowRun, state.workflowNodeDefs);
            }
        }
        else if (pendingObservation.name === 'direct_reply') {
            summarized = await summarize.summarizeDirectLlmReply(ctx.input.latestUserMessage, pendingObservation.output, ctx.input.promptMessages, ctx.input.sessionId, ctx.input.runId, ctx.promptScope);
        }
        else {
            summarized = await summarize.summarizeToolOutputForUser(effectiveToolName, toolDef === null || toolDef === void 0 ? void 0 : toolDef.description, planSummarizeUserMessage, pendingObservation.output, (_l = pendingObservation.fieldLabels) !== null && _l !== void 0 ? _l : {}, (_m = pendingObservation.fieldDescriptions) !== null && _m !== void 0 ? _m : {}, (_o = pendingObservation.enumLabelsByPath) !== null && _o !== void 0 ? _o : {}, ctx.input.promptMessages, ctx.input.sessionId, ctx.input.runId, ctx.promptScope, state.taskPlan, toolDef === null || toolDef === void 0 ? void 0 : toolDef.agentMetadata, (_p = pendingObservation.llmPayload) === null || _p === void 0 ? void 0 : _p.args, planSummarizePublishMode, (0, graph_tool_observations_util_1.allToolObservations)(state), state.workflowRun, state.workflowNodeDefs);
        }
        if (!summarized || summarized.trim().length === 0) {
            const fallback = (0, message_blocks_util_1.messageBlocksToPlainText)((0, message_blocks_util_1.ensureAtLeastOneTextBlock)([], '抱歉，我暂时无法整理出有效回复。'));
            deps.logger.warn(`summarize returned empty runId=${ctx.input.runId} observation=${pendingObservation.name}`);
            const summaryStep = {
                step: (0, agent_run_steps_util_1.nextRunStepNumber)(state.steps),
                type: 'summarize',
                name: pendingObservation.name,
                output: fallback,
            };
            const nextSteps = [...state.steps, summaryStep];
            const stored = (0, message_blocks_util_1.serializeMessageBlocksForStorage)([
                (0, message_blocks_util_1.textBlock)(fallback),
            ]);
            await runHelpers.updateRun(ctx.input.runId, nextSteps, client_1.AgentRunStatus.success);
            deps.sse.publishAssistantBlocks(ctx.input.sessionId, ctx.input.runId, [
                (0, message_blocks_util_1.textBlock)(fallback),
            ]);
            return mergeWorkflowSummarizeCompletion(Object.assign(Object.assign({}, state), { steps: nextSteps, pendingRespond: null, taskPlan: (0, task_plan_util_1.finalizePlanAfterSummarize)(state.taskPlan), finalOutput: (_q = deps.assistantArtifact.peekSerialized(ctx.input.sessionId, ctx.input.runId)) !== null && _q !== void 0 ? _q : stored, status: client_1.AgentRunStatus.success, finished: true }), { continuePlan: false, finished: true });
        }
        const storedSummarized = runHelpers.sanitizeFinalOutput(summarized);
        const storedBlocks = (0, message_blocks_util_1.tryParseStoredMessageBlocks)(storedSummarized);
        const artifactPlain = deps.assistantArtifact.peek(ctx.input.sessionId, ctx.input.runId)
            ? deps.assistantArtifact.formatOutput(ctx.input.sessionId, ctx.input.runId, storedSummarized).stepPlain
            : null;
        const draftStepPlain = (reasonHostFillResult === null || reasonHostFillResult === void 0 ? void 0 : reasonHostFillResult.draftReply.trim())
            ? reasonHostFillResult.draftReply.trim()
            : (draftPendingWrite === null || draftPendingWrite === void 0 ? void 0 : draftPendingWrite.draftReply.trim())
                ? draftPendingWrite.draftReply.trim()
                : null;
        const stepPlain = (_r = draftStepPlain !== null && draftStepPlain !== void 0 ? draftStepPlain : artifactPlain) !== null && _r !== void 0 ? _r : (storedBlocks && storedBlocks.length > 0
            ? (0, message_blocks_util_1.messageBlocksToPlainText)(storedBlocks)
            : storedSummarized);
        const summaryStep = {
            step: (0, agent_run_steps_util_1.nextRunStepNumber)(state.steps),
            type: 'summarize',
            name: workflowInitSkipReason
                ? `workflow_init_skipped:${workflowInitSkipReason}`
                : summarize.resolveSummarizeStepName(state.taskPlan, pendingObservation.name),
            output: stepPlain,
            meta: summarize.resolveSummarizeStepMeta(pendingObservation),
        };
        const nextSteps = [...state.steps, summaryStep];
        const terminalTurnRespond = (0, turn_respond_util_1.isTerminalTurnRespondPending)(state.pendingRespond);
        const taskPlanAfterSummarize = state.planAborted || terminalTurnRespond
            ? state.planAborted
                ? null
                : state.taskPlan
            : (0, task_plan_util_1.finalizePlanAfterSummarize)(state.taskPlan);
        const presentMutationContinues = ((_t = (0, workflow_graph_routing_util_1.getWorkflowNodeDef)(state.workflowNodeDefs, (_s = state.workflowRun) === null || _s === void 0 ? void 0 : _s.currentNodeId)) === null || _t === void 0 ? void 0 : _t.action) === 'present_mutation';
        const continuePlan = !terminalTurnRespond &&
            !state.planAborted &&
            !(toolErrorObs != null && (0, tool_plan_error_util_1.isTerminalPlanToolError)(toolErrorObs)) &&
            (presentMutationContinues ||
                (0, task_plan_util_1.shouldContinuePlanAfterSummarize)(taskPlanAfterSummarize, state.workflowRun, state.workflowNodeDefs));
        if (continuePlan && planSummarizePublishMode.artifactPhase === 'draft') {
            deps.assistantArtifact.rephase(ctx.input.sessionId, ctx.input.runId, 'draft');
        }
        await runHelpers.updateRun(ctx.input.runId, nextSteps, continuePlan ? client_1.AgentRunStatus.running : client_1.AgentRunStatus.success);
        let observationsWithMachineLayer = state.toolObservations;
        if (draftBeforeWrite && (draftPendingWrite === null || draftPendingWrite === void 0 ? void 0 : draftPendingWrite.machineLayerDirty)) {
            const patchResult = (0, plan_compose_write_util_1.patchLatestPlanComposeWriteObservation)(state.toolObservations, draftPendingWrite.machineLayer);
            observationsWithMachineLayer = patchResult.observations;
            if (!patchResult.patched) {
                deps.logger.warn(`plan_compose_write patch missed: observation not found runId=${ctx.input.runId} tool=${(_v = (_u = draftPendingWrite.machineLayer) === null || _u === void 0 ? void 0 : _u.tool) !== null && _v !== void 0 ? _v : 'unknown'}`);
            }
        }
        const gateResult = draftBeforeWrite && taskPlanAfterSummarize
            ? (0, plan_draft_summarize_util_1.resolveComposedWriteGateCallResult)({
                observations: observationsWithMachineLayer,
                taskPlan: taskPlanAfterSummarize,
                scopedTools: state.scopedTools,
                pageContext: (_w = state.pageContext) !== null && _w !== void 0 ? _w : null,
            })
            : null;
        const pendingWriteForGate = (_x = gateResult === null || gateResult === void 0 ? void 0 : gateResult.call) !== null && _x !== void 0 ? _x : null;
        if (draftBeforeWrite && taskPlanAfterSummarize && gateResult) {
            if (pendingWriteForGate) {
                deps.logger.log(`compose gate ready after present runId=${ctx.input.runId} stage=${gateResult.stage} ${(0, plan_draft_summarize_util_1.formatComposedWriteGateDiagnosticForLog)(gateResult)}`);
            }
            else {
                deps.logger.warn(`compose gate unresolved after present runId=${ctx.input.runId} stage=${gateResult.stage} ${(0, plan_draft_summarize_util_1.formatComposedWriteGateDiagnosticForLog)(gateResult)}`);
            }
        }
        if (draftBeforeWrite &&
            pendingWriteForGate &&
            draftPendingWrite &&
            taskPlanAfterSummarize) {
            draftPendingWrite = Object.assign(Object.assign({}, draftPendingWrite), { submitText: (0, plan_draft_summarize_util_1.syncPlanPresentSubmitTextForGate)({
                    submitText: draftPendingWrite.submitText,
                    gateCall: pendingWriteForGate,
                    observations: observationsWithMachineLayer,
                    taskPlan: taskPlanAfterSummarize,
                    scopedTools: state.scopedTools,
                }) || draftPendingWrite.submitText });
        }
        const draftWriteTool = pendingWriteForGate
            ? state.scopedTools.find((tool) => tool.name === pendingWriteForGate.name)
            : undefined;
        const draftReplyContent = continuePlan && draftPendingWrite && pendingWriteForGate
            ? (0, plan_draft_summarize_util_1.resolvePlanDraftReplyContentForGateObservation)({
                draftReply: draftPendingWrite.draftReply,
                submitText: draftPendingWrite.submitText,
                gateCall: pendingWriteForGate,
                writeTool: draftWriteTool,
            })
            : null;
        const draftObservation = draftReplyContent != null
            ? (0, plan_draft_reply_util_1.buildPlanDraftReplyObservation)({
                draftReply: draftReplyContent.draftReply,
                submitText: draftReplyContent.submitText,
                planStepId: (_y = (0, task_plan_util_1.resolveEffectivePlanStepId)({
                    taskPlan: state.taskPlan,
                    workflowRun: state.workflowRun,
                })) !== null && _y !== void 0 ? _y : null,
                pendingWriteToolCall: pendingWriteForGate,
            })
            : null;
        let observationsAfterDraft = draftObservation
            ? [...observationsWithMachineLayer, draftObservation]
            : [...observationsWithMachineLayer];
        if (continuePlan && reasonHostFillResult) {
            observationsAfterDraft = [
                ...observationsAfterDraft,
                reasonHostFillResult.hostFillObservation,
                reasonHostFillResult.draftReplyObservation,
            ];
            if (reasonHostFillResult.hostToolStreamObservation) {
                observationsAfterDraft = [
                    ...observationsAfterDraft,
                    reasonHostFillResult.hostToolStreamObservation,
                ];
            }
            if ((_z = reasonHostFillResult.hostToolDispatchObservations) === null || _z === void 0 ? void 0 : _z.length) {
                observationsAfterDraft = [
                    ...observationsAfterDraft,
                    ...reasonHostFillResult.hostToolDispatchObservations,
                ];
            }
        }
        let pendingToolCallsFromDraft = pendingWriteForGate != null ? [pendingWriteForGate] : [];
        if (pendingToolCallsFromDraft.length > 0 &&
            (0, workflow_mutation_write_gate_util_1.shouldDeferPlanPresentWriteGate)({
                workflowRun: state.workflowRun,
                workflowNodeDefs: state.workflowNodeDefs,
            })) {
            pendingToolCallsFromDraft = [];
        }
        if (pendingToolCallsFromDraft.length > 0) {
            deps.sse.emitThink(ctx.input.sessionId, ctx.input.runId, '正在准备写操作确认…\n', 'delta');
        }
        let resultState = Object.assign(Object.assign({}, state), { steps: nextSteps, toolObservations: observationsAfterDraft, pendingRespond: null, pendingToolCalls: pendingToolCallsFromDraft, taskPlan: taskPlanAfterSummarize, finalOutput: runHelpers.graphFinalOutputFromArtifact(ctx.input.sessionId, ctx.input.runId, continuePlan, state.finalOutput), status: continuePlan ? client_1.AgentRunStatus.running : client_1.AgentRunStatus.success, finished: !continuePlan, planAborted: state.planAborted });
        const reasonHostFillDispatched = continuePlan &&
            (reasonHostFillResult === null || reasonHostFillResult === void 0 ? void 0 : reasonHostFillResult.submitText.trim()) &&
            taskPlanAfterSummarize != null;
        if (reasonHostFillDispatched) {
            const pendingHostStep = (0, task_plan_util_1.getPendingPlanHostToolStep)(taskPlanAfterSummarize, state.workflowRun);
            const hostToolsForPrompt = (0, host_tool_plan_util_1.filterHostToolsForPlanStep)((_0 = state.scopedHostTools) !== null && _0 !== void 0 ? _0 : [], taskPlanAfterSummarize, {
                workflowRun: state.workflowRun,
                workflowNodeDefs: state.workflowNodeDefs,
            });
            if (pendingHostStep && hostToolsForPrompt.length > 0) {
                const dispatched = hostToolHandle.tryDispatchHostToolFromPlanDraft({
                    graphState: resultState,
                    pendingHostStep,
                    hostToolsForPrompt,
                    observationsForLlm: observationsAfterDraft,
                    llmStepNumber: (0, agent_run_steps_util_1.nextRunStepNumber)(nextSteps),
                    nextIteration: state.iteration + 1,
                    steps: nextSteps,
                });
                if (dispatched) {
                    resultState = Object.assign(Object.assign({}, dispatched), { finished: resultState.finished, status: resultState.status, finalOutput: resultState.finalOutput });
                    await runHelpers.updateRun(ctx.input.runId, resultState.steps, resultState.status);
                    return mergeWorkflowSummarizeCompletion(resultState, {
                        continuePlan,
                        finished: resultState.finished,
                        summarizedPlanStepId: presentingPlanStepId,
                    });
                }
            }
        }
        else if (continuePlan && !reasonHostFillResult) {
            deps.sse.emitThink(ctx.input.sessionId, ctx.input.runId, '中间结果已生成，继续执行后续任务步骤…\n', 'delta');
        }
        return mergeWorkflowSummarizeCompletion(resultState, {
            continuePlan,
            finished: resultState.finished,
            summarizedPlanStepId: presentingPlanStepId,
        });
    };
}
exports.createSummarizeNode = createSummarizeNode;
//# sourceMappingURL=summarize.node.js.map