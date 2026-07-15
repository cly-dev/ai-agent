"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invokeDetectCluesLlm = exports.buildDetectCluesUserPayload = void 0;
const zod_1 = require("zod");
const task_plan_llm_util_1 = require("../../agent-engine/engine/main/plan/task-plan-llm.util");
const detect_clues_output_util_1 = require("./detect-clues-output.util");
const detectClueItemSchema = zod_1.z.object({
    key: zod_1.z.string().min(1),
    matched: zod_1.z.boolean(),
    confidence: zod_1.z.number().min(0).max(1),
    value: zod_1.z.string().nullable(),
    reason: zod_1.z.string().min(1).max(500),
});
const detectCluesSchema = zod_1.z.object({
    clues: zod_1.z.array(detectClueItemSchema),
});
const DETECT_CLUES_SYSTEM = `You classify which configured business STATES apply to the given context.
The catalog lists independent states (intent/category/flags). For EVERY catalog key, output one result with:
- matched: true only if that state clearly holds
- confidence: 0..1 self-assessed confidence
- value: optional short extracted detail when useful (e.g. an id), otherwise null
- reason: short justification (do not dump the full context)
Multiple states MAY be matched at once unless the objective/hint says they are mutually exclusive.
Obey exclusivity rules in hint/descriptions when stated (e.g. spam vs business intents).
Do not invent keys outside the catalog. Prefer false when uncertain.`;
function buildDetectCluesUserPayload(input) {
    var _a;
    return JSON.stringify({
        objective: input.objective,
        hint: (_a = input.hint) !== null && _a !== void 0 ? _a : null,
        stateCatalog: input.clues.map((row) => ({
            key: row.key,
            description: row.description,
        })),
        userMessage: input.userMessage,
        pageContext: input.pageContextSummary,
        priorNodeOutputs: input.priorOutputsSummary,
    }, null, 2);
}
exports.buildDetectCluesUserPayload = buildDetectCluesUserPayload;
async function invokeDetectCluesLlm(input) {
    const configuredKeys = input.clues.map((row) => row.key);
    if (configuredKeys.length === 0) {
        return { clues: [], matchedClueKeys: [] };
    }
    const messages = [
        { role: 'system', content: DETECT_CLUES_SYSTEM },
        {
            role: 'user',
            content: buildDetectCluesUserPayload(input),
        },
    ];
    let rawClues = [];
    try {
        const { model, messages: fittedMessages } = await input.llmService.createLangChainChatModelForMessages(messages, {
            budgetHints: { callKind: 'routing' },
        });
        const structuredModel = model.withStructuredOutput(detectCluesSchema);
        const parsed = (await structuredModel.invoke(fittedMessages));
        rawClues = parsed.clues;
    }
    catch (_a) {
        try {
            const result = await input.llmService.chat({
                messages,
                tools: [],
                budgetHints: { callKind: 'routing' },
            });
            const parsed = (0, task_plan_llm_util_1.tryParseJsonObject)(result.content);
            if (!parsed) {
                return null;
            }
            const safe = detectCluesSchema.safeParse(parsed);
            if (!safe.success) {
                return null;
            }
            rawClues = safe.data.clues;
        }
        catch (_b) {
            return null;
        }
    }
    const normalized = (0, detect_clues_output_util_1.normalizeDetectCluesOutput)({
        configuredKeys,
        rawClues,
    });
    return normalized;
}
exports.invokeDetectCluesLlm = invokeDetectCluesLlm;
//# sourceMappingURL=detect-clues-llm.util.js.map