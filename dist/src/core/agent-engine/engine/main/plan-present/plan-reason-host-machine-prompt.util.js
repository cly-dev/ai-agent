"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveReasonHostFillObservationPayload = exports.buildPlanReasonHostMachineStreamMessages = exports.buildPlanReasonHostFillUserContent = void 0;
const prompt_template_keys_1 = require("../../../../prompt/prompt-template.keys");
const page_context_prompt_util_1 = require("../../../../host-bridge/page-context.prompt.util");
const observation_format_util_1 = require("../../observation-format.util");
const plan_host_fill_util_1 = require("./plan-host-fill.util");
function buildPlanReasonHostFillUserContent(input) {
    const pageContextBlock = (0, page_context_prompt_util_1.formatPageContextPromptBlock)(input.pageContext);
    return [
        `User request: ${input.userMessage}`,
        input.planContext
            ? `<plan_context>\n${input.planContext}\n</plan_context>`
            : null,
        pageContextBlock,
        `<host_tools>\n${(0, plan_host_fill_util_1.summarizeHostToolsForReasonFillPrompt)(input.hostTools)}\n</host_tools>`,
        input.splitObservationsText
            ? `Tool observations (prefer current_run_observations for the latest request):\n${input.splitObservationsText}`
            : `Context: ${input.serializedOutput}`,
    ]
        .filter((line) => line != null && line.length > 0)
        .join('\n');
}
exports.buildPlanReasonHostFillUserContent = buildPlanReasonHostFillUserContent;
async function buildPlanReasonHostMachineStreamMessages(input) {
    const systemContent = await input.promptRegistry.render(prompt_template_keys_1.PROMPT_KEYS.AGENT_SUMMARIZE_PLAN_REASON_HOST_FILL_STREAM, input.scope);
    return [
        ...input.agentPrompts,
        { role: 'system', content: systemContent },
        { role: 'user', content: input.userContext },
    ];
}
exports.buildPlanReasonHostMachineStreamMessages = buildPlanReasonHostMachineStreamMessages;
function resolveReasonHostFillObservationPayload(input) {
    var _a;
    const splitOutput = (0, observation_format_util_1.isSplitToolObservationsOutput)(input.mergedObservation.output)
        ? input.mergedObservation.output
        : null;
    const primaryObservation = splitOutput
        ? (0, observation_format_util_1.resolvePrimaryObservationForSummarize)(splitOutput)
        : null;
    const primaryOutput = (_a = primaryObservation === null || primaryObservation === void 0 ? void 0 : primaryObservation.output) !== null && _a !== void 0 ? _a : input.mergedObservation.output;
    return {
        splitObservationsText: splitOutput
            ? (0, observation_format_util_1.formatSplitToolObservationsForSummarize)(splitOutput)
            : null,
        serializedOutput: JSON.stringify(primaryOutput),
    };
}
exports.resolveReasonHostFillObservationPayload = resolveReasonHostFillObservationPayload;
//# sourceMappingURL=plan-reason-host-machine-prompt.util.js.map