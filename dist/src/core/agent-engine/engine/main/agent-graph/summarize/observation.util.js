"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPendingPlanSummaryObservation = exports.assessObservationQualityForResume = exports.buildWriteConfirmResumeFallbackBlocks = exports.buildWriteConfirmResumeFallbackPlainText = exports.buildSummarizeFallbackPlainText = exports.resolveSummarizePromptKey = exports.resolveSummarizeStepMeta = exports.resolveSummarizeStepName = exports.buildSkillIntentMismatchFallbackPlainText = exports.parseSkillIntentMismatchOutput = exports.parseClarificationRequestOutput = exports.extractDirectUserGuidanceHint = exports.extractDirectReplyDraft = exports.buildDirectReplyObservation = exports.resolveLlmCompletionAfterTools = exports.buildSummarizeObservationFromState = exports.filterUsableToolObservations = exports.resolveToolStepCode = exports.hasBusinessKeySignal = exports.assessObservationQuality = exports.isLowQualityToolObservation = void 0;
const prompt_template_keys_1 = require("../../../../../prompt/prompt-template.keys");
const message_blocks_util_1 = require("../../../message/message-blocks.util");
const observation_format_util_1 = require("../../../observation-format.util");
const agent_run_user_messages_util_1 = require("../../../agent-run-user-messages.util");
const tool_observation_util_1 = require("../../../tool/tool-observation.util");
const graph_tool_observations_util_1 = require("../../../graph-tool-observations.util");
const workflow_node_outputs_summarize_util_1 = require("../../../../../workflow/workflow-node-outputs-summarize.util");
const tool_execution_status_util_1 = require("../../../tool/tool-execution-status.util");
const llm_output_sanitize_util_1 = require("../../../llm-output-sanitize.util");
const task_plan_util_1 = require("../../plan/task-plan.util");
const summarize_memory_scope_util_1 = require("../../summarize/summarize-memory-scope.util");
const plan_observation_scope_util_1 = require("../../plan/plan-observation-scope.util");
const decision_util_1 = require("../runtime/decision.util");
function isLowQualityToolObservation(observation) {
    if (!observation) {
        return true;
    }
    if ((0, agent_run_user_messages_util_1.isAgentToolErrorObservation)(observation.output)) {
        return true;
    }
    if ((0, tool_observation_util_1.isEmptyListToolObservation)(observation.output)) {
        return false;
    }
    const output = observation.output;
    if (output == null) {
        return true;
    }
    if (typeof output === 'string') {
        return output.trim().length === 0;
    }
    if (Array.isArray(output)) {
        return output.length === 0;
    }
    if (typeof output !== 'object') {
        return false;
    }
    const row = output;
    if (Object.keys(row).length === 0) {
        return true;
    }
    const data = row['data'];
    if (Array.isArray(data) && data.length === 0) {
        return false;
    }
    if (data && typeof data === 'object' && !Array.isArray(data)) {
        return Object.keys(data).length === 0;
    }
    return false;
}
exports.isLowQualityToolObservation = isLowQualityToolObservation;
function assessObservationQuality(output, agentMetadata) {
    if ((0, agent_run_user_messages_util_1.isAgentToolErrorObservation)(output)) {
        return 'low';
    }
    if ((0, tool_execution_status_util_1.isMutationTool)(agentMetadata)) {
        return 'medium';
    }
    if (output == null) {
        return 'low';
    }
    if (typeof output === 'string') {
        const text = output.trim();
        if (!text) {
            return 'low';
        }
        return text.length >= 12 ? 'medium' : 'low';
    }
    if (typeof output === 'number' || typeof output === 'boolean') {
        return 'low';
    }
    if (Array.isArray(output)) {
        if (output.length === 0) {
            return 'low';
        }
        const first = output[0];
        if (!first || typeof first !== 'object' || Array.isArray(first)) {
            return 'medium';
        }
        return hasBusinessKeySignal(first)
            ? 'high'
            : 'medium';
    }
    if (typeof output !== 'object') {
        return 'low';
    }
    const row = output;
    if (Object.keys(row).length === 0) {
        return 'low';
    }
    const data = row['data'];
    if (Array.isArray(data) && data.length === 0) {
        return 'medium';
    }
    if (data && typeof data === 'object' && !Array.isArray(data)) {
        const dataRow = data;
        if (Object.keys(dataRow).length === 0) {
            return 'low';
        }
        if (hasBusinessKeySignal(dataRow)) {
            return 'high';
        }
        return 'medium';
    }
    if (hasBusinessKeySignal(row)) {
        return 'high';
    }
    return 'medium';
}
exports.assessObservationQuality = assessObservationQuality;
function hasBusinessKeySignal(row) {
    const businessKeys = [
        'id',
        'name',
        'title',
        'status',
        'code',
        'total',
        'items',
        'records',
        'list',
    ];
    const keys = Object.keys(row);
    const keyHit = keys.some((key) => businessKeys.some((hint) => key.toLowerCase().includes(hint)));
    if (!keyHit) {
        return false;
    }
    return keys.some((key) => {
        const value = row[key];
        if (value == null) {
            return false;
        }
        if (typeof value === 'string') {
            return value.trim().length > 0;
        }
        if (Array.isArray(value)) {
            return value.length > 0;
        }
        if (typeof value === 'object') {
            return Object.keys(value).length > 0;
        }
        return true;
    });
}
exports.hasBusinessKeySignal = hasBusinessKeySignal;
function resolveToolStepCode(quality, output, agentMetadata) {
    return (0, tool_execution_status_util_1.resolveToolStepMachineCode)({ quality, output, agentMetadata });
}
exports.resolveToolStepCode = resolveToolStepCode;
function filterUsableToolObservations(observations) {
    return observations.filter((row) => row.output != null && !(0, agent_run_user_messages_util_1.isAgentToolErrorObservation)(row.output));
}
exports.filterUsableToolObservations = filterUsableToolObservations;
function buildSummarizeObservationFromState(state, planContext) {
    var _a, _b, _c;
    const rawSplit = (0, graph_tool_observations_util_1.splitToolObservationsFromState)(state);
    const fromWorkflow = (0, workflow_node_outputs_summarize_util_1.workflowNodeOutputsToSummarizeObservations)(state.workflowNodeOutputs);
    const usableSplit = {
        workingMemory: filterUsableToolObservations(rawSplit.workingMemory),
        currentRun: [
            ...filterUsableToolObservations(rawSplit.currentRun),
            ...fromWorkflow,
        ],
    };
    const memoryScope = (0, summarize_memory_scope_util_1.resolveSummarizeMemoryScope)({
        split: usableSplit,
        plan: planContext === null || planContext === void 0 ? void 0 : planContext.taskPlan,
        scopedTools: planContext === null || planContext === void 0 ? void 0 : planContext.scopedTools,
        workflowRun: state.workflowRun,
        workflowNodeDefs: planContext === null || planContext === void 0 ? void 0 : planContext.workflowNodeDefs,
        planRunContext: (0, plan_observation_scope_util_1.planRunContextFromState)(state),
    });
    const split = (0, summarize_memory_scope_util_1.applySummarizeMemoryScope)(usableSplit, memoryScope);
    if (split.workingMemory.length === 0 && split.currentRun.length === 0) {
        return null;
    }
    const primary = (_b = (_a = (0, observation_format_util_1.resolvePrimaryObservationForSummarize)(split)) !== null && _a !== void 0 ? _a : split.currentRun[split.currentRun.length - 1]) !== null && _b !== void 0 ? _b : split.workingMemory[split.workingMemory.length - 1];
    return {
        name: observation_format_util_1.SPLIT_TOOL_OBSERVATIONS_NAME,
        output: split,
        quality: (_c = primary === null || primary === void 0 ? void 0 : primary.quality) !== null && _c !== void 0 ? _c : 'high',
        fieldLabels: primary === null || primary === void 0 ? void 0 : primary.fieldLabels,
        fieldDescriptions: primary === null || primary === void 0 ? void 0 : primary.fieldDescriptions,
        enumLabelsByPath: primary === null || primary === void 0 ? void 0 : primary.enumLabelsByPath,
        llmPayload: primary === null || primary === void 0 ? void 0 : primary.llmPayload,
    };
}
exports.buildSummarizeObservationFromState = buildSummarizeObservationFromState;
function resolveLlmCompletionAfterTools(userMessage, llmText, state, planContext) {
    const summarizeObservation = buildSummarizeObservationFromState(state, planContext);
    if (summarizeObservation) {
        return { observation: summarizeObservation };
    }
    const draft = llmText.trim();
    if (!draft) {
        return null;
    }
    return {
        observation: buildDirectReplyObservation(userMessage, (0, llm_output_sanitize_util_1.extractLlmUserFacingText)(draft)),
    };
}
exports.resolveLlmCompletionAfterTools = resolveLlmCompletionAfterTools;
function buildDirectReplyObservation(userMessage, draftReply) {
    const cleanDraft = (0, llm_output_sanitize_util_1.extractLlmUserFacingText)(draftReply);
    return {
        name: 'direct_reply',
        output: {
            userMessage,
            draftReply: cleanDraft,
        },
        quality: 'medium',
    };
}
exports.buildDirectReplyObservation = buildDirectReplyObservation;
function extractDirectReplyDraft(output) {
    if (typeof output === 'string') {
        return (0, llm_output_sanitize_util_1.extractLlmUserFacingText)(output);
    }
    if (output && typeof output === 'object' && !Array.isArray(output)) {
        const draft = output.draftReply;
        if (typeof draft === 'string') {
            return (0, llm_output_sanitize_util_1.extractLlmUserFacingText)(draft);
        }
    }
    return '';
}
exports.extractDirectReplyDraft = extractDirectReplyDraft;
function extractDirectUserGuidanceHint(output) {
    if (output && typeof output === 'object' && !Array.isArray(output)) {
        const hint = output.guidanceHint;
        if (typeof hint === 'string' && hint.trim().length > 0) {
            return hint.trim();
        }
    }
    return undefined;
}
exports.extractDirectUserGuidanceHint = extractDirectUserGuidanceHint;
function parseClarificationRequestOutput(output) {
    if (!output || typeof output !== 'object' || Array.isArray(output)) {
        return { missingFields: [] };
    }
    const row = output;
    const rawFields = row.missingFields;
    const missingFields = Array.isArray(rawFields)
        ? rawFields
            .map((item) => {
            if (!item || typeof item !== 'object' || Array.isArray(item)) {
                return null;
            }
            const field = item;
            const name = typeof field.name === 'string' ? field.name.trim() : '';
            const hint = typeof field.hint === 'string' ? field.hint.trim() : '';
            if (!name || !hint) {
                return null;
            }
            return { name, hint };
        })
            .filter((item) => item != null)
        : [];
    return {
        missingFields,
        planStepId: typeof row.planStepId === 'string' ? row.planStepId : undefined,
        toolRole: typeof row.toolRole === 'string' ? row.toolRole : undefined,
    };
}
exports.parseClarificationRequestOutput = parseClarificationRequestOutput;
function parseSkillIntentMismatchOutput(output) {
    if (!output || typeof output !== 'object' || Array.isArray(output)) {
        return {
            userMessage: '',
            mismatchCode: null,
            requestedSkillId: null,
            requestedSkillName: null,
            routingReason: null,
        };
    }
    const row = output;
    const mismatchCode = typeof row.mismatchCode === 'string'
        ? row.mismatchCode
        : null;
    return {
        userMessage: typeof row.userMessage === 'string' ? row.userMessage.trim() : '',
        mismatchCode,
        requestedSkillId: typeof row.requestedSkillId === 'number' ? row.requestedSkillId : null,
        requestedSkillName: typeof row.requestedSkillName === 'string'
            ? row.requestedSkillName.trim()
            : null,
        routingReason: typeof row.routingReason === 'string' ? row.routingReason.trim() : null,
    };
}
exports.parseSkillIntentMismatchOutput = parseSkillIntentMismatchOutput;
function buildSkillIntentMismatchFallbackPlainText(input) {
    var _a;
    const skillLabel = ((_a = input.requestedSkillName) === null || _a === void 0 ? void 0 : _a.trim()) || '当前技能';
    switch (input.mismatchCode) {
        case 'write_intent_vs_http_only_skill':
            return `你选择了「${skillLabel}」，它主要用于数据查询或分析，无法完成页面上的填写或提交。可以取消技能选择后重新发送，或换成支持页面操作的技能。`;
        case 'write_intent_vs_no_host_skill':
            return `你选择了「${skillLabel}」，它不包含页面写入能力，无法完成填写或提交。请取消技能选择后重试，或选择带页面操作能力的技能。`;
        default:
            return `当前选择的技能与你说的话不太匹配。可以取消技能选择后按你的问题重发，或换一种与该技能匹配的说法。`;
    }
}
exports.buildSkillIntentMismatchFallbackPlainText = buildSkillIntentMismatchFallbackPlainText;
function resolveSummarizeStepName(taskPlan, observationName) {
    var _a;
    const stepId = (_a = taskPlan === null || taskPlan === void 0 ? void 0 : taskPlan.currentStepId) === null || _a === void 0 ? void 0 : _a.trim();
    if (stepId) {
        return `plan:${stepId}`;
    }
    return observationName;
}
exports.resolveSummarizeStepName = resolveSummarizeStepName;
function resolveSummarizeStepMeta(observation) {
    if (!(0, observation_format_util_1.isSplitToolObservationsOutput)(observation.output)) {
        return undefined;
    }
    const memoryScope = observation.output.memoryScope;
    if (!memoryScope) {
        return undefined;
    }
    return { memoryScope };
}
exports.resolveSummarizeStepMeta = resolveSummarizeStepMeta;
function resolveSummarizePromptKey(input) {
    if ((0, task_plan_util_1.isPendingPlanAnswerStep)(input.taskPlan, input.workflowRun, input.workflowNodeDefs)) {
        return prompt_template_keys_1.PROMPT_KEYS.AGENT_SUMMARIZE_MESSAGE_BLOCKS;
    }
    if (input.fullDetail) {
        return prompt_template_keys_1.PROMPT_KEYS.AGENT_SUMMARIZE_TOOL_FULL;
    }
    if (input.summarizeScenario === 'action') {
        return prompt_template_keys_1.PROMPT_KEYS.AGENT_SUMMARIZE_ACTION;
    }
    return prompt_template_keys_1.PROMPT_KEYS.AGENT_SUMMARIZE_READ;
}
exports.resolveSummarizePromptKey = resolveSummarizePromptKey;
function buildSummarizeFallbackPlainText(toolName, output, ruleBlocks) {
    if (ruleBlocks.length > 0) {
        const fromBlocks = (0, message_blocks_util_1.messageBlocksToPlainText)(ruleBlocks);
        if (fromBlocks.trim().length > 0) {
            return fromBlocks;
        }
    }
    if (typeof output === 'string') {
        const trimmed = output.trim();
        return trimmed.length > 0 ? trimmed : `[${toolName}] (empty result)`;
    }
    const serialized = (0, decision_util_1.stringifyForPrompt)(output);
    return `[${toolName}]\n${serialized}`;
}
exports.buildSummarizeFallbackPlainText = buildSummarizeFallbackPlainText;
function buildWriteConfirmResumeFallbackPlainText(payload) {
    var _a;
    if (payload.outcome === 'failed') {
        const firstError = (_a = payload.operations.find((row) => row.errorHint)) === null || _a === void 0 ? void 0 : _a.errorHint;
        if (firstError) {
            return firstError;
        }
        return `Write operation failed (${payload.failureCount}/${payload.totalCount}).`;
    }
    if (payload.totalCount <= 1) {
        return 'Write operation completed successfully.';
    }
    return `${payload.successCount} write operation(s) completed successfully.`;
}
exports.buildWriteConfirmResumeFallbackPlainText = buildWriteConfirmResumeFallbackPlainText;
function buildWriteConfirmResumeFallbackBlocks(payload) {
    var _a;
    const metrics = payload.totalCount > 0
        ? [
            {
                type: 'metric',
                items: [
                    { label: 'Confirmed writes', value: String(payload.totalCount) },
                    { label: 'Succeeded', value: String(payload.successCount) },
                    { label: 'Failed', value: String(payload.failureCount) },
                ],
            },
        ]
        : [];
    if (payload.outcome === 'failed') {
        const firstError = (_a = payload.operations.find((row) => row.errorHint)) === null || _a === void 0 ? void 0 : _a.errorHint;
        return [
            {
                type: 'alert',
                severity: 'error',
                title: 'Write operation failed',
                message: firstError !== null && firstError !== void 0 ? firstError : `${payload.failureCount} of ${payload.totalCount} confirmed write operation(s) failed.`,
            },
            ...metrics,
        ];
    }
    return [
        (0, message_blocks_util_1.textBlock)(buildWriteConfirmResumeFallbackPlainText(payload)),
        ...metrics,
    ];
}
exports.buildWriteConfirmResumeFallbackBlocks = buildWriteConfirmResumeFallbackBlocks;
function assessObservationQualityForResume(output, agentMetadata) {
    return assessObservationQuality(output, agentMetadata);
}
exports.assessObservationQualityForResume = assessObservationQualityForResume;
function buildPendingPlanSummaryObservation(userMessage, state, planContext) {
    return (0, task_plan_util_1.buildPlanSummarizeObservation)({
        userMessage,
        summarizeObservation: buildSummarizeObservationFromState(state, planContext),
    });
}
exports.buildPendingPlanSummaryObservation = buildPendingPlanSummaryObservation;
//# sourceMappingURL=observation.util.js.map