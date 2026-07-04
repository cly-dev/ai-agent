"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeMissingFieldsFromLlm = exports.evaluateReadinessSlotsWithLlm = void 0;
const zod_1 = require("zod");
const prompt_template_keys_1 = require("../../../prompt/prompt-template.keys");
const page_context_prompt_util_1 = require("../../../host-bridge/page-context.prompt.util");
const readinessSlotSchema = zod_1.z.object({
    ready: zod_1.z.boolean(),
    missingFields: zod_1.z
        .array(zod_1.z.object({
        name: zod_1.z.string().min(1),
        hint: zod_1.z.string().min(1),
    }))
        .optional()
        .default([]),
});
async function evaluateReadinessSlotsWithLlm(input) {
    const systemPrompt = await input.promptRegistry.render(prompt_template_keys_1.PROMPT_KEYS.AGENT_READINESS_SLOT_CHECK, input.scope);
    const pageContextBlock = (0, page_context_prompt_util_1.formatPageContextPromptBlock)(input.pageContext);
    const messages = [
        { role: 'system', content: systemPrompt },
        {
            role: 'user',
            content: [
                `User message: ${input.userMessage}`,
                pageContextBlock,
                input.planGoal ? `Plan goal: ${input.planGoal}` : null,
                input.currentObjective
                    ? `Current objective: ${input.currentObjective}`
                    : null,
                `Required business fields: ${JSON.stringify(input.requiredFields)}`,
                input.sessionObservationSummary
                    ? `Session observation summary:\n${input.sessionObservationSummary}`
                    : 'Session observation summary: (none)',
            ]
                .filter((line) => line != null && line.length > 0)
                .join('\n'),
        },
    ];
    const result = await input.llmService.chat({
        messages,
        tools: [],
        temperature: 0,
        maxTokens: 512,
    });
    const parsed = extractJsonObject(result.content);
    const validated = readinessSlotSchema.safeParse(parsed);
    if (!validated.success) {
        return { ready: true, missingFields: [] };
    }
    return validated.data;
}
exports.evaluateReadinessSlotsWithLlm = evaluateReadinessSlotsWithLlm;
function extractJsonObject(text) {
    var _a, _b;
    const trimmed = text.trim();
    const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const candidate = (_b = (_a = fence === null || fence === void 0 ? void 0 : fence[1]) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : trimmed;
    try {
        return JSON.parse(candidate);
    }
    catch (_c) {
        const start = candidate.indexOf('{');
        const end = candidate.lastIndexOf('}');
        if (start >= 0 && end > start) {
            try {
                return JSON.parse(candidate.slice(start, end + 1));
            }
            catch (_d) {
                return null;
            }
        }
        return null;
    }
}
function normalizeMissingFieldsFromLlm(rows) {
    if (!(rows === null || rows === void 0 ? void 0 : rows.length)) {
        return [];
    }
    const deduped = new Map();
    for (const row of rows) {
        const name = row.name.trim();
        const hint = row.hint.trim();
        if (!name || !hint) {
            continue;
        }
        deduped.set(name, { name, hint });
    }
    return [...deduped.values()];
}
exports.normalizeMissingFieldsFromLlm = normalizeMissingFieldsFromLlm;
//# sourceMappingURL=turn-readiness-llm.util.js.map