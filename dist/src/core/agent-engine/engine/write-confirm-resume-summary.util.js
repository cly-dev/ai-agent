"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatWriteConfirmResumeSummarizeUserMessage = exports.isWriteConfirmResumeSummaryObservation = exports.buildWriteConfirmResumeSummaryObservation = exports.buildWriteConfirmResumeSummaryPayload = void 0;
const agent_run_user_messages_util_1 = require("./agent-run-user-messages.util");
const task_plan_util_1 = require("./main/plan/task-plan.util");
function buildWriteConfirmResumeSummaryPayload(input) {
    const toolByName = new Map(input.scopedTools.map((tool) => [tool.name, tool]));
    const operations = input.writeRoundMeta.toolCalls.map((call, index) => {
        var _a, _b;
        const executionStatus = (_a = input.writeRoundMeta.executionStatuses[index]) !== null && _a !== void 0 ? _a : 'ERROR';
        const observationIndex = input.writeRoundMeta.roundObservationIndices[index];
        const observation = observationIndex != null
            ? input.observations[observationIndex]
            : null;
        const errorObs = observation != null && (0, agent_run_user_messages_util_1.isAgentToolErrorObservation)(observation.output)
            ? observation.output
            : null;
        const errorHint = errorObs ? (0, agent_run_user_messages_util_1.extractToolErrorUserHint)(errorObs) : undefined;
        const errorResponseSource = (errorObs === null || errorObs === void 0 ? void 0 : errorObs.responseSource) != null
            ? (0, agent_run_user_messages_util_1.formatResponseSourceForDisplay)((_b = (0, agent_run_user_messages_util_1.extractToolErrorResponseSource)(errorObs)) !== null && _b !== void 0 ? _b : errorObs.responseSource)
            : undefined;
        const def = toolByName.get(call.name);
        return Object.assign(Object.assign(Object.assign(Object.assign({ toolName: call.name }, ((def === null || def === void 0 ? void 0 : def.description) ? { toolDescription: def.description } : {})), { status: executionStatus === 'ERROR' ? 'ERROR' : 'SUCCESS' }), (errorHint ? { errorHint } : {})), (errorResponseSource ? { errorResponseSource } : {}));
    });
    const successCount = operations.filter((row) => row.status === 'SUCCESS').length;
    const failureCount = operations.filter((row) => row.status === 'ERROR').length;
    return {
        userMessage: input.userMessage.trim(),
        outcome: failureCount > 0 ? 'failed' : 'success',
        operations,
        successCount,
        failureCount,
        totalCount: operations.length,
    };
}
exports.buildWriteConfirmResumeSummaryPayload = buildWriteConfirmResumeSummaryPayload;
function buildWriteConfirmResumeSummaryObservation(input) {
    const payload = buildWriteConfirmResumeSummaryPayload(input);
    return {
        name: 'write_confirm_resume',
        output: payload,
        quality: payload.outcome === 'success' ? 'high' : 'low',
    };
}
exports.buildWriteConfirmResumeSummaryObservation = buildWriteConfirmResumeSummaryObservation;
function isWriteConfirmResumeSummaryObservation(observation) {
    return (observation === null || observation === void 0 ? void 0 : observation.name) === 'write_confirm_resume';
}
exports.isWriteConfirmResumeSummaryObservation = isWriteConfirmResumeSummaryObservation;
function formatWriteConfirmResumeSummarizeUserMessage(input) {
    const originalRequest = (0, task_plan_util_1.resolveSummarizeUserMessageForPlan)(input.payload.userMessage, input.taskPlan);
    const planContext = (0, task_plan_util_1.formatPlanContextForSummarize)(input.taskPlan);
    const operationLines = input.payload.operations.map((row, index) => {
        const parts = [
            `${index + 1}. tool=${row.toolName}`,
            `status=${row.status}`,
        ];
        if (row.toolDescription) {
            parts.push(`description=${row.toolDescription}`);
        }
        if (row.errorHint) {
            parts.push(`error=${row.errorHint}`);
        }
        if (row.errorResponseSource) {
            parts.push(`responseSource=${row.errorResponseSource}`);
        }
        return parts.join(' | ');
    });
    return [
        `Original user request: ${originalRequest}`,
        planContext ? `<plan_context>\n${planContext}\n</plan_context>` : null,
        '<write_confirm_resume>',
        'Context: User confirmed pending write tool call(s); system executed them synchronously (no re-planning).',
        `Outcome: ${input.payload.outcome}`,
        `Total confirmed write operations: ${input.payload.totalCount}`,
        `Succeeded: ${input.payload.successCount}`,
        `Failed: ${input.payload.failureCount}`,
        'Operations:',
        ...operationLines,
        '</write_confirm_resume>',
        input.toolResultsJson
            ? `Merged tool results (evidence only):\n${input.toolResultsJson}`
            : null,
    ]
        .filter((line) => line != null && line.length > 0)
        .join('\n');
}
exports.formatWriteConfirmResumeSummarizeUserMessage = formatWriteConfirmResumeSummarizeUserMessage;
//# sourceMappingURL=write-confirm-resume-summary.util.js.map