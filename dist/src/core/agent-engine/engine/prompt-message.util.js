"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractSessionHistoryForDecision = exports.extractSessionMemoryForDecision = exports.extractConversationTurns = exports.joinAgentPromptText = exports.extractAgentPromptMessages = exports.extractPageContextForDecision = exports.isPageContextBlockMessage = exports.isDecisionLoopExcludedMessage = exports.isAgentPromptMessage = void 0;
function isAgentPromptMessage(message) {
    return (message.role === 'system' && message.content.includes('<agent_prompt>'));
}
exports.isAgentPromptMessage = isAgentPromptMessage;
function isDecisionLoopExcludedMessage(message) {
    if (message.role !== 'system') {
        return false;
    }
    const content = message.content;
    return (content.includes('<response_style>') ||
        content.includes('<message_blocks_spec>') ||
        content.includes('<user_memory>') ||
        content.includes('<session_history>'));
}
exports.isDecisionLoopExcludedMessage = isDecisionLoopExcludedMessage;
function isPageContextBlockMessage(message) {
    return (message.role === 'system' && message.content.includes('<page_context>'));
}
exports.isPageContextBlockMessage = isPageContextBlockMessage;
function extractPageContextForDecision(messages) {
    return messages.filter(isPageContextBlockMessage);
}
exports.extractPageContextForDecision = extractPageContextForDecision;
function extractAgentPromptMessages(messages) {
    return messages.filter(isAgentPromptMessage);
}
exports.extractAgentPromptMessages = extractAgentPromptMessages;
function joinAgentPromptText(messages) {
    const blocks = extractAgentPromptMessages(messages)
        .map((message) => message.content.trim())
        .filter((content) => content.length > 0);
    if (blocks.length === 0) {
        return null;
    }
    return blocks.join('\n\n');
}
exports.joinAgentPromptText = joinAgentPromptText;
function extractConversationTurns(messages) {
    return messages.filter((message) => (message.role === 'user' || message.role === 'assistant') &&
        !message.content.includes('<current_user_request>'));
}
exports.extractConversationTurns = extractConversationTurns;
function isSessionHistorySummaryMessage(message) {
    return (message.role === 'system' &&
        message.content.includes('<session_history_summary>'));
}
function isSessionHistoryGuideMessage(message) {
    return (message.role === 'system' &&
        message.content.includes('<session_history>') &&
        !message.content.includes('<session_history_summary>'));
}
function isSessionMemoryBlockMessage(message) {
    if (message.role !== 'system') {
        return false;
    }
    const content = message.content;
    return (content.includes('<session_goa_coverage>') ||
        content.includes('<recent_episodes>') ||
        content.includes('<artifact_summaries>') ||
        content.includes('<observation_inventory>') ||
        content.includes('<active_task>') ||
        content.includes('<session_entities>'));
}
function extractSessionMemoryForDecision(messages) {
    return messages.filter(isSessionMemoryBlockMessage);
}
exports.extractSessionMemoryForDecision = extractSessionMemoryForDecision;
function extractSessionHistoryForDecision(messages, latestUserMessage) {
    const latest = latestUserMessage.trim();
    const out = [];
    for (const message of messages) {
        if (isSessionHistoryGuideMessage(message) ||
            isSessionHistorySummaryMessage(message)) {
            out.push(message);
        }
    }
    const turns = extractConversationTurns(messages);
    for (let i = 0; i < turns.length; i += 1) {
        const turn = turns[i];
        const isLast = i === turns.length - 1;
        if (isLast && turn.role === 'user' && turn.content.trim() === latest) {
            continue;
        }
        out.push(turn);
    }
    return out;
}
exports.extractSessionHistoryForDecision = extractSessionHistoryForDecision;
//# sourceMappingURL=prompt-message.util.js.map