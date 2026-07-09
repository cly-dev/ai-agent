"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runPlanPresentSummarize = void 0;
const write_tool_draft_injection_util_1 = require("../../../../tool-engine/write-tool-draft-injection.util");
const tool_output_projection_util_1 = require("../../../../tool-engine/tool-output-projection.util");
const llm_prompt_debug_util_1 = require("../../llm-prompt-debug.util");
const tool_schema_compact_util_1 = require("../../tool/tool-schema-compact.util");
const observation_format_util_1 = require("../../observation-format.util");
const plan_compose_write_util_1 = require("./plan-compose-write.util");
const plan_draft_summarize_llm_util_1 = require("./plan-draft-summarize-llm.util");
const plan_present_user_message_util_1 = require("./plan-present-user-message.util");
const task_plan_util_1 = require("../plan/task-plan.util");
const host_tool_fill_alignment_util_1 = require("../host-tool/host-tool-fill-alignment.util");
const workflow_mutation_write_gate_util_1 = require("../../../../workflow/workflow-mutation-write-gate.util");
const plan_present_display_util_1 = require("./plan-present-display.util");
async function runPlanPresentSummarize(deps, input) {
    var _a, _b, _c, _d, _e, _f;
    const { toolName, toolDescription, userMessage, mergedObservation, toolObservations, promptMessages, sessionId, runId, scope, taskPlan, scopedTools, workflowRun, workflowNodeDefs, } = input;
    const planContext = (0, host_tool_fill_alignment_util_1.buildPlanContextForSummarize)(taskPlan, toolObservations);
    const composed = (0, plan_compose_write_util_1.resolveLatestPlanComposeWrite)(toolObservations);
    const writeTools = (0, task_plan_util_1.resolveMutationWriteToolsForPresent)(scopedTools, taskPlan, composed === null || composed === void 0 ? void 0 : composed.tool);
    const splitOutput = (0, observation_format_util_1.isSplitToolObservationsOutput)(mergedObservation.output)
        ? mergedObservation.output
        : null;
    const primaryObservation = splitOutput
        ? (0, observation_format_util_1.resolvePrimaryObservationForSummarize)(splitOutput)
        : null;
    const primaryOutput = (_a = primaryObservation === null || primaryObservation === void 0 ? void 0 : primaryObservation.output) !== null && _a !== void 0 ? _a : mergedObservation.output;
    const splitObservationsText = splitOutput
        ? (0, observation_format_util_1.formatSplitToolObservationsForSummarize)(splitOutput)
        : null;
    const fieldLabels = (_b = mergedObservation.fieldLabels) !== null && _b !== void 0 ? _b : {};
    const fieldDescriptions = (_c = mergedObservation.fieldDescriptions) !== null && _c !== void 0 ? _c : {};
    const enumLabelsByPath = (_d = mergedObservation.enumLabelsByPath) !== null && _d !== void 0 ? _d : {};
    const fieldLabelText = (0, tool_output_projection_util_1.formatFieldLabelsForPrompt)(fieldLabels, enumLabelsByPath, fieldDescriptions);
    const agentPrompts = promptMessages.filter((message) => message.role === 'system' && message.content.includes('<agent_prompt>'));
    const writeToolNames = writeTools.map((tool) => tool.name);
    const writeToolDescriptions = writeTools
        .map((tool) => tool.description ? `${tool.name}: ${tool.description}` : tool.name)
        .join('\n');
    const toolSchemaJson = JSON.stringify((0, tool_schema_compact_util_1.summarizeToolsForLlmSchema)(writeTools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
        schema: tool.schema,
        responseProfile: tool.responseProfile,
        agentMetadata: tool.agentMetadata,
        method: tool.method,
    }))));
    const turnId = (_e = deps.assistantArtifact.peekTurnId(sessionId, runId)) !== null && _e !== void 0 ? _e : undefined;
    const logDraftWarn = (message) => {
        deps.logger.warn(`${message} runId=${runId}`);
    };
    const emptyResult = () => {
        const published = (0, plan_present_user_message_util_1.publishPlanPresentUserLayer)(deps, {
            sessionId,
            runId,
            turnId,
            userMarkdown: '',
        });
        return {
            draftReply: published.draftReply,
            submitText: '',
            pendingWriteToolCall: null,
            machineLayer: null,
            machineLayerDirty: false,
            serialized: published.serialized,
        };
    };
    if (writeTools.length === 0) {
        logDraftWarn('plan present skipped: no write tools in plan step');
        return emptyResult();
    }
    if (!composed) {
        logDraftWarn('plan present skipped: missing plan_compose_write observation');
        return emptyResult();
    }
    const userContextBase = {
        userMessage,
        planContext: planContext || null,
        toolSchemaJson,
        writeToolNames,
        writeToolDescriptions,
        toolName,
        toolDescription,
        fieldLabelText: fieldLabelText || undefined,
        splitObservationsText,
        serializedOutput: JSON.stringify(primaryOutput),
    };
    let composedArgs = Object.assign({}, composed.arguments);
    let machineLayerDirty = false;
    const writeToolDef = writeTools.find((tool) => tool.name === composed.tool);
    const argsNeedProse = writeToolDef != null &&
        !(0, write_tool_draft_injection_util_1.writeToolArgsContainSubmitText)(composedArgs, writeToolDef);
    if (argsNeedProse) {
        logDraftWarn('plan present: composed args lack submit text; prose supplement');
        const supplemented = await (0, plan_draft_summarize_llm_util_1.invokePlanDraftProseSupplement)({
            llmService: deps.llmService,
            agentPrompts,
            promptRegistry: deps.promptRegistry,
            scope,
            userContext: (0, plan_draft_summarize_llm_util_1.buildPlanDraftSummarizeUserContent)(Object.assign(Object.assign({}, userContextBase), { composedWritePayload: composed })),
            logWarn: logDraftWarn,
        });
        if (supplemented && writeToolDef) {
            const proseSubmit = (0, write_tool_draft_injection_util_1.extractSubmitTextFromDraftReply)(supplemented) || supplemented;
            composedArgs = (0, write_tool_draft_injection_util_1.injectDraftIntoWriteToolArguments)(composedArgs, proseSubmit, writeToolDef);
            if ((0, write_tool_draft_injection_util_1.writeToolArgsContainSubmitText)(composedArgs, writeToolDef)) {
                machineLayerDirty = true;
            }
        }
    }
    const machineLayer = {
        tool: composed.tool,
        arguments: composedArgs,
        planStepId: (_f = composed.planStepId) !== null && _f !== void 0 ? _f : null,
    };
    const deferWorkflowAwaitGate = (0, workflow_mutation_write_gate_util_1.shouldDeferPlanPresentWriteGate)({
        workflowRun,
        workflowNodeDefs,
    });
    const hasSubmitBody = writeToolDef != null && (0, write_tool_draft_injection_util_1.writeToolHasSubmitBodyPath)(writeToolDef);
    if (deferWorkflowAwaitGate && writeToolDef && !hasSubmitBody) {
        deps.sse.emitThink(sessionId, runId, '正在整理写操作草稿…\n', 'delta');
        const userMarkdown = (0, plan_present_display_util_1.buildDeterministicMutationPresentMarkdown)({
            arguments: composedArgs,
            writeTool: writeToolDef,
        });
        const published = (0, plan_present_user_message_util_1.finalizePlanPresentUserLayer)(deps, {
            sessionId,
            runId,
            turnId,
            machineLayer,
            userMarkdown,
            taskPlanBeforeFinalize: taskPlan,
            scopedTools,
        });
        return Object.assign(Object.assign({}, published), { pendingWriteToolCall: null, machineLayer,
            machineLayerDirty });
    }
    const userContext = (0, plan_draft_summarize_llm_util_1.buildPlanDraftSummarizeUserContent)(Object.assign(Object.assign({}, userContextBase), { composedWritePayload: machineLayer }));
    const presentSystemPrompt = await (0, plan_draft_summarize_llm_util_1.renderPlanPresentFromComposeSystemPrompt)({
        promptRegistry: deps.promptRegistry,
        scope,
    });
    const summarizeDebugFile = (0, llm_prompt_debug_util_1.emitLlmPromptDebug)((message) => deps.logger.log(message), {
        runId,
        sessionId,
        phase: 'summarize',
        messages: [
            ...agentPrompts,
            { role: 'system', content: presentSystemPrompt },
            { role: 'user', content: userContext },
        ],
        meta: { planPresentFromCompose: true },
    });
    if (summarizeDebugFile) {
        deps.logger.log(`LLM plan present prompt file runId=${runId} path=${summarizeDebugFile}`);
    }
    deps.sse.emitThink(sessionId, runId, '正在整理写操作草稿…\n', 'delta');
    const presentMessages = [
        ...agentPrompts,
        { role: 'system', content: presentSystemPrompt },
        { role: 'user', content: userContext },
    ];
    const { userMarkdown } = await deps.sse.streamProseLlm(presentMessages, sessionId, runId, { turnId });
    const published = (0, plan_present_user_message_util_1.finalizePlanPresentUserLayer)(deps, {
        sessionId,
        runId,
        turnId,
        machineLayer,
        userMarkdown,
        taskPlanBeforeFinalize: taskPlan,
        scopedTools,
    });
    return Object.assign(Object.assign({}, published), { pendingWriteToolCall: null, machineLayer,
        machineLayerDirty });
}
exports.runPlanPresentSummarize = runPlanPresentSummarize;
//# sourceMappingURL=plan-present-orchestrate.util.js.map