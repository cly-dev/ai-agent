"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tryInterceptComposeMutationToolCalls = exports.prepareComposeWriteToolCall = exports.buildReadToolObservationMatcher = exports.pickComposeWriteToolCall = exports.patchLatestPlanComposeWriteObservation = exports.resolveLatestPlanComposeWrite = exports.buildPlanComposeWriteObservation = exports.PLAN_PRESENT_STEP_ID = exports.PLAN_COMPOSE_WRITE_STEP_ID = exports.PLAN_COMPOSE_WRITE_OBSERVATION_NAME = void 0;
const write_tool_draft_injection_util_1 = require("../../../../tool-engine/write-tool-draft-injection.util");
const tool_execution_status_util_1 = require("../../tool/tool-execution-status.util");
const task_plan_util_1 = require("../plan/task-plan.util");
Object.defineProperty(exports, "PLAN_COMPOSE_WRITE_STEP_ID", { enumerable: true, get: function () { return task_plan_util_1.PLAN_COMPOSE_WRITE_STEP_ID; } });
Object.defineProperty(exports, "PLAN_PRESENT_STEP_ID", { enumerable: true, get: function () { return task_plan_util_1.PLAN_PRESENT_STEP_ID; } });
exports.PLAN_COMPOSE_WRITE_OBSERVATION_NAME = 'plan_compose_write';
function buildPlanComposeWriteObservation(input) {
    var _a;
    return {
        name: exports.PLAN_COMPOSE_WRITE_OBSERVATION_NAME,
        output: {
            tool: input.toolCall.name.trim(),
            arguments: input.toolCall.arguments,
            planStepId: (_a = input.planStepId) !== null && _a !== void 0 ? _a : null,
        },
        quality: 'high',
    };
}
exports.buildPlanComposeWriteObservation = buildPlanComposeWriteObservation;
function resolveLatestPlanComposeWrite(observations) {
    var _a, _b;
    for (let i = observations.length - 1; i >= 0; i -= 1) {
        const row = observations[i];
        if ((row === null || row === void 0 ? void 0 : row.name) !== exports.PLAN_COMPOSE_WRITE_OBSERVATION_NAME) {
            continue;
        }
        const output = row.output;
        const tool = (_a = output === null || output === void 0 ? void 0 : output.tool) === null || _a === void 0 ? void 0 : _a.trim();
        if (!tool) {
            continue;
        }
        const args = output.arguments;
        if (!args || typeof args !== 'object' || Array.isArray(args)) {
            continue;
        }
        return {
            tool,
            arguments: args,
            planStepId: (_b = output.planStepId) !== null && _b !== void 0 ? _b : null,
        };
    }
    return null;
}
exports.resolveLatestPlanComposeWrite = resolveLatestPlanComposeWrite;
function patchLatestPlanComposeWriteObservation(observations, machineLayer) {
    var _a, _b;
    for (let i = observations.length - 1; i >= 0; i -= 1) {
        const row = observations[i];
        if ((row === null || row === void 0 ? void 0 : row.name) !== exports.PLAN_COMPOSE_WRITE_OBSERVATION_NAME) {
            continue;
        }
        const output = row.output;
        const next = [...observations];
        next[i] = Object.assign(Object.assign({}, row), { output: {
                tool: machineLayer.tool.trim() || output.tool,
                arguments: machineLayer.arguments,
                planStepId: (_b = (_a = machineLayer.planStepId) !== null && _a !== void 0 ? _a : output.planStepId) !== null && _b !== void 0 ? _b : null,
            } });
        return { observations: next, patched: true };
    }
    return { observations, patched: false };
}
exports.patchLatestPlanComposeWriteObservation = patchLatestPlanComposeWriteObservation;
function pickComposeWriteToolCall(toolCalls, scopedTools, taskPlan, workflowRun, workflowNodeDefs) {
    const allowed = (0, task_plan_util_1.filterScopedToolsForPlanStep)(scopedTools, taskPlan, workflowRun, workflowNodeDefs);
    for (const call of toolCalls) {
        const def = allowed.find((tool) => tool.name === call.name);
        if (def && (0, tool_execution_status_util_1.isMutationTool)(def.agentMetadata)) {
            return call;
        }
    }
    return null;
}
exports.pickComposeWriteToolCall = pickComposeWriteToolCall;
function buildReadToolObservationMatcher(scopedTools) {
    const readToolNames = new Set(scopedTools
        .filter((tool) => !(0, tool_execution_status_util_1.isMutationTool)(tool.agentMetadata))
        .map((tool) => tool.name));
    return (toolName) => readToolNames.has(toolName);
}
exports.buildReadToolObservationMatcher = buildReadToolObservationMatcher;
function prepareComposeWriteToolCall(input) {
    var _a;
    const isReadToolObservation = buildReadToolObservationMatcher(input.scopedTools);
    return {
        name: input.toolCall.name,
        arguments: (0, write_tool_draft_injection_util_1.normalizeWriteToolArguments)(input.toolCall.arguments, input.writeTool, input.observations, {
            isReadToolObservation,
            pageContext: (_a = input.pageContext) !== null && _a !== void 0 ? _a : null,
        }),
    };
}
exports.prepareComposeWriteToolCall = prepareComposeWriteToolCall;
function tryInterceptComposeMutationToolCalls(input) {
    var _a;
    const composeCall = pickComposeWriteToolCall(input.toolCalls, input.scopedTools, input.taskPlan, input.workflowRun, input.workflowNodeDefs);
    if (!composeCall) {
        return { kind: 'no_allowed_call' };
    }
    const writeToolDef = input.scopedTools.find((tool) => tool.name === composeCall.name);
    const preparedCall = writeToolDef != null
        ? prepareComposeWriteToolCall({
            toolCall: composeCall,
            writeTool: writeToolDef,
            observations: input.observations,
            scopedTools: input.scopedTools,
            pageContext: (_a = input.pageContext) !== null && _a !== void 0 ? _a : null,
        })
        : composeCall;
    return {
        kind: 'applied',
        preparedCall,
        composeObservation: buildPlanComposeWriteObservation({
            toolCall: preparedCall,
            planStepId: input.planStepId,
        }),
    };
}
exports.tryInterceptComposeMutationToolCalls = tryInterceptComposeMutationToolCalls;
//# sourceMappingURL=plan-compose-write.util.js.map