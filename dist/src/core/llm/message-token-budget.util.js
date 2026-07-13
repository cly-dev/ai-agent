"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trimMessagesToTokenBudget = exports.trimMessagesToTokenBudgetDetailed = exports.estimateMessagesTokens = exports.estimateMessageTokens = exports.estimateTextTokens = void 0;
const TRUNCATION_SUFFIX = '\n...[content truncated due to token limit]';
function estimateTextTokens(text) {
    if (!text) {
        return 0;
    }
    let tokens = 0;
    for (const char of text) {
        tokens += char.codePointAt(0) <= 0x7f ? 0.25 : 0.5;
    }
    return Math.ceil(tokens);
}
exports.estimateTextTokens = estimateTextTokens;
function estimateMessageTokens(message) {
    return 4 + estimateTextTokens(message.content);
}
exports.estimateMessageTokens = estimateMessageTokens;
function estimateMessagesTokens(messages) {
    return messages.reduce((sum, message) => sum + estimateMessageTokens(message), 0);
}
exports.estimateMessagesTokens = estimateMessagesTokens;
function truncateContentToTokenBudget(content, tokenBudget) {
    if (tokenBudget <= 0) {
        return TRUNCATION_SUFFIX.trim();
    }
    if (estimateTextTokens(content) <= tokenBudget) {
        return content;
    }
    const suffixTokens = estimateTextTokens(TRUNCATION_SUFFIX);
    const bodyBudget = Math.max(tokenBudget - suffixTokens, 16);
    let low = 0;
    let high = content.length;
    while (low < high) {
        const mid = Math.ceil((low + high) / 2);
        if (estimateTextTokens(content.slice(0, mid)) <= bodyBudget) {
            low = mid;
        }
        else {
            high = mid - 1;
        }
    }
    const keep = Math.max(low, 1);
    return `${content.slice(0, keep)}${TRUNCATION_SUFFIX}`;
}
function isToolResultMessage(message) {
    return (message.role === 'user' &&
        message.content.startsWith('[tool_result:'));
}
function isObservationsBlockMessage(message) {
    return (message.content.includes('<working_memory_observations>') ||
        message.content.includes('<current_run_observations>') ||
        message.content.includes('<observations>'));
}
function isToolSchemaBlockMessage(message) {
    return message.content.includes('<tool_schema>');
}
function isToolDecisionBlockMessage(message) {
    return message.content.includes('<tool_decision>');
}
function isAgentPromptMessage(message) {
    return (message.role === 'system' && message.content.includes('<agent_prompt>'));
}
function isDecisionLoopPinnedMessage(message) {
    return (isAgentPromptMessage(message) ||
        isPinnedUserRequestMessage(message) ||
        isToolSchemaBlockMessage(message) ||
        isToolDecisionBlockMessage(message));
}
function isPinnedUserRequestMessage(message) {
    return (message.role === 'user' &&
        message.content.includes('<current_user_request>'));
}
function cloneMessages(messages) {
    return messages.map((message) => (Object.assign({}, message)));
}
function trimMessagesToTokenBudgetDetailed(messages, maxTokens) {
    const estimatedTokensBefore = estimateMessagesTokens(messages);
    if (messages.length === 0 || maxTokens <= 0) {
        return {
            messages,
            estimatedTokensBefore,
            estimatedTokensAfter: estimatedTokensBefore,
            trimmed: false,
            droppedMessageIndexes: [],
            truncatedMessageIndexes: [],
        };
    }
    const working = cloneMessages(messages);
    const droppedMessageIndexes = [];
    const truncatedMessageIndexes = [];
    if (estimateMessagesTokens(working) <= maxTokens) {
        return {
            messages: working,
            estimatedTokensBefore,
            estimatedTokensAfter: estimatedTokensBefore,
            trimmed: false,
            droppedMessageIndexes,
            truncatedMessageIndexes,
        };
    }
    while (working.length > 1 && estimateMessagesTokens(working) > maxTokens) {
        const dropIndex = working.findIndex((message, index) => {
            if (index === working.length - 1) {
                return false;
            }
            if (isDecisionLoopPinnedMessage(message)) {
                return false;
            }
            if (isObservationsBlockMessage(message)) {
                return false;
            }
            return true;
        });
        if (dropIndex < 0) {
            break;
        }
        droppedMessageIndexes.push(dropIndex);
        working.splice(dropIndex, 1);
    }
    while (working.length > 0 && estimateMessagesTokens(working) > maxTokens) {
        const observationIndex = working.findIndex((message) => isObservationsBlockMessage(message));
        if (observationIndex < 0) {
            break;
        }
        const message = working[observationIndex];
        const excess = estimateMessagesTokens(working) - maxTokens;
        const nextContentBudget = Math.max(estimateTextTokens(message.content) - excess, 64);
        const truncated = truncateContentToTokenBudget(message.content, nextContentBudget);
        if (truncated === message.content) {
            break;
        }
        working[observationIndex] = Object.assign(Object.assign({}, message), { content: truncated });
        truncatedMessageIndexes.push(observationIndex);
        if (estimateMessageTokens(working[observationIndex]) >=
            estimateMessageTokens(message)) {
            break;
        }
    }
    while (working.length > 0 && estimateMessagesTokens(working) > maxTokens) {
        let targetIndex = -1;
        let targetSize = 0;
        for (let index = 0; index < working.length - 1; index += 1) {
            if (isDecisionLoopPinnedMessage(working[index])) {
                continue;
            }
            if (isObservationsBlockMessage(working[index])) {
                continue;
            }
            const size = estimateTextTokens(working[index].content);
            const priority = isToolResultMessage(working[index])
                ? 1000000 + size
                : size;
            if (priority > targetSize) {
                targetSize = priority;
                targetIndex = index;
            }
        }
        if (targetIndex < 0) {
            break;
        }
        const message = working[targetIndex];
        const excess = estimateMessagesTokens(working) - maxTokens;
        const nextContentBudget = Math.max(estimateTextTokens(message.content) - excess, 32);
        const truncated = truncateContentToTokenBudget(message.content, nextContentBudget);
        if (truncated === message.content) {
            break;
        }
        working[targetIndex] = Object.assign(Object.assign({}, message), { content: truncated });
        truncatedMessageIndexes.push(targetIndex);
        if (estimateMessageTokens(working[targetIndex]) >=
            estimateMessageTokens(message)) {
            break;
        }
    }
    const estimatedTokensAfter = estimateMessagesTokens(working);
    return {
        messages: working,
        estimatedTokensBefore,
        estimatedTokensAfter,
        trimmed: estimatedTokensAfter < estimatedTokensBefore,
        droppedMessageIndexes,
        truncatedMessageIndexes,
    };
}
exports.trimMessagesToTokenBudgetDetailed = trimMessagesToTokenBudgetDetailed;
function trimMessagesToTokenBudget(messages, maxTokens) {
    return trimMessagesToTokenBudgetDetailed(messages, maxTokens).messages;
}
exports.trimMessagesToTokenBudget = trimMessagesToTokenBudget;
//# sourceMappingURL=message-token-budget.util.js.map