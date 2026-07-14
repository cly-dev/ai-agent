"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAgentGraphDecisionHelpers = exports.renderToolDecisionTemplate = exports.buildDecisionPrompt = exports.extractToolCalls = exports.extractAiMessageText = exports.buildTaskPlanTraceForLlmStep = exports.extractRequiredParamNames = exports.stringifyForPrompt = exports.appendPlanStepDecisionHint = exports.toLangChainInvokeMessage = exports.buildLlmInvokeMessages = void 0;
const prompt_message_util_1 = require("../../../prompt-message.util");
const observation_format_util_1 = require("../../../observation-format.util");
const message_token_budget_util_1 = require("../../../../../llm/message-token-budget.util");
const tool_schema_compact_util_1 = require("../../../tool/tool-schema-compact.util");
const host_bridge_1 = require("../../../../../host-bridge");
const prompt_template_keys_1 = require("../../../../../prompt/prompt-template.keys");
const tool_call_args_util_1 = require("../../../../../llm/tool-call-args.util");
const task_plan_util_1 = require("../../plan/task-plan.util");
const workflow_node_outputs_util_1 = require("../../../../../workflow/workflow-node-outputs.util");
function buildLlmInvokeMessages(promptMessages, observationSplit, latestUserMessage, toolSchemaJson, hostToolSchemaJson, toolDecisionPrompt, messageTokenBudget, taskPlan, workflowNodeOutputs) {
    const messages = [];
    for (const item of (0, prompt_message_util_1.extractAgentPromptMessages)(promptMessages)) {
        messages.push({ role: item.role, content: item.content });
    }
    for (const item of (0, prompt_message_util_1.extractPageContextForDecision)(promptMessages)) {
        messages.push({ role: item.role, content: item.content });
    }
    for (const item of (0, prompt_message_util_1.extractSessionMemoryForDecision)(promptMessages)) {
        messages.push({ role: item.role, content: item.content });
    }
    for (const item of (0, prompt_message_util_1.extractSessionHistoryForDecision)(promptMessages, latestUserMessage)) {
        messages.push({ role: item.role, content: item.content });
    }
    const withWorkflowOutputs = (0, workflow_node_outputs_util_1.appendWorkflowNodeOutputsToLlmMessages)(messages, workflowNodeOutputs);
    messages.length = 0;
    messages.push(...withWorkflowOutputs);
    const observationBlock = (0, observation_format_util_1.formatSplitObservationsPromptBlock)({
        workingMemory: (0, observation_format_util_1.toolObservationsToPayloads)(observationSplit.workingMemory, 'session'),
        currentRun: (0, observation_format_util_1.toolObservationsToPayloads)(observationSplit.currentRun, 'current_run'),
    });
    if (observationSplit.workingMemory.length > 0 ||
        observationSplit.currentRun.length > 0) {
        messages.push({
            role: 'assistant',
            content: observationBlock,
        });
    }
    messages.push({
        role: 'tool',
        content: `<tool_schema>\n${toolSchemaJson}\n</tool_schema>`,
        toolCallId: 'decision_tool_schema',
    });
    if (hostToolSchemaJson && hostToolSchemaJson !== '[]') {
        messages.push({
            role: 'tool',
            content: `<host_tool_schema>\n${hostToolSchemaJson}\n</host_tool_schema>`,
            toolCallId: 'decision_host_tool_schema',
        });
    }
    messages.push({
        role: 'system',
        content: `<tool_decision>\n${toolDecisionPrompt}\n</tool_decision>`,
    });
    const pinnedUser = (0, task_plan_util_1.buildDecisionUserFrame)({
        taskPlan,
        observationCount: observationSplit.workingMemory.length +
            observationSplit.currentRun.length,
        latestUserMessage,
    });
    if (pinnedUser) {
        messages.push(pinnedUser);
    }
    const estimatedTokens = (0, message_token_budget_util_1.estimateMessagesTokens)(messages);
    return {
        messages: messages.map((item) => (Object.assign({ role: item.role, content: item.content }, (item.toolCallId ? { toolCallId: item.toolCallId } : {})))),
        trimMeta: {
            configuredBudget: messageTokenBudget,
            effectiveBudget: messageTokenBudget,
            estimatedTokensBefore: estimatedTokens,
            estimatedTokensAfter: estimatedTokens,
            trimmed: false,
            droppedMessageIndexes: [],
            truncatedMessageIndexes: [],
        },
    };
}
exports.buildLlmInvokeMessages = buildLlmInvokeMessages;
function toLangChainInvokeMessage(message) {
    var _a;
    if (message.role === 'tool') {
        return {
            role: 'tool',
            content: message.content,
            tool_call_id: (_a = message.toolCallId) !== null && _a !== void 0 ? _a : 'decision_tool_schema',
        };
    }
    return {
        role: message.role,
        content: message.content,
    };
}
exports.toLangChainInvokeMessage = toLangChainInvokeMessage;
function appendPlanStepDecisionHint(toolDecisionPrompt, taskPlan) {
    var _a, _b, _c;
    const step = (0, task_plan_util_1.getPendingPlanToolStep)(taskPlan);
    if ((0, task_plan_util_1.isComposeMutationParameterStep)(step)) {
        return `${toolDecisionPrompt}\n\n<plan_step_override>
COMPOSE_WRITE step: emit exactly ONE bound write tool_call with all required parameters from <tool_schema> (identifiers, headers, enums) and the full submit body from read observations.
This overrides skill "wait for draft" and generic "empty tool_calls when no draft" rules.
plan_compose_write / plan_draft_reply are runtime observations — NOT callable tools.
</plan_step_override>`;
    }
    if ((0, task_plan_util_1.isPlanWriteExecutionStepInMutationFlow)(step)) {
        return `${toolDecisionPrompt}\n\n<plan_step_override>
WRITE fallback step: call ONLY tools listed in <tool_schema>.
If plan_compose_write summary exists, copy its pendingWriteTool + arguments verbatim — do not invent new reply text.
NEVER emit tool_calls to plan_compose_write, plan_draft_reply, or any observation name.
</plan_step_override>`;
    }
    const hostStep = (0, task_plan_util_1.getPendingPlanHostToolStep)(taskPlan);
    if (hostStep) {
        const names = (_b = (_a = hostStep.hostToolNames) === null || _a === void 0 ? void 0 : _a.join(', ')) !== null && _b !== void 0 ? _b : 'scoped host tools';
        return `${toolDecisionPrompt}\n\n<plan_step_override>
HOST_TOOL step: emit tool_calls ONLY for browser host tools (${names}) listed in <host_tool_schema>.
Do NOT call HTTP tools from <tool_schema>. Args are executed in the user's browser, not on the server.
</plan_step_override>`;
    }
    if ((step === null || step === void 0 ? void 0 : step.kind) === 'tool' &&
        step.phase === 'gather' &&
        step.toolRole === 'read-list') {
        const pinned = ((_c = step.pinnedToolNames) === null || _c === void 0 ? void 0 : _c.length)
            ? step.pinnedToolNames.join(', ')
            : 'a read-list tool from <tool_schema>';
        return `${toolDecisionPrompt}\n\n<plan_step_override>
GATHER read-list step: emit exactly ONE HTTP tool_call for ${pinned} from <tool_schema>.
Derive filters from <current_objective>, <user_intent>, and observations; omit optional query params when unspecified.
Do NOT return empty tool_calls while this gather step is pending unless schema-required parameters cannot be inferred (param_gate runs after tool_calls).
</plan_step_override>`;
    }
    return toolDecisionPrompt;
}
exports.appendPlanStepDecisionHint = appendPlanStepDecisionHint;
function stringifyForPrompt(value) {
    try {
        return typeof value === 'string' ? value : JSON.stringify(value);
    }
    catch (_a) {
        return String(value);
    }
}
exports.stringifyForPrompt = stringifyForPrompt;
function extractRequiredParamNames(inputSchema) {
    if (!inputSchema || typeof inputSchema !== 'object' || Array.isArray(inputSchema)) {
        return [];
    }
    const row = inputSchema;
    const params = row.parameters;
    if (!Array.isArray(params)) {
        return [];
    }
    return params
        .map((item) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
            return null;
        }
        const param = item;
        const required = param.required === true;
        const name = typeof param.name === 'string' && param.name.trim().length > 0
            ? param.name.trim()
            : null;
        if (!required || !name) {
            return null;
        }
        return name;
    })
        .filter((name) => name != null);
}
exports.extractRequiredParamNames = extractRequiredParamNames;
function buildTaskPlanTraceForLlmStep(taskPlan) {
    if (!taskPlan) {
        return null;
    }
    return {
        source: taskPlan.source,
        deliverable: taskPlan.deliverable,
        goal: taskPlan.goal,
        currentStepId: taskPlan.currentStepId,
        currentObjective: taskPlan.currentObjective,
        taskPhase: taskPlan.taskPhase,
        pendingStepIds: taskPlan.pendingStepIds,
        completedStepIds: taskPlan.completedStepIds,
        steps: taskPlan.steps.map((step) => {
            var _a, _b, _c;
            return ({
                id: step.id,
                phase: step.phase,
                kind: step.kind,
                skillId: (_a = step.skillId) !== null && _a !== void 0 ? _a : null,
                toolRole: (_b = step.toolRole) !== null && _b !== void 0 ? _b : null,
                objective: step.objective,
                stopWhen: (_c = step.stopWhen) !== null && _c !== void 0 ? _c : 'observation_non_empty',
            });
        }),
        activeFrameIndex: taskPlan.activeFrameIndex,
        frameCount: taskPlan.frames.length,
    };
}
exports.buildTaskPlanTraceForLlmStep = buildTaskPlanTraceForLlmStep;
function extractAiMessageText(message) {
    if (typeof message.content === 'string') {
        return message.content;
    }
    if (Array.isArray(message.content)) {
        return message.content
            .map((item) => {
            var _a;
            return item && typeof item === 'object' && 'text' in item
                ? String((_a = item.text) !== null && _a !== void 0 ? _a : '')
                : '';
        })
            .join('');
    }
    return '';
}
exports.extractAiMessageText = extractAiMessageText;
function extractToolCalls(message) {
    var _a, _b, _c;
    const value = ((_c = (_a = message.tool_calls) !== null && _a !== void 0 ? _a : (_b = message.additional_kwargs) === null || _b === void 0 ? void 0 : _b.tool_calls) !== null && _c !== void 0 ? _c : []);
    if (!Array.isArray(value)) {
        return [];
    }
    return value
        .map((item) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
            return null;
        }
        const row = item;
        const directName = row.name;
        const directArgs = row.args;
        if (typeof directName === 'string') {
            return {
                name: directName,
                arguments: (0, tool_call_args_util_1.normalizeToolCallArgs)(directArgs),
            };
        }
        const fn = row.function;
        if (!fn || typeof fn !== 'object' || Array.isArray(fn)) {
            return null;
        }
        const fnRow = fn;
        const name = fnRow.name;
        if (typeof name !== 'string') {
            return null;
        }
        return {
            name,
            arguments: (0, tool_call_args_util_1.normalizeToolCallArgs)(fnRow.arguments),
        };
    })
        .filter((item) => item !== null);
}
exports.extractToolCalls = extractToolCalls;
async function buildDecisionPrompt(deps, promptMessages, tools, observationSplit, enableToolCall, scope, activeSkillPrompt, taskPlan, hostToolsForPrompt = []) {
    const agentPrompt = (0, prompt_message_util_1.joinAgentPromptText)(promptMessages);
    const toolSchema = (0, tool_schema_compact_util_1.summarizeToolsForLlmSchema)(tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
        schema: tool.schema,
        responseProfile: tool.responseProfile,
        agentMetadata: tool.agentMetadata,
        method: tool.method,
    })));
    const hostToolSchema = (0, host_bridge_1.summarizeHostToolsForLlmSchema)(hostToolsForPrompt);
    const toolCallInstruction = enableToolCall
        ? hostToolsForPrompt.length > 0
            ? 'If HTTP tools are needed, use <tool_schema>. If host/browser tools are needed, use <host_tool_schema>. Otherwise answer in message content with empty tool_calls.'
            : 'If a tool is needed, use native tool_calls. If not needed, answer in message content with empty tool_calls.'
        : 'Tool calling is disabled. Reply directly in message content with empty tool_calls.';
    let toolDecisionPrompt = await renderToolDecisionTemplate(deps, scope, toolCallInstruction);
    const skillPrompt = activeSkillPrompt === null || activeSkillPrompt === void 0 ? void 0 : activeSkillPrompt.trim();
    if (skillPrompt) {
        toolDecisionPrompt = `<active_skill>\n${skillPrompt}\n</active_skill>\n\n${toolDecisionPrompt}`;
    }
    toolDecisionPrompt = appendPlanStepDecisionHint(toolDecisionPrompt, taskPlan);
    return {
        toolDecisionPrompt,
        toolSchemaJson: JSON.stringify(toolSchema),
        hostToolSchemaJson: JSON.stringify(hostToolSchema),
        observationsJson: (0, observation_format_util_1.formatSplitObservationsPromptBlock)({
            workingMemory: (0, observation_format_util_1.toolObservationsToPayloads)(observationSplit.workingMemory, 'session'),
            currentRun: (0, observation_format_util_1.toolObservationsToPayloads)(observationSplit.currentRun, 'current_run'),
        }),
        agentPrompt,
    };
}
exports.buildDecisionPrompt = buildDecisionPrompt;
async function renderToolDecisionTemplate(deps, scope, toolCallInstruction) {
    const variables = { toolCallInstruction };
    return deps.promptRegistry.render(prompt_template_keys_1.PROMPT_KEYS.AGENT_TOOL_DECISION, scope, variables);
}
exports.renderToolDecisionTemplate = renderToolDecisionTemplate;
function createAgentGraphDecisionHelpers(deps) {
    return {
        buildLlmInvokeMessages,
        buildDecisionPrompt: buildDecisionPrompt.bind(null, deps),
        toLangChainInvokeMessage,
        buildTaskPlanTraceForLlmStep,
        extractToolCalls,
        extractAiMessageText,
        stringifyForPrompt,
        renderToolDecisionTemplate: renderToolDecisionTemplate.bind(null, deps),
        appendPlanStepDecisionHint,
        extractRequiredParamNames,
    };
}
exports.createAgentGraphDecisionHelpers = createAgentGraphDecisionHelpers;
//# sourceMappingURL=decision.util.js.map