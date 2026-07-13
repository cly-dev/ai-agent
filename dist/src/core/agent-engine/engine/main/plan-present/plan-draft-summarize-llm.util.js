"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invokePlanDraftProseSupplement = exports.renderPlanPresentFromComposeSystemPrompt = exports.renderPlanDraftProseSupplementSystemPrompt = exports.buildPlanDraftSummarizeUserContent = void 0;
const prompt_template_keys_1 = require("../../../../prompt/prompt-template.keys");
const llm_output_sanitize_util_1 = require("../../llm-output-sanitize.util");
function buildPlanDraftSummarizeUserContent(input) {
    const composedBlock = input.composedWritePayload
        ? `<pending_write_tool_call>\n${JSON.stringify({
            tool: input.composedWritePayload.tool,
            arguments: input.composedWritePayload.arguments,
        })}\n</pending_write_tool_call>`
        : null;
    return [
        `User request: ${input.userMessage}`,
        input.planContext
            ? `<plan_context>\n${input.planContext}\n</plan_context>`
            : null,
        composedBlock,
        `<tool_schema>\n${input.toolSchemaJson}\n</tool_schema>`,
        input.writeToolNames.length > 0
            ? `Write tool(s): ${input.writeToolNames.join(', ')}`
            : `Tool: ${input.toolName}`,
        input.writeToolDescriptions
            ? `Tool description:\n${input.writeToolDescriptions}`
            : input.toolDescription
                ? `Tool description: ${input.toolDescription}`
                : null,
        input.fieldLabelText ? `Field labels:\n${input.fieldLabelText}` : null,
        input.splitObservationsText
            ? `Tool observations (prefer current_run_observations for the latest request):\n${input.splitObservationsText}`
            : `Tool result: ${input.serializedOutput}`,
    ]
        .filter((line) => line != null && line.length > 0)
        .join('\n');
}
exports.buildPlanDraftSummarizeUserContent = buildPlanDraftSummarizeUserContent;
async function renderPlanDraftProseSupplementSystemPrompt(input) {
    return input.promptRegistry.render(prompt_template_keys_1.PROMPT_KEYS.AGENT_SUMMARIZE_PLAN_DRAFT_PROSE_SUPPLEMENT, input.scope);
}
exports.renderPlanDraftProseSupplementSystemPrompt = renderPlanDraftProseSupplementSystemPrompt;
async function renderPlanPresentFromComposeSystemPrompt(input) {
    return input.promptRegistry.render(prompt_template_keys_1.PROMPT_KEYS.AGENT_SUMMARIZE_PLAN_PRESENT_FROM_COMPOSE, input.scope);
}
exports.renderPlanPresentFromComposeSystemPrompt = renderPlanPresentFromComposeSystemPrompt;
async function invokePlanDraftProseSupplement(input) {
    var _a, _b;
    const messages = [...input.agentPrompts];
    messages.push({
        role: 'system',
        content: await renderPlanDraftProseSupplementSystemPrompt({
            promptRegistry: input.promptRegistry,
            scope: input.scope,
        }),
    });
    messages.push({
        role: 'user',
        content: input.userContext,
    });
    try {
        const result = await input.llmService.chat({
            messages,
            tools: [],
            budgetHints: { callKind: 'summarize' },
        });
        return (0, llm_output_sanitize_util_1.extractLlmUserFacingText)((_a = result.content) !== null && _a !== void 0 ? _a : '').trim();
    }
    catch (error) {
        (_b = input.logWarn) === null || _b === void 0 ? void 0 : _b.call(input, `plan draft prose supplement failed: ${error instanceof Error ? error.message : String(error)}`);
        return '';
    }
}
exports.invokePlanDraftProseSupplement = invokePlanDraftProseSupplement;
//# sourceMappingURL=plan-draft-summarize-llm.util.js.map