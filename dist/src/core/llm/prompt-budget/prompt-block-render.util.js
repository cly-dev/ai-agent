"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nextDegradeLevel = exports.pickNextDegradeCandidate = exports.estimateBlocksTokens = exports.renderPromptBlocks = void 0;
const prompt_budget_constants_1 = require("./prompt-budget.constants");
const observation_degrade_util_1 = require("./observation-degrade.util");
function wrapTag(tag, body) {
    return `<${tag}>\n${body}\n</${tag}>`;
}
function renderObservationBlock(block) {
    if (block.payload.type !== 'observations') {
        return '';
    }
    const serialized = (0, observation_degrade_util_1.serializeObservationsJson)(block.payload.observations);
    const tag = block.kind === 'current_run_observations'
        ? 'current_run_observations'
        : 'working_memory_observations';
    const parts = [];
    if (block.payload.preamble && block.kind === 'working_memory_observations') {
        parts.push(block.payload.preamble);
    }
    if (block.degradeLevel > 0) {
        parts.push(wrapTag(prompt_budget_constants_1.PROMPT_BUDGET_NOTE_TAG, `level=${block.degradeLevel}; observations structurally degraded; full data in session ledger when applicable.`));
    }
    parts.push(wrapTag(tag, serialized));
    return parts.join('\n');
}
function renderBlockContent(block) {
    if (block.degradeLevel === 4) {
        return '';
    }
    switch (block.payload.type) {
        case 'text': {
            if (block.degradeLevel > 0 && block.kind === 'current_run_observations') {
                return `${wrapTag(prompt_budget_constants_1.PROMPT_BUDGET_NOTE_TAG, `level=${block.degradeLevel}; tool result text degraded`)}\n${block.payload.text}`;
            }
            return block.payload.text;
        }
        case 'observations':
            return renderObservationBlock(block);
        case 'tool_schema': {
            const tag = block.kind === 'host_tool_schema' ? 'host_tool_schema' : 'tool_schema';
            const prefix = block.degradeLevel > 0
                ? `${wrapTag(prompt_budget_constants_1.PROMPT_BUDGET_NOTE_TAG, `level=${block.degradeLevel}; schema degraded`)}\n`
                : '';
            return `${prefix}${wrapTag(tag, block.payload.json)}`;
        }
        case 'session_goa':
            if (!block.payload.text) {
                return '';
            }
            return block.degradeLevel > 0
                ? `${wrapTag(prompt_budget_constants_1.PROMPT_BUDGET_NOTE_TAG, `level=${block.degradeLevel}; goa section=${block.payload.section}`)}\n${block.payload.text}`
                : block.payload.text;
        default:
            return '';
    }
}
function renderPromptBlocks(blocks) {
    var _a;
    const byMessageIndex = new Map();
    for (const block of blocks) {
        const group = (_a = byMessageIndex.get(block.sourceMessageIndex)) !== null && _a !== void 0 ? _a : [];
        group.push(block);
        byMessageIndex.set(block.sourceMessageIndex, group);
    }
    const messages = [];
    for (const messageIndex of [...byMessageIndex.keys()].sort((a, b) => a - b)) {
        const group = byMessageIndex.get(messageIndex);
        const parts = group
            .map((block) => renderBlockContent(block))
            .filter((part) => part.trim().length > 0);
        if (parts.length === 0) {
            continue;
        }
        const anchor = group[0];
        messages.push(Object.assign({ role: anchor.role, content: parts.join('\n\n') }, (anchor.toolCallId ? { toolCallId: anchor.toolCallId } : {})));
    }
    return messages;
}
exports.renderPromptBlocks = renderPromptBlocks;
function estimateBlocksTokens(blocks) {
    var _a;
    const byMessageIndex = new Map();
    for (const block of blocks) {
        const group = (_a = byMessageIndex.get(block.sourceMessageIndex)) !== null && _a !== void 0 ? _a : [];
        group.push(block);
        byMessageIndex.set(block.sourceMessageIndex, group);
    }
    let total = 0;
    for (const group of byMessageIndex.values()) {
        const merged = group
            .map((block) => renderBlockContent(block))
            .filter((part) => part.trim().length > 0)
            .join('\n\n');
        if (!merged) {
            continue;
        }
        let tokens = 0;
        for (const char of merged) {
            tokens += char.codePointAt(0) <= 0x7f ? 0.25 : 0.5;
        }
        total += Math.ceil(tokens) + 4;
    }
    return total;
}
exports.estimateBlocksTokens = estimateBlocksTokens;
function pickNextDegradeCandidate(blocks) {
    var _a;
    const candidates = blocks
        .filter((block) => block.degradeLevel < block.maxDegradeLevel)
        .sort((left, right) => {
        if (right.priority !== left.priority) {
            return right.priority - left.priority;
        }
        if (left.degradeLevel !== right.degradeLevel) {
            return left.degradeLevel - right.degradeLevel;
        }
        return left.id.localeCompare(right.id);
    });
    return (_a = candidates[0]) !== null && _a !== void 0 ? _a : null;
}
exports.pickNextDegradeCandidate = pickNextDegradeCandidate;
function nextDegradeLevel(current) {
    return Math.min(4, current + 1);
}
exports.nextDegradeLevel = nextDegradeLevel;
//# sourceMappingURL=prompt-block-render.util.js.map