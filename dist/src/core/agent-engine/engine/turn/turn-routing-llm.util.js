"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveTurnRoute = void 0;
const zod_1 = require("zod");
const prompt_template_keys_1 = require("../../../prompt/prompt-template.keys");
const task_plan_llm_util_1 = require("../main/plan/task-plan-llm.util");
const parse_llm_write_channel_util_1 = require("./parse-llm-write-channel.util");
const turn_routing_util_1 = require("./turn-routing.util");
const turnRouteSchema = zod_1.z.object({
    route: zod_1.z.enum(['direct_answer', 'on_page_task', 'orchestrated_task']),
    reason: zod_1.z.string().min(1).max(500),
    suggestedSkillId: zod_1.z.number().int().positive().nullable(),
    pageContextApplies: zod_1.z.boolean(),
    pageContextTaskKind: zod_1.z.enum(['analyze', 'answer', 'mutation', 'none']),
    readDeliverable: zod_1.z.enum(['list', 'analysis']).default('analysis'),
});
async function invokeTurnRouteLlm(input) {
    const systemPrompt = await input.promptRegistry.render(prompt_template_keys_1.PROMPT_KEYS.AGENT_TURN_ROUTE, input.scope);
    const messages = [
        { role: 'system', content: systemPrompt },
        {
            role: 'user',
            content: (0, turn_routing_util_1.buildTurnRouteLlmUserPayload)(input.routeInput),
        },
    ];
    try {
        const { model, messages: fittedMessages } = await input.llmService.createLangChainChatModelForMessages(messages, {
            budgetHints: { callKind: 'routing' },
        });
        const structuredModel = model.withStructuredOutput(turnRouteSchema);
        return (await structuredModel.invoke(fittedMessages));
    }
    catch (_a) {
        const result = await input.llmService.chat({
            messages,
            tools: [],
            budgetHints: { callKind: 'routing' },
        });
        const parsed = (0, task_plan_llm_util_1.tryParseJsonObject)(result.content);
        if (!parsed) {
            return null;
        }
        const safe = turnRouteSchema.safeParse(parsed);
        return safe.success ? safe.data : null;
    }
}
async function resolveTurnRoute(input) {
    const llmRaw = await invokeTurnRouteLlm(input);
    if (!llmRaw) {
        return (0, turn_routing_util_1.buildTurnRouteFallbackDraft)({
            reason: 'turn_route_llm_failed',
        });
    }
    const availableSkillIds = new Set(input.routeInput.availableSkills.map((skill) => skill.id));
    const onPageSuggestedSkillId = (() => {
        if (llmRaw.route !== 'on_page_task') {
            return null;
        }
        const requested = input.routeInput.requestedSkill;
        if (requested && availableSkillIds.has(requested.id)) {
            return requested.id;
        }
        const candidate = input.routeInput.pageHostSkillCandidate;
        if (candidate && availableSkillIds.has(candidate.id)) {
            return candidate.id;
        }
        return null;
    })();
    const suggestedSkillId = llmRaw.suggestedSkillId != null &&
        availableSkillIds.has(llmRaw.suggestedSkillId)
        ? llmRaw.suggestedSkillId
        : onPageSuggestedSkillId;
    return {
        route: llmRaw.route,
        method: 'llm',
        reason: llmRaw.reason.trim(),
        suggestedSkillId,
        pageContextApplies: llmRaw.pageContextApplies,
        llmPageContextTaskKind: llmRaw.pageContextTaskKind,
        readDeliverable: llmRaw.readDeliverable,
        draftWriteChannel: (0, parse_llm_write_channel_util_1.resolveDraftWriteChannelFromRouteLlm)({
            route: llmRaw.route,
            pageContextTaskKind: llmRaw.pageContextTaskKind,
        }),
    };
}
exports.resolveTurnRoute = resolveTurnRoute;
//# sourceMappingURL=turn-routing-llm.util.js.map