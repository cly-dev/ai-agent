"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetCompositeBlockIdCounterForTests = exports.parseCompositeUserMessage = exports.isCompositeSummarizeUserMessage = void 0;
const prompt_budget_constants_1 = require("./prompt-budget.constants");
const observation_degrade_util_1 = require("./observation-degrade.util");
let compositeBlockIdCounter = 0;
function nextCompositeBlockId(kind, messageIndex) {
    compositeBlockIdCounter += 1;
    return `${kind}:${messageIndex}:c${compositeBlockIdCounter}`;
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
function createCompositeBlock(input) {
    return {
        id: nextCompositeBlockId(input.kind, input.sourceMessageIndex),
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
function extractUserRequestSection(content) {
    var _a, _b;
    const tagged = extractTaggedContent(content, 'current_user_request');
    if (tagged) {
        return tagged;
    }
    const firstLine = (_b = (_a = content.split('\n')[0]) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : '';
    if (!firstLine.startsWith('User request:')) {
        return null;
    }
    return firstLine;
}
function stripObservationsRegion(content) {
    let working = content;
    for (const tag of ['working_memory_observations', 'current_run_observations']) {
        const open = `<${tag}>`;
        const close = `</${tag}>`;
        let start = working.indexOf(open);
        while (start >= 0) {
            const end = working.indexOf(close, start + open.length);
            if (end < 0) {
                break;
            }
            working = `${working.slice(0, start)}${working.slice(end + close.length)}`;
            start = working.indexOf(open);
        }
    }
    return working
        .replace(/Tool observations \(prefer current_run_observations for the latest request\):\s*/gi, '')
        .trim();
}
function stripTaggedRegion(content, tag) {
    const tagged = extractTaggedContent(content, tag);
    if (!tagged) {
        return content;
    }
    return content.replace(tagged, '').trim();
}
function tryParseInlineToolResult(content) {
    var _a;
    const match = content.match(/Tool result:\s*([\s\S]+)/i);
    if (!((_a = match === null || match === void 0 ? void 0 : match[1]) === null || _a === void 0 ? void 0 : _a.trim())) {
        return null;
    }
    const body = match[1].trim();
    const asObservations = (0, observation_degrade_util_1.parseObservationsJson)(body);
    if (asObservations.length > 0) {
        return { type: 'observations', observations: asObservations };
    }
    try {
        const parsed = JSON.parse(body);
        if (Array.isArray(parsed)) {
            return {
                type: 'observations',
                observations: [
                    {
                        tool: 'tool_result',
                        success: true,
                        records: parsed.filter((row) => row != null && typeof row === 'object' && !Array.isArray(row)),
                        summary: { matchedCount: parsed.length },
                    },
                ],
            };
        }
        if (parsed != null && typeof parsed === 'object') {
            return {
                type: 'observations',
                observations: [
                    {
                        tool: 'tool_result',
                        success: true,
                        records: [parsed],
                        summary: { matchedCount: 1 },
                    },
                ],
            };
        }
    }
    catch (_b) {
    }
    return {
        type: 'text',
        text: `Tool result: ${body}`,
    };
}
function isCompositeSummarizeUserMessage(content) {
    return (content.includes('User request:') ||
        content.includes('<plan_context>') ||
        content.includes('<tool_schema>') ||
        content.includes('<pending_write_tool_call>') ||
        /Tool result:/i.test(content) ||
        (content.includes('<working_memory_observations>') &&
            (content.includes('User request:') || content.includes('<plan_context>'))));
}
exports.isCompositeSummarizeUserMessage = isCompositeSummarizeUserMessage;
function parseCompositeUserMessage(message, messageIndex) {
    compositeBlockIdCounter = 0;
    const content = message.content;
    const blocks = [];
    const userRequest = extractUserRequestSection(content);
    if (userRequest) {
        blocks.push(createCompositeBlock({
            kind: 'current_user_request',
            role: message.role,
            payload: { type: 'text', text: userRequest },
            sourceMessageIndex: messageIndex,
            toolCallId: message.toolCallId,
        }));
    }
    const planContext = extractTaggedContent(content, 'plan_context');
    if (planContext) {
        blocks.push(createCompositeBlock({
            kind: 'plan_context',
            role: message.role,
            payload: { type: 'text', text: planContext },
            sourceMessageIndex: messageIndex,
            toolCallId: message.toolCallId,
        }));
    }
    const pageContext = extractTaggedContent(content, 'page_context');
    if (pageContext) {
        blocks.push(createCompositeBlock({
            kind: 'page_context',
            role: message.role,
            payload: { type: 'text', text: pageContext },
            sourceMessageIndex: messageIndex,
            toolCallId: message.toolCallId,
        }));
    }
    const toolSchemaInner = extractTaggedInner(content, 'tool_schema');
    if (toolSchemaInner != null) {
        blocks.push(createCompositeBlock({
            kind: 'tool_schema',
            role: message.role,
            payload: { type: 'tool_schema', json: toolSchemaInner },
            sourceMessageIndex: messageIndex,
            toolCallId: message.toolCallId,
        }));
    }
    const hostToolSchemaInner = extractTaggedInner(content, 'host_tool_schema');
    if (hostToolSchemaInner != null) {
        blocks.push(createCompositeBlock({
            kind: 'host_tool_schema',
            role: message.role,
            payload: { type: 'tool_schema', json: hostToolSchemaInner },
            sourceMessageIndex: messageIndex,
            toolCallId: message.toolCallId,
        }));
    }
    const pendingWrite = extractTaggedContent(content, 'pending_write_tool_call');
    if (pendingWrite) {
        blocks.push(createCompositeBlock({
            kind: 'pending_write_tool_call',
            role: message.role,
            payload: { type: 'text', text: pendingWrite },
            sourceMessageIndex: messageIndex,
            toolCallId: message.toolCallId,
        }));
    }
    const workingRaw = extractTaggedInner(content, 'working_memory_observations');
    if (workingRaw != null) {
        blocks.push(createCompositeBlock({
            kind: 'working_memory_observations',
            role: message.role,
            payload: (0, observation_degrade_util_1.resolveObservationBlockPayload)(workingRaw),
            sourceMessageIndex: messageIndex,
            toolCallId: message.toolCallId,
        }));
    }
    const currentRaw = extractTaggedInner(content, 'current_run_observations');
    if (currentRaw != null) {
        blocks.push(createCompositeBlock({
            kind: 'current_run_observations',
            role: message.role,
            payload: (0, observation_degrade_util_1.resolveObservationBlockPayload)(currentRaw),
            sourceMessageIndex: messageIndex,
            toolCallId: message.toolCallId,
        }));
    }
    if (workingRaw == null && currentRaw == null) {
        const toolResultPayload = tryParseInlineToolResult(content);
        if ((toolResultPayload === null || toolResultPayload === void 0 ? void 0 : toolResultPayload.type) === 'observations') {
            blocks.push(createCompositeBlock({
                kind: 'current_run_observations',
                role: message.role,
                payload: toolResultPayload,
                sourceMessageIndex: messageIndex,
                toolCallId: message.toolCallId,
            }));
        }
        else if ((toolResultPayload === null || toolResultPayload === void 0 ? void 0 : toolResultPayload.type) === 'text') {
            blocks.push(createCompositeBlock({
                kind: 'current_run_observations',
                role: message.role,
                payload: toolResultPayload,
                sourceMessageIndex: messageIndex,
                toolCallId: message.toolCallId,
            }));
        }
    }
    let contextBody = stripObservationsRegion(content);
    if (userRequest) {
        contextBody = contextBody.replace(userRequest, '').trim();
    }
    if (planContext) {
        contextBody = contextBody.replace(planContext, '').trim();
    }
    if (pageContext) {
        contextBody = contextBody.replace(pageContext, '').trim();
    }
    for (const tag of [
        'tool_schema',
        'host_tool_schema',
        'pending_write_tool_call',
    ]) {
        contextBody = stripTaggedRegion(contextBody, tag);
    }
    contextBody = contextBody.replace(/Tool result:[\s\S]*$/i, '').trim();
    if (contextBody.length > 0) {
        blocks.push(createCompositeBlock({
            kind: 'summarize_context',
            role: message.role,
            payload: { type: 'text', text: contextBody },
            sourceMessageIndex: messageIndex,
            toolCallId: message.toolCallId,
        }));
    }
    if (blocks.length === 0) {
        blocks.push(createCompositeBlock({
            kind: 'other',
            role: message.role,
            payload: { type: 'text', text: content },
            sourceMessageIndex: messageIndex,
            toolCallId: message.toolCallId,
        }));
    }
    return blocks;
}
exports.parseCompositeUserMessage = parseCompositeUserMessage;
function resetCompositeBlockIdCounterForTests() {
    compositeBlockIdCounter = 0;
}
exports.resetCompositeBlockIdCounterForTests = resetCompositeBlockIdCounterForTests;
//# sourceMappingURL=prompt-block-composite-parser.util.js.map