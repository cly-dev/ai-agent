"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractRoutedMessageFromLlmText = exports.routeLlmStreamChunk = exports.createLlmStreamRouterState = void 0;
const THINK_OPEN = '<think>';
const THINK_CLOSE = '</think>';
function createLlmStreamRouterState() {
    return { pending: '', inThink: false };
}
exports.createLlmStreamRouterState = createLlmStreamRouterState;
function findPartialTagSuffix(text, tag) {
    const max = Math.min(text.length, tag.length - 1);
    for (let len = max; len > 0; len -= 1) {
        if (tag.startsWith(text.slice(-len))) {
            return len;
        }
    }
    return 0;
}
function routeLlmStreamChunk(state, chunk) {
    let work = state.pending + chunk;
    let inThink = state.inThink;
    let think = '';
    let message = '';
    while (work.length > 0) {
        if (inThink) {
            const closeIdx = work.indexOf(THINK_CLOSE);
            if (closeIdx >= 0) {
                think += work.slice(0, closeIdx);
                work = work.slice(closeIdx + THINK_CLOSE.length);
                inThink = false;
                continue;
            }
            const partialClose = findPartialTagSuffix(work, THINK_CLOSE);
            if (partialClose > 0) {
                think += work.slice(0, work.length - partialClose);
                return {
                    state: { pending: work.slice(work.length - partialClose), inThink },
                    think,
                    message,
                };
            }
            think += work;
            return {
                state: { pending: '', inThink },
                think,
                message,
            };
        }
        const openIdx = work.indexOf(THINK_OPEN);
        if (openIdx >= 0) {
            message += work.slice(0, openIdx);
            work = work.slice(openIdx + THINK_OPEN.length);
            inThink = true;
            continue;
        }
        const partialOpen = findPartialTagSuffix(work, THINK_OPEN);
        if (partialOpen > 0) {
            message += work.slice(0, work.length - partialOpen);
            return {
                state: { pending: work.slice(work.length - partialOpen), inThink },
                think,
                message,
            };
        }
        message += work;
        return {
            state: { pending: '', inThink },
            think,
            message,
        };
    }
    return {
        state: { pending: '', inThink },
        think,
        message,
    };
}
exports.routeLlmStreamChunk = routeLlmStreamChunk;
function extractRoutedMessageFromLlmText(source) {
    let state = createLlmStreamRouterState();
    let message = '';
    for (const ch of source) {
        const routed = routeLlmStreamChunk(state, ch);
        state = routed.state;
        message += routed.message;
    }
    if (state.pending && !state.inThink) {
        message += state.pending;
    }
    return message;
}
exports.extractRoutedMessageFromLlmText = extractRoutedMessageFromLlmText;
//# sourceMappingURL=llm-stream-router.util.js.map