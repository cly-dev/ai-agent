"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetDecisionUserBlockIdCounterForTests = exports.parseDecisionInvokeUserMessage = exports.shouldParseAsDecisionInvokeUserMessage = void 0;
const prompt_budget_constants_1 = require("./prompt-budget.constants");
let decisionBlockIdCounter = 0;
function nextBlockId(kind, messageIndex) {
    decisionBlockIdCounter += 1;
    return `${kind}:${messageIndex}:d${decisionBlockIdCounter}`;
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
    return content.slice(start, end + close.length);
}
function extractTaggedInner(content, tag) {
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
function extractUserRequestLine(content) {
    var _a, _b;
    const tagged = extractTaggedContent(content, 'current_user_request');
    if (tagged) {
        return tagged;
    }
    const firstLine = (_b = (_a = content.split('\n')[0]) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : '';
    if (firstLine.startsWith('User request:')) {
        return firstLine;
    }
    return null;
}
function stripTaggedRegion(content, tag) {
    const tagged = extractTaggedContent(content, tag);
    if (!tagged) {
        return content;
    }
    return content.replace(tagged, '').trim();
}
function shouldParseAsDecisionInvokeUserMessage(message, callKind) {
    if (callKind !== 'decision') {
        return false;
    }
    if (message.role !== 'user' && message.role !== 'assistant') {
        return false;
    }
    return message.content.includes('<context>');
}
exports.shouldParseAsDecisionInvokeUserMessage = shouldParseAsDecisionInvokeUserMessage;
function parseDecisionInvokeUserMessage(message, messageIndex) {
    decisionBlockIdCounter = 0;
    const content = message.content;
    const blocks = [];
    const userRequest = extractUserRequestLine(content);
    if (userRequest) {
        blocks.push(createBlock({
            kind: 'current_user_request',
            role: message.role,
            payload: { type: 'text', text: userRequest },
            sourceMessageIndex: messageIndex,
            toolCallId: message.toolCallId,
        }));
    }
    const pageContext = extractTaggedContent(content, 'page_context');
    if (pageContext) {
        blocks.push(createBlock({
            kind: 'page_context',
            role: message.role,
            payload: { type: 'text', text: pageContext },
            sourceMessageIndex: messageIndex,
            toolCallId: message.toolCallId,
        }));
    }
    const contextInner = extractTaggedInner(content, 'context');
    if (contextInner != null) {
        blocks.push(createBlock({
            kind: 'invoke_context',
            role: message.role,
            payload: {
                type: 'text',
                text: `<context>\n${contextInner}\n</context>`,
            },
            sourceMessageIndex: messageIndex,
            toolCallId: message.toolCallId,
        }));
    }
    let remainder = content;
    if (userRequest) {
        remainder = remainder.replace(userRequest, '').trim();
    }
    if (pageContext) {
        remainder = remainder.replace(pageContext, '').trim();
    }
    remainder = stripTaggedRegion(remainder, 'context');
    if (remainder.length > 0) {
        blocks.push(createBlock({
            kind: 'session_history_turns',
            role: message.role,
            payload: { type: 'text', text: remainder },
            sourceMessageIndex: messageIndex,
            toolCallId: message.toolCallId,
        }));
    }
    if (blocks.length === 0) {
        blocks.push(createBlock({
            kind: 'session_history_turns',
            role: message.role,
            payload: { type: 'text', text: content },
            sourceMessageIndex: messageIndex,
            toolCallId: message.toolCallId,
        }));
    }
    return blocks;
}
exports.parseDecisionInvokeUserMessage = parseDecisionInvokeUserMessage;
function resetDecisionUserBlockIdCounterForTests() {
    decisionBlockIdCounter = 0;
}
exports.resetDecisionUserBlockIdCounterForTests = resetDecisionUserBlockIdCounterForTests;
//# sourceMappingURL=prompt-block-decision-user-parser.util.js.map