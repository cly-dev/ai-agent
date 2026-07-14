"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeSessionHistoryTurnBlocks = exports.applyDegradeToBlock = void 0;
const prompt_budget_constants_1 = require("./prompt-budget.constants");
const observation_degrade_util_1 = require("./observation-degrade.util");
const goa_degrade_util_1 = require("./goa-degrade.util");
const context_json_degrade_util_1 = require("./context-json-degrade.util");
const text_degrade_util_1 = require("./text-degrade.util");
function applyDegradeToBlock(block, level) {
    var _a;
    if (level === 0) {
        return Object.assign(Object.assign({}, block), { degradeLevel: 0, payload: clonePayload(block.payload) });
    }
    if (level === 4) {
        return Object.assign(Object.assign({}, block), { degradeLevel: 4, payload: { type: 'text', text: '' } });
    }
    const payload = clonePayload(block.payload);
    switch (block.kind) {
        case 'current_run_observations':
        case 'working_memory_observations':
            if (payload.type === 'observations' && level >= 1 && level <= 3) {
                payload.observations = (0, observation_degrade_util_1.degradeObservations)(payload.observations, level);
            }
            else if (payload.type === 'text' && level >= 1) {
                payload.text =
                    level === 1
                        ? (0, text_degrade_util_1.excerptText)(payload.text, 8000)
                        : level === 2
                            ? (0, text_degrade_util_1.excerptText)(payload.text, 3000)
                            : (0, text_degrade_util_1.excerptText)(payload.text, 500);
            }
            break;
        case 'tool_decision':
            if (payload.type === 'text') {
                if (level === 1) {
                    payload.text = (0, text_degrade_util_1.degradeActiveSkillInToolDecision)(payload.text, 1);
                }
                else if (level === 2) {
                    payload.text = (0, text_degrade_util_1.degradeActiveSkillInToolDecision)(payload.text, 2);
                }
            }
            break;
        case 'tool_schema':
        case 'host_tool_schema':
            if (payload.type === 'tool_schema') {
                if (level === 1 || level === 2) {
                    payload.json = (0, text_degrade_util_1.compactToolSchemaJson)(payload.json);
                }
            }
            break;
        case 'agent_prompt':
            if (payload.type === 'text') {
                payload.text =
                    level === 1
                        ? (0, text_degrade_util_1.degradePlainText)(payload.text, 1, (0, prompt_budget_constants_1.getPromptAgentExcerptChars)(), (0, prompt_budget_constants_1.getPromptAgentExcerptCharsL2)())
                        : (0, text_degrade_util_1.degradePlainText)(payload.text, 2, (0, prompt_budget_constants_1.getPromptAgentExcerptChars)(), (0, prompt_budget_constants_1.getPromptAgentExcerptCharsL2)());
            }
            break;
        case 'response_style':
        case 'message_blocks_spec':
        case 'user_memory':
        case 'other':
        case 'tool_result_legacy':
            if (payload.type === 'text') {
                if (level === 1) {
                    payload.text = (0, text_degrade_util_1.excerptText)(payload.text, 2000);
                }
                else if (level === 2) {
                    payload.text = '';
                }
            }
            break;
        case 'session_history_summary':
            if (payload.type === 'text') {
                const degraded = level === 1
                    ? (0, goa_degrade_util_1.degradeSessionHistorySummary)(payload.text, 1)
                    : (0, goa_degrade_util_1.degradeSessionHistorySummary)(payload.text, 2);
                payload.text = degraded !== null && degraded !== void 0 ? degraded : '';
            }
            break;
        case 'session_history_guide':
            if (payload.type === 'text' && level === 1) {
                payload.text = (0, text_degrade_util_1.excerptText)(payload.text, 1200);
            }
            break;
        case 'session_history_turns':
            if (payload.type === 'text') {
                if (payload.text.includes('<context>')) {
                    payload.text = (0, context_json_degrade_util_1.degradeTaggedContextJsonMessage)(payload.text, level);
                }
                else {
                    payload.text = (0, text_degrade_util_1.excerptText)(payload.text, level === 1 ? 3000 : level === 2 ? 1500 : 800);
                }
            }
            break;
        case 'session_goa':
            if (payload.type === 'session_goa') {
                const degraded = (0, goa_degrade_util_1.degradeSessionGoaText)(payload.text, payload.section, level);
                payload.text = degraded !== null && degraded !== void 0 ? degraded : '';
            }
            break;
        case 'page_context':
            if (payload.type === 'text') {
                payload.text = (0, goa_degrade_util_1.degradePageContext)(payload.text, level);
            }
            break;
        case 'plan_context':
            if (payload.type === 'text' && level === 1) {
                const objective = (_a = extractTaggedContent(payload.text, 'current_objective')) !== null && _a !== void 0 ? _a : extractTaggedContent(payload.text, 'plan_context');
                payload.text = objective
                    ? `<plan_context>\n${objective}\n</plan_context>`
                    : (0, text_degrade_util_1.excerptText)(payload.text, 1500);
            }
            break;
        case 'pending_write_tool_call':
            if (payload.type === 'text' && level === 1) {
                payload.text = (0, text_degrade_util_1.excerptText)(payload.text, 2000);
            }
            break;
        case 'summarize_context':
            if (payload.type === 'text') {
                payload.text =
                    level === 1
                        ? (0, text_degrade_util_1.excerptText)(payload.text, 4000)
                        : level === 2
                            ? (0, text_degrade_util_1.excerptText)(payload.text, 1500)
                            : payload.text;
            }
            break;
        case 'invoke_context':
            if (payload.type === 'text' && level >= 1) {
                payload.text = (0, context_json_degrade_util_1.degradeInvokeContextBlockText)(payload.text, level);
            }
            break;
        default:
            break;
    }
    return Object.assign(Object.assign({}, block), { degradeLevel: level, payload });
}
exports.applyDegradeToBlock = applyDegradeToBlock;
function extractTaggedContent(content, tag) {
    const open = `<${tag}>`;
    const close = `</${tag}>`;
    const start = content.indexOf(open);
    if (start < 0) {
        return null;
    }
    const end = content.indexOf(close, start + open.length);
    if (end < 0) {
        return null;
    }
    return content.slice(start + open.length, end).trim();
}
function clonePayload(payload) {
    if (payload.type === 'observations') {
        return {
            type: 'observations',
            preamble: payload.preamble,
            observations: payload.observations.map((row) => { var _a; return (Object.assign(Object.assign({}, row), { records: (_a = row.records) === null || _a === void 0 ? void 0 : _a.map((r) => (Object.assign({}, r))) })); }),
        };
    }
    if (payload.type === 'tool_schema') {
        return { type: 'tool_schema', json: payload.json };
    }
    if (payload.type === 'session_goa') {
        return { type: 'session_goa', section: payload.section, text: payload.text };
    }
    return { type: 'text', text: payload.text };
}
function mergeSessionHistoryTurnBlocks(blocks) {
    const turnBlocks = blocks.filter((b) => b.kind === 'session_history_turns');
    if (turnBlocks.length <= (0, prompt_budget_constants_1.getPromptHistoryMaxTurnsL0)()) {
        return blocks;
    }
    const max = (0, prompt_budget_constants_1.getPromptHistoryMaxTurnsL0)();
    const keptIds = new Set(turnBlocks.slice(-max).map((row) => row.id));
    return blocks.filter((block) => block.kind !== 'session_history_turns' || keptIds.has(block.id));
}
exports.mergeSessionHistoryTurnBlocks = mergeSessionHistoryTurnBlocks;
//# sourceMappingURL=apply-block-degrade.util.js.map