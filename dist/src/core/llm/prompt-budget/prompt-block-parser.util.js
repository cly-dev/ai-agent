"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPromptBlockIdCounterForTests = exports.parsePromptBlocks = exports.shouldParseAsCompositeMessage = void 0;
const prompt_budget_constants_1 = require("./prompt-budget.constants");
const goa_degrade_util_1 = require("./goa-degrade.util");
const observation_degrade_util_1 = require("./observation-degrade.util");
const prompt_block_composite_parser_util_1 = require("./prompt-block-composite-parser.util");
const prompt_block_decision_user_parser_util_1 = require("./prompt-block-decision-user-parser.util");
let blockIdCounter = 0;
function nextBlockId(kind, messageIndex) {
    blockIdCounter += 1;
    return `${kind}:${messageIndex}:${blockIdCounter}`;
}
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
function createBlock(input) {
    return {
        id: nextBlockId(input.kind, input.sourceMessageIndex),
        kind: input.kind,
        priority: prompt_budget_constants_1.BLOCK_PRIORITY[input.kind],
        degradeLevel: 0,
        maxDegradeLevel: prompt_budget_constants_1.BLOCK_MAX_DEGRADE[input.kind],
        role: input.role,
        toolCallId: input.toolCallId,
        payload: input.payload,
        sourceMessageIndex: input.sourceMessageIndex,
    };
}
function parseObservationSplitMessage(message, messageIndex) {
    const content = message.content;
    const preambleEnd = content.indexOf('<working_memory_observations>');
    const preamble = preambleEnd > 0 ? content.slice(0, preambleEnd).trim() : undefined;
    const workingRaw = extractTaggedContent(content, 'working_memory_observations');
    const currentRaw = extractTaggedContent(content, 'current_run_observations');
    const blocks = [];
    if (workingRaw != null) {
        const payload = (0, observation_degrade_util_1.resolveObservationBlockPayload)(workingRaw);
        blocks.push(createBlock({
            kind: 'working_memory_observations',
            role: message.role,
            payload: payload.type === 'observations'
                ? Object.assign(Object.assign({}, payload), { preamble }) : payload,
            sourceMessageIndex: messageIndex,
            toolCallId: message.toolCallId,
        }));
    }
    if (currentRaw != null) {
        blocks.push(createBlock({
            kind: 'current_run_observations',
            role: message.role,
            payload: (0, observation_degrade_util_1.resolveObservationBlockPayload)(currentRaw),
            sourceMessageIndex: messageIndex,
            toolCallId: message.toolCallId,
        }));
    }
    if (blocks.length === 0) {
        blocks.push(createBlock({
            kind: 'other',
            role: message.role,
            payload: { type: 'text', text: content },
            sourceMessageIndex: messageIndex,
            toolCallId: message.toolCallId,
        }));
    }
    return blocks;
}
function classifySystemMessage(content, message, messageIndex) {
    const tagKindPairs = [
        ['agent_prompt', 'agent_prompt'],
        ['response_style', 'response_style'],
        ['message_blocks_spec', 'message_blocks_spec'],
        ['user_memory', 'user_memory'],
        ['page_context', 'page_context'],
        ['session_history_summary', 'session_history_summary'],
        ['tool_decision', 'tool_decision'],
        ['plan_step_override', 'plan_step_override'],
        ['plan_context', 'plan_context'],
        ['current_objective', 'plan_context'],
    ];
    for (const [tag, kind] of tagKindPairs) {
        if (content.includes(`<${tag}>`)) {
            return createBlock({
                kind,
                role: message.role,
                payload: { type: 'text', text: content },
                sourceMessageIndex: messageIndex,
                toolCallId: message.toolCallId,
            });
        }
    }
    if (content.includes('<session_history>') &&
        !content.includes('<session_history_summary>')) {
        return createBlock({
            kind: 'session_history_guide',
            role: message.role,
            payload: { type: 'text', text: content },
            sourceMessageIndex: messageIndex,
            toolCallId: message.toolCallId,
        });
    }
    for (const tag of Object.keys(prompt_budget_constants_1.SESSION_GOA_TAG_SECTION)) {
        if (content.includes(`<${tag}>`)) {
            const section = (0, goa_degrade_util_1.detectSessionGoaSection)(content);
            return createBlock({
                kind: 'session_goa',
                role: message.role,
                payload: { type: 'session_goa', section, text: content },
                sourceMessageIndex: messageIndex,
                toolCallId: message.toolCallId,
            });
        }
    }
    return createBlock({
        kind: 'other',
        role: message.role,
        payload: { type: 'text', text: content },
        sourceMessageIndex: messageIndex,
        toolCallId: message.toolCallId,
    });
}
function shouldParseAsCompositeMessage(content, callKind) {
    if (callKind !== 'summarize' && callKind !== 'plan') {
        return false;
    }
    return (0, prompt_block_composite_parser_util_1.isCompositeSummarizeUserMessage)(content);
}
exports.shouldParseAsCompositeMessage = shouldParseAsCompositeMessage;
function parseSingleMessage(message, messageIndex, options) {
    var _a, _b;
    const content = message.content;
    if ((0, prompt_block_decision_user_parser_util_1.shouldParseAsDecisionInvokeUserMessage)(message, options === null || options === void 0 ? void 0 : options.callKind)) {
        return (0, prompt_block_decision_user_parser_util_1.parseDecisionInvokeUserMessage)(message, messageIndex);
    }
    if ((message.role === 'user' || message.role === 'assistant') &&
        shouldParseAsCompositeMessage(content, options === null || options === void 0 ? void 0 : options.callKind)) {
        return (0, prompt_block_composite_parser_util_1.parseCompositeUserMessage)(message, messageIndex);
    }
    if (content.includes('<working_memory_observations>') ||
        content.includes('<current_run_observations>')) {
        return parseObservationSplitMessage(message, messageIndex);
    }
    if (message.role === 'tool') {
        if (content.includes('<tool_schema>')) {
            const inner = (_a = extractTaggedContent(content, 'tool_schema')) !== null && _a !== void 0 ? _a : content;
            return [
                createBlock({
                    kind: 'tool_schema',
                    role: message.role,
                    payload: { type: 'tool_schema', json: inner },
                    sourceMessageIndex: messageIndex,
                    toolCallId: message.toolCallId,
                }),
            ];
        }
        if (content.includes('<host_tool_schema>')) {
            const inner = (_b = extractTaggedContent(content, 'host_tool_schema')) !== null && _b !== void 0 ? _b : content;
            return [
                createBlock({
                    kind: 'host_tool_schema',
                    role: message.role,
                    payload: { type: 'tool_schema', json: inner },
                    sourceMessageIndex: messageIndex,
                    toolCallId: message.toolCallId,
                }),
            ];
        }
    }
    if (message.role === 'system') {
        return [classifySystemMessage(content, message, messageIndex)];
    }
    if (content.includes('<current_user_request>')) {
        return [
            createBlock({
                kind: 'current_user_request',
                role: message.role,
                payload: { type: 'text', text: content },
                sourceMessageIndex: messageIndex,
                toolCallId: message.toolCallId,
            }),
        ];
    }
    if (content.startsWith('[tool_result:')) {
        return [
            createBlock({
                kind: 'tool_result_legacy',
                role: message.role,
                payload: { type: 'text', text: content },
                sourceMessageIndex: messageIndex,
                toolCallId: message.toolCallId,
            }),
        ];
    }
    if (message.role === 'user' || message.role === 'assistant') {
        return [
            createBlock({
                kind: 'session_history_turns',
                role: message.role,
                payload: { type: 'text', text: content },
                sourceMessageIndex: messageIndex,
                toolCallId: message.toolCallId,
            }),
        ];
    }
    return [
        createBlock({
            kind: 'other',
            role: message.role,
            payload: { type: 'text', text: content },
            sourceMessageIndex: messageIndex,
            toolCallId: message.toolCallId,
        }),
    ];
}
function parsePromptBlocks(messages, options) {
    blockIdCounter = 0;
    return messages.flatMap((message, index) => parseSingleMessage(message, index, options));
}
exports.parsePromptBlocks = parsePromptBlocks;
function resetPromptBlockIdCounterForTests() {
    blockIdCounter = 0;
}
exports.resetPromptBlockIdCounterForTests = resetPromptBlockIdCounterForTests;
//# sourceMappingURL=prompt-block-parser.util.js.map