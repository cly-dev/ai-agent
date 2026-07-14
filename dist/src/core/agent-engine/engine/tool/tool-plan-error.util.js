"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSameArgsRepeatUserHint = exports.pendingCallsRepeatRecoverableToolError = exports.findLastRecoverableToolErrorObservation = exports.shouldAbortPlanOnRecoverableSameArgs = exports.shouldAbortPlanOnTerminalToolError = exports.isTerminalPlanToolError = exports.isRecoverableParameterToolError = exports.resolveToolErrorHttpStatus = void 0;
const tool_call_args_util_1 = require("../../../llm/tool-call-args.util");
const observation_format_util_1 = require("../observation-format.util");
const agent_run_user_messages_util_1 = require("../agent-run-user-messages.util");
const task_plan_util_1 = require("../main/plan/task-plan.util");
const tool_call_dedupe_util_1 = require("./tool-call-dedupe.util");
function resolveToolErrorHttpStatus(output) {
    if (!(0, agent_run_user_messages_util_1.isAgentToolErrorObservation)(output)) {
        return undefined;
    }
    return output.httpStatus;
}
exports.resolveToolErrorHttpStatus = resolveToolErrorHttpStatus;
function isRecoverableParameterToolError(output) {
    if (!(0, agent_run_user_messages_util_1.isAgentToolErrorObservation)(output)) {
        return false;
    }
    if (output.httpStatus === 400) {
        return true;
    }
    const text = `${output.detail} ${output.userHint}`.toLowerCase();
    return text.includes('failed: 400') || /\b400\b/.test(text);
}
exports.isRecoverableParameterToolError = isRecoverableParameterToolError;
function isTerminalPlanToolError(output) {
    return ((0, agent_run_user_messages_util_1.isAgentToolErrorObservation)(output) &&
        !isRecoverableParameterToolError(output));
}
exports.isTerminalPlanToolError = isTerminalPlanToolError;
function shouldAbortPlanOnTerminalToolError(input) {
    if (!input.taskPlan || input.reason !== 'tool_error_summarize') {
        return false;
    }
    if (!isTerminalPlanToolError(input.errorOutput)) {
        return false;
    }
    const step = (0, task_plan_util_1.getPendingPlanToolStep)(input.taskPlan);
    return (step === null || step === void 0 ? void 0 : step.kind) === 'tool';
}
exports.shouldAbortPlanOnTerminalToolError = shouldAbortPlanOnTerminalToolError;
function shouldAbortPlanOnRecoverableSameArgs(input) {
    return (input.reason === 'tool_error_same_args_repeat' && input.taskPlan != null);
}
exports.shouldAbortPlanOnRecoverableSameArgs = shouldAbortPlanOnRecoverableSameArgs;
function observationArgsSignature(name, args) {
    if (!args) {
        return null;
    }
    const compact = (0, observation_format_util_1.compactArgsForObservation)(args);
    if (!compact || Object.keys(compact).length === 0) {
        return null;
    }
    return (0, tool_call_dedupe_util_1.toolCallSignature)({
        name,
        arguments: (0, tool_call_args_util_1.normalizeToolCallArgs)(compact),
    });
}
function findLastRecoverableToolErrorObservation(observations) {
    var _a, _b, _c;
    for (let index = observations.length - 1; index >= 0; index -= 1) {
        const row = observations[index];
        if (!row || !isRecoverableParameterToolError(row.output)) {
            continue;
        }
        const args = (_b = (0, observation_format_util_1.compactArgsForObservation)((_a = row.llmPayload) === null || _a === void 0 ? void 0 : _a.args)) !== null && _b !== void 0 ? _b : (_c = row.llmPayload) === null || _c === void 0 ? void 0 : _c.args;
        if (!args || Object.keys(args).length === 0) {
            continue;
        }
        return {
            name: row.name,
            output: row.output,
            args,
        };
    }
    return null;
}
exports.findLastRecoverableToolErrorObservation = findLastRecoverableToolErrorObservation;
function pendingCallsRepeatRecoverableToolError(input) {
    const failed = findLastRecoverableToolErrorObservation(input.observations);
    if (!failed) {
        return { repeat: false };
    }
    const failedSig = observationArgsSignature(failed.name, failed.args);
    if (!failedSig) {
        return { repeat: false };
    }
    for (const call of input.pendingToolCalls) {
        if ((0, tool_call_dedupe_util_1.toolCallSignature)(call) === failedSig) {
            return { repeat: true, errorOutput: failed.output };
        }
    }
    return { repeat: false };
}
exports.pendingCallsRepeatRecoverableToolError = pendingCallsRepeatRecoverableToolError;
function buildSameArgsRepeatUserHint(errorOutput) {
    const base = errorOutput.userHint.trim();
    const suffix = '未能根据上次报错调整查询参数，请修改条件后重试。';
    return base.length > 0 ? `${base}\n\n${suffix}` : suffix;
}
exports.buildSameArgsRepeatUserHint = buildSameArgsRepeatUserHint;
//# sourceMappingURL=tool-plan-error.util.js.map