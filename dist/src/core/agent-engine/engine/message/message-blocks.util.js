"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureAtLeastOneTextBlock = exports.textBlock = exports.buildRuleBasedMessageBlocks = exports.tryBuildChartBlockFromOutput = exports.tryBuildTableBlockFromOutput = exports.mergeToolOutputsForSummary = exports.extractListRowsFromToolOutput = exports.extractDetailRecordFromToolOutput = exports.mergeMessageBlocks = exports.messageBlocksToPlainText = exports.extractStreamableProseFromBlocks = exports.nextSanitizedSummarizeStreamDelta = exports.sanitizeStoredFinalOutput = exports.serializeMessageBlocksForStorage = exports.sanitizeMessageBlocks = exports.extractProseFromSummarizeLlmRaw = exports.tryParseLlmBlocksFromSummarizeOutput = exports.tryParseStoredMessageBlocks = exports.parseMessageBlocksPayload = exports.normalizeMessageBlocks = exports.inferRenderHint = exports.planStructuredBlockStreaming = exports.filterLlmBlocksAvoidDuplicatingRule = exports.mergeStreamedDeltaTextForStorage = exports.mergeSummarizeBlocksForStorage = exports.stripRedundantSummarizeTextBlocks = exports.normalizeSupplementaryTextContent = exports.stripMarkdownFenceForBlocksParse = exports.processSummarizeMessageStreamChunk = exports.createSummarizeMessageStreamState = exports.summarizeStreamedProseFromState = exports.decodePartialJsonStringAt = exports.findSingleTextBlockContentValueStart = exports.findInlineSummarizeBlocksJsonStart = exports.isPossibleIncompleteBlocksJsonRemainder = exports.isLikelySummarizeBlocksJsonStart = exports.isStreamedProseFenceGarbage = exports.sanitizeSummarizeUserFacingProse = exports.stripBlocksJsonTailFromStreamedProse = exports.findSummarizeBlocksJsonTailStart = exports.looksLikeBlocksJsonOutput = exports.shouldBufferSummarizeLlmStream = exports.loadingHintForStructuredBlock = exports.isStructuredMessageBlock = void 0;
const list_map_reduce_util_1 = require("../gather/list-map-reduce.util");
const agent_run_user_messages_util_1 = require("../agent-run-user-messages.util");
const llm_output_sanitize_util_1 = require("../llm-output-sanitize.util");
const message_blocks_schema_1 = require("./message-blocks.schema");
const STRUCTURED_BLOCK_TYPES = new Set([
    'list',
    'quote',
    'code',
    'chart',
    'table',
    'metric',
    'alert',
    'image',
]);
function isStructuredMessageBlock(block) {
    return STRUCTURED_BLOCK_TYPES.has(block.type);
}
exports.isStructuredMessageBlock = isStructuredMessageBlock;
function loadingHintForStructuredBlock(block) {
    switch (block.type) {
        case 'table':
            return '表格加载中…';
        case 'chart':
            return '图表加载中…';
        case 'metric':
            return '指标加载中…';
        case 'list':
            return '列表加载中…';
        case 'alert':
            return '提示加载中…';
        case 'image':
            return '图片加载中…';
        case 'code':
            return '代码加载中…';
        case 'quote':
            return '引用加载中…';
        default:
            return '内容加载中…';
    }
}
exports.loadingHintForStructuredBlock = loadingHintForStructuredBlock;
function shouldBufferSummarizeLlmStream(ruleBlocks) {
    return ruleBlocks.some(isStructuredMessageBlock);
}
exports.shouldBufferSummarizeLlmStream = shouldBufferSummarizeLlmStream;
function looksLikeBlocksJsonOutput(text) {
    const trimmed = text.trimStart();
    if (!trimmed) {
        return false;
    }
    const body = trimmed.startsWith('```')
        ? trimmed.replace(/^```(?:json)?\s*/i, '')
        : trimmed;
    return (/["']blocks["']\s*:/.test(body) ||
        /["']pendingWriteToolCall["']\s*:/.test(body));
}
exports.looksLikeBlocksJsonOutput = looksLikeBlocksJsonOutput;
const SUMMARIZE_BLOCKS_JSON_TAIL_PATTERNS = [
    /",\s*\n\s*"(?:format|type)"\s*:/,
    /",\s*"(?:format|type)"\s*:/,
    /\n\s*\}\s*\n\s*\]\s*\}\s*$/,
    /\n\s*\]\s*\}\s*$/,
];
const INCOMPLETE_BLOCKS_JSON_TAIL_RE = /(?:^|\n)\s*\{\s*["']?blocks["']?\s*$/i;
function findSummarizeBlocksJsonTailStart(text) {
    const xmlPending = /<pendingWriteToolCall>\s*/i.exec(text);
    if ((xmlPending === null || xmlPending === void 0 ? void 0 : xmlPending.index) != null) {
        return xmlPending.index;
    }
    const pendingWrite = /\n\s*\{\s*["']pendingWriteToolCall["']\s*:/.exec(text);
    if ((pendingWrite === null || pendingWrite === void 0 ? void 0 : pendingWrite.index) != null) {
        return pendingWrite.index;
    }
    const pendingAtStart = /^\s*\{\s*["']pendingWriteToolCall["']\s*:/.exec(text);
    if ((pendingAtStart === null || pendingAtStart === void 0 ? void 0 : pendingAtStart.index) === 0) {
        return 0;
    }
    for (const pattern of SUMMARIZE_BLOCKS_JSON_TAIL_PATTERNS) {
        const match = pattern.exec(text);
        if ((match === null || match === void 0 ? void 0 : match.index) != null) {
            return match.index;
        }
    }
    const blocksMatch = /\{\s*["']blocks["']\s*:/.exec(text);
    if ((blocksMatch === null || blocksMatch === void 0 ? void 0 : blocksMatch.index) != null && blocksMatch.index > 0) {
        return blocksMatch.index;
    }
    const incompleteBlocks = INCOMPLETE_BLOCKS_JSON_TAIL_RE.exec(text);
    if ((incompleteBlocks === null || incompleteBlocks === void 0 ? void 0 : incompleteBlocks.index) != null && incompleteBlocks.index > 0) {
        return incompleteBlocks.index;
    }
    return -1;
}
exports.findSummarizeBlocksJsonTailStart = findSummarizeBlocksJsonTailStart;
function stripBlocksJsonTailFromStreamedProse(text) {
    const idx = findSummarizeBlocksJsonTailStart(text);
    if (idx >= 0) {
        return text.slice(0, idx).trimEnd();
    }
    return text
        .replace(/",\s*"(?:format|type)"[\s\S]*$/i, '')
        .trimEnd();
}
exports.stripBlocksJsonTailFromStreamedProse = stripBlocksJsonTailFromStreamedProse;
function stripJsonObjectMarkdownFences(text) {
    return text.replace(/```(?:json)?\s*\n([\s\S]*?)```/gi, (full, inner) => {
        const trimmed = inner.trim();
        if (!trimmed.startsWith('{')) {
            return full;
        }
        try {
            const parsed = JSON.parse(trimmed);
            if (!isRecord(parsed)) {
                return full;
            }
            if (Array.isArray(parsed.blocks)) {
                return full;
            }
            return '';
        }
        catch (_a) {
            return full;
        }
    });
}
function sanitizeSummarizeUserFacingProse(text) {
    let next = text.replace(/<pendingWriteToolCall>[\s\S]*?<\/pendingWriteToolCall>/gi, '');
    next = stripJsonObjectMarkdownFences(next);
    next = stripBlocksJsonTailFromStreamedProse(next);
    return next.replace(/\n{3,}/g, '\n\n').trimEnd();
}
exports.sanitizeSummarizeUserFacingProse = sanitizeSummarizeUserFacingProse;
function isStreamedProseFenceGarbage(text) {
    const trimmed = stripBlocksJsonTailFromStreamedProse(text).trim();
    if (!trimmed) {
        return true;
    }
    if (/^`+$/.test(trimmed)) {
        return true;
    }
    if (trimmed.startsWith('```') && !/```[\s\S]*```/.test(trimmed)) {
        return true;
    }
    return false;
}
exports.isStreamedProseFenceGarbage = isStreamedProseFenceGarbage;
function isSummarizeStreamFencePrefix(text) {
    const trimmed = text.trimStart();
    if (!trimmed.startsWith('`')) {
        return false;
    }
    if (isLikelySummarizeBlocksJsonStart(trimmed)) {
        return true;
    }
    return /^`{1,2}$/.test(trimmed);
}
function isLikelySummarizeBlocksJsonStart(text) {
    const trimmed = text.trimStart();
    if (!trimmed) {
        return false;
    }
    if (/["'](?:blocks|pendingWriteToolCall)["']\s*:/.test(trimmed)) {
        return true;
    }
    if (/^```(?:json)?\s*\{/i.test(trimmed)) {
        return true;
    }
    if (trimmed.startsWith('{')) {
        return true;
    }
    return false;
}
exports.isLikelySummarizeBlocksJsonStart = isLikelySummarizeBlocksJsonStart;
function isPossibleIncompleteBlocksJsonRemainder(remainder) {
    const trimmed = remainder.trimStart();
    if (!trimmed) {
        return true;
    }
    if (looksLikeBlocksJsonOutput(trimmed)) {
        return true;
    }
    if (/^```(?:json)?\s*$/i.test(trimmed) || /^```(?:json)?\s*\{/i.test(trimmed)) {
        return true;
    }
    if (/^\{\s*$/.test(trimmed) || /^\{\s*["']$/.test(trimmed)) {
        return true;
    }
    if (/^\{\s*["'](?:blocks|pendingWriteToolCall|type|format|content)/i.test(trimmed)) {
        if (/["'](?:blocks|pendingWriteToolCall)["']/i.test(trimmed)) {
            return true;
        }
        if (findSingleTextBlockContentValueStart(trimmed) != null) {
            return true;
        }
        if (/^\{\s*["']blocks["']/i.test(trimmed) ||
            /^\{\s*["']type["']\s*:\s*["']text["']/i.test(trimmed)) {
            return true;
        }
        return false;
    }
    return false;
}
exports.isPossibleIncompleteBlocksJsonRemainder = isPossibleIncompleteBlocksJsonRemainder;
function findInlineSummarizeBlocksJsonStart(messageText, emittedProseLength) {
    const tailStart = findSummarizeBlocksJsonTailStart(messageText);
    if (tailStart >= 0) {
        return tailStart;
    }
    const rest = messageText.slice(emittedProseLength);
    const inline = rest.search(/\{\s*["'](?:blocks|pendingWriteToolCall)["']\s*:/);
    if (inline >= 0) {
        return emittedProseLength + inline;
    }
    const incompleteBlocks = rest.search(INCOMPLETE_BLOCKS_JSON_TAIL_RE);
    if (incompleteBlocks >= 0) {
        return emittedProseLength + incompleteBlocks;
    }
    return -1;
}
exports.findInlineSummarizeBlocksJsonStart = findInlineSummarizeBlocksJsonStart;
const SINGLE_TEXT_BLOCK_CONTENT_PREFIX = /^\s*(?:```(?:json)?\s*)?\{\s*["']blocks["']\s*:\s*\[\s*\{\s*["']type["']\s*:\s*["']text["']\s*,\s*(?:["']format["']\s*:\s*["'][^"']*["']\s*,\s*)?["']content["']\s*:\s*["']/;
function findSingleTextBlockContentValueStart(text) {
    const match = SINGLE_TEXT_BLOCK_CONTENT_PREFIX.exec(text);
    if (!match) {
        return null;
    }
    return match[0].length - 1;
}
exports.findSingleTextBlockContentValueStart = findSingleTextBlockContentValueStart;
function decodePartialJsonStringAt(text, openQuoteIndex) {
    let i = openQuoteIndex + 1;
    let decoded = '';
    while (i < text.length) {
        const ch = text[i];
        if (ch === '\\') {
            if (i + 1 >= text.length) {
                return { decoded, closed: false };
            }
            const esc = text[i + 1];
            switch (esc) {
                case '"':
                    decoded += '"';
                    break;
                case '\\':
                    decoded += '\\';
                    break;
                case '/':
                    decoded += '/';
                    break;
                case 'n':
                    decoded += '\n';
                    break;
                case 'r':
                    decoded += '\r';
                    break;
                case 't':
                    decoded += '\t';
                    break;
                case 'b':
                    decoded += '\b';
                    break;
                case 'f':
                    decoded += '\f';
                    break;
                case 'u': {
                    if (i + 5 >= text.length) {
                        return { decoded, closed: false };
                    }
                    const hex = text.slice(i + 2, i + 6);
                    decoded += String.fromCharCode(Number.parseInt(hex, 16));
                    i += 6;
                    continue;
                }
                default:
                    decoded += esc;
            }
            i += 2;
            continue;
        }
        if (ch === '"') {
            return { decoded, closed: true };
        }
        decoded += ch;
        i += 1;
    }
    return { decoded, closed: false };
}
exports.decodePartialJsonStringAt = decodePartialJsonStringAt;
function summarizeStreamedProseFromState(state) {
    if (state.mode === 'json_text' && state.jsonContentValueStart != null) {
        return decodePartialJsonStringAt(state.messageText, state.jsonContentValueStart).decoded.slice(0, state.emittedProseLength);
    }
    return sanitizeSummarizeUserFacingProse(stripBlocksJsonTailFromStreamedProse(state.messageText.slice(0, state.emittedProseLength)));
}
exports.summarizeStreamedProseFromState = summarizeStreamedProseFromState;
function createSummarizeMessageStreamState() {
    return { mode: 'detect', messageText: '', emittedProseLength: 0 };
}
exports.createSummarizeMessageStreamState = createSummarizeMessageStreamState;
function emitSummarizeJsonTextDelta(state) {
    const { decoded } = decodePartialJsonStringAt(state.messageText, state.jsonContentValueStart);
    const delta = decoded.slice(state.emittedProseLength);
    return {
        state: Object.assign(Object.assign({}, state), { mode: 'json_text', emittedProseLength: state.emittedProseLength + delta.length }),
        delta,
    };
}
function tryEnterJsonTextStreamMode(messageText, emittedProseLength) {
    const quoteStart = findSingleTextBlockContentValueStart(messageText);
    if (quoteStart == null) {
        return null;
    }
    return emitSummarizeJsonTextDelta({
        mode: 'json_text',
        messageText,
        emittedProseLength,
        jsonContentValueStart: quoteStart,
    });
}
function findMarkdownFenceOpenAfter(text, fromIndex) {
    const slice = text.slice(fromIndex);
    const match = /(?:^|\n)```[\w-]*/.exec(slice);
    if ((match === null || match === void 0 ? void 0 : match.index) == null) {
        return -1;
    }
    return fromIndex + match.index + (match[0].startsWith('\n') ? 1 : 0);
}
function findPartialMarkdownFenceSuffixStart(text, fromIndex) {
    const tail = text.slice(fromIndex);
    const match = /(?:^|\n)(`{1,2}|```[\w-]*)$/.exec(tail);
    if ((match === null || match === void 0 ? void 0 : match.index) == null) {
        return -1;
    }
    return fromIndex + match.index + (match[0].startsWith('\n') ? 1 : 0);
}
function tryParseMarkdownFenceAt(text, openIndex) {
    const slice = text.slice(openIndex);
    const match = /^```([\w-]*)\s*\n([\s\S]*?)\n```/.exec(slice);
    if (!match) {
        return null;
    }
    return {
        endIndex: openIndex + match[0].length,
        body: match[2],
    };
}
function shouldHideSummarizeMarkdownFence(body) {
    const trimmed = body.trim();
    if (/pendingWriteToolCall/i.test(trimmed)) {
        return true;
    }
    if (!trimmed.startsWith('{')) {
        return false;
    }
    try {
        const parsed = JSON.parse(trimmed);
        if (!isRecord(parsed)) {
            return false;
        }
        return !Array.isArray(parsed.blocks);
    }
    catch (_a) {
        return false;
    }
}
function processSummarizeMessageStreamChunk(state, chunk) {
    if (!chunk) {
        return { state, delta: '' };
    }
    const messageText = state.messageText + chunk;
    if (state.mode === 'fence' && state.fenceStartIndex != null) {
        const closed = tryParseMarkdownFenceAt(messageText, state.fenceStartIndex);
        if (!closed) {
            return { state: Object.assign(Object.assign({}, state), { messageText }), delta: '' };
        }
        if (shouldHideSummarizeMarkdownFence(closed.body)) {
            return {
                state: {
                    mode: 'prose',
                    messageText,
                    emittedProseLength: closed.endIndex,
                },
                delta: '',
            };
        }
        const fenceMarkdown = messageText.slice(state.fenceStartIndex, closed.endIndex);
        return {
            state: {
                mode: 'prose',
                messageText,
                emittedProseLength: closed.endIndex,
            },
            delta: fenceMarkdown,
        };
    }
    if (state.mode === 'buffer') {
        const jsonText = tryEnterJsonTextStreamMode(messageText, state.emittedProseLength);
        if (jsonText) {
            return jsonText;
        }
        const remainder = messageText.slice(state.emittedProseLength);
        if (!isPossibleIncompleteBlocksJsonRemainder(remainder)) {
            return emitSummarizeProseDelta({
                mode: 'prose',
                messageText,
                emittedProseLength: state.emittedProseLength,
            });
        }
        return {
            state: Object.assign(Object.assign({}, state), { mode: 'buffer', messageText }),
            delta: '',
        };
    }
    if (state.mode === 'json_text' && state.jsonContentValueStart != null) {
        return emitSummarizeJsonTextDelta({
            mode: 'json_text',
            messageText,
            emittedProseLength: state.emittedProseLength,
            jsonContentValueStart: state.jsonContentValueStart,
        });
    }
    if (state.mode === 'detect') {
        const meaningful = messageText.trimStart();
        if (!meaningful) {
            return { state: Object.assign(Object.assign({}, state), { messageText }), delta: '' };
        }
        if (isLikelySummarizeBlocksJsonStart(meaningful)) {
            const jsonText = tryEnterJsonTextStreamMode(messageText, state.emittedProseLength);
            if (jsonText) {
                return jsonText;
            }
            return {
                state: {
                    mode: 'buffer',
                    messageText,
                    emittedProseLength: state.emittedProseLength,
                },
                delta: '',
            };
        }
        if (isSummarizeStreamFencePrefix(messageText)) {
            return {
                state: {
                    mode: 'buffer',
                    messageText,
                    emittedProseLength: state.emittedProseLength,
                },
                delta: '',
            };
        }
        return emitSummarizeProseDelta({
            mode: 'prose',
            messageText,
            emittedProseLength: state.emittedProseLength,
        });
    }
    return emitSummarizeProseDelta(Object.assign(Object.assign({}, state), { messageText }));
}
exports.processSummarizeMessageStreamChunk = processSummarizeMessageStreamChunk;
function emitSummarizeProseDelta(state) {
    const { messageText, emittedProseLength } = state;
    if (isSummarizeStreamFencePrefix(messageText)) {
        return { state: Object.assign(Object.assign({}, state), { mode: 'buffer', messageText }), delta: '' };
    }
    if (isLikelySummarizeBlocksJsonStart(messageText)) {
        const jsonText = tryEnterJsonTextStreamMode(messageText, emittedProseLength);
        if (jsonText) {
            return jsonText;
        }
        return { state: Object.assign(Object.assign({}, state), { mode: 'buffer' }), delta: '' };
    }
    const partialFence = findPartialMarkdownFenceSuffixStart(messageText, emittedProseLength);
    if (partialFence >= 0) {
        const delta = messageText.slice(emittedProseLength, partialFence);
        return {
            state: {
                mode: 'fence',
                messageText,
                emittedProseLength: emittedProseLength + delta.length,
                fenceStartIndex: partialFence,
            },
            delta,
        };
    }
    const fenceOpen = findMarkdownFenceOpenAfter(messageText, emittedProseLength);
    if (fenceOpen >= 0) {
        const delta = messageText.slice(emittedProseLength, fenceOpen);
        return {
            state: {
                mode: 'fence',
                messageText,
                emittedProseLength: emittedProseLength + delta.length,
                fenceStartIndex: fenceOpen,
            },
            delta,
        };
    }
    const inlineJsonStart = findInlineSummarizeBlocksJsonStart(messageText, emittedProseLength);
    const tailInSuffix = findSummarizeBlocksJsonTailStart(messageText.slice(emittedProseLength));
    const cutAt = inlineJsonStart >= 0
        ? inlineJsonStart
        : tailInSuffix >= 0
            ? emittedProseLength + tailInSuffix
            : -1;
    if (cutAt >= 0) {
        const delta = messageText.slice(emittedProseLength, cutAt);
        return {
            state: {
                mode: 'buffer',
                messageText,
                emittedProseLength: emittedProseLength + delta.length,
            },
            delta,
        };
    }
    const delta = messageText.slice(emittedProseLength);
    return {
        state: {
            mode: 'prose',
            messageText,
            emittedProseLength: messageText.length,
        },
        delta,
    };
}
function stripMarkdownFenceForBlocksParse(text) {
    const trimmed = text.trim();
    const match = /^```(?:json)?\s*\n?([\s\S]*?)\n?```\s*$/i.exec(trimmed);
    return match ? match[1].trim() : trimmed;
}
exports.stripMarkdownFenceForBlocksParse = stripMarkdownFenceForBlocksParse;
function looksLikeMarkdownPipeTable(content) {
    const lines = content
        .trim()
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
    const pipeLines = lines.filter((line) => { var _a; return ((_a = line.match(/\|/g)) !== null && _a !== void 0 ? _a : []).length >= 2; });
    return pipeLines.length >= 2;
}
function textEchoesRuleTable(ruleBlocks, content) {
    var _a, _b;
    const table = ruleBlocks.find((block) => block.type === 'table');
    if (!table || !looksLikeMarkdownPipeTable(content)) {
        return false;
    }
    const headerLine = (_b = (_a = content
        .trim()
        .split('\n')
        .find((line) => line.includes('|'))) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : '';
    if (!headerLine) {
        return false;
    }
    const labelHits = table.columns.filter((column) => headerLine.includes(column.label) || headerLine.includes(column.key)).length;
    return labelHits >= Math.min(2, table.columns.length);
}
function isOnlyMarkdownPipeTableEcho(content) {
    if (!looksLikeMarkdownPipeTable(content)) {
        return false;
    }
    const lines = content
        .trim()
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
    const proseLines = lines.filter((line) => {
        var _a;
        return ((_a = line.match(/\|/g)) !== null && _a !== void 0 ? _a : []).length < 2 &&
            line.length >= 20 &&
            !/^[-|:\s]+$/.test(line);
    });
    if (proseLines.length > 0) {
        return false;
    }
    if (/^#{1,3}\s/m.test(content)) {
        return false;
    }
    return true;
}
function normalizeSupplementaryTextContent(content, ruleBlocks) {
    if (!ruleBlocks.some((block) => block.type === 'table')) {
        return content.trim();
    }
    if (!looksLikeMarkdownPipeTable(content)) {
        return content.trim();
    }
    const lines = content.split('\n');
    const kept = lines.filter((line) => {
        var _a;
        const trimmed = line.trim();
        if (!trimmed) {
            return true;
        }
        if (((_a = trimmed.match(/\|/g)) !== null && _a !== void 0 ? _a : []).length < 2) {
            return true;
        }
        return !textEchoesRuleTable(ruleBlocks, trimmed);
    });
    return kept.join('\n').trim();
}
exports.normalizeSupplementaryTextContent = normalizeSupplementaryTextContent;
function isRedundantSummarizeTextBlock(content, ruleBlocks = []) {
    const trimmed = content.trim();
    if (!trimmed) {
        return true;
    }
    if (looksLikeBlocksJsonOutput(trimmed)) {
        return true;
    }
    if (/^data\s*\|/im.test(trimmed) && trimmed.includes('[{"')) {
        return true;
    }
    if (trimmed.startsWith('[{') && trimmed.includes('"id"')) {
        return true;
    }
    if (isOnlyMarkdownPipeTableEcho(trimmed)) {
        return true;
    }
    if (ruleBlocks.length > 0 && textEchoesRuleTable(ruleBlocks, trimmed)) {
        return true;
    }
    return false;
}
function stripRedundantSummarizeTextBlocks(ruleBlocks, blocks) {
    const hasRuleTable = ruleBlocks.some((block) => block.type === 'table');
    if (!hasRuleTable) {
        return blocks;
    }
    return blocks.filter((block) => {
        if (block.type !== 'text') {
            return true;
        }
        return !isRedundantSummarizeTextBlock(block.content, ruleBlocks);
    });
}
exports.stripRedundantSummarizeTextBlocks = stripRedundantSummarizeTextBlocks;
function mergeSummarizeBlocksForStorage(ruleBlocks, llmBlocks, fallbackPlainText) {
    const normalizedLlm = llmBlocks.map((block) => {
        if (block.type !== 'text') {
            return block;
        }
        const normalized = normalizeSupplementaryTextContent(block.content, ruleBlocks);
        return normalized ? Object.assign(Object.assign({}, block), { content: normalized }) : block;
    });
    const filteredLlm = filterLlmBlocksAvoidDuplicatingRule(ruleBlocks, normalizedLlm);
    const fallback = ruleBlocks.some(isStructuredMessageBlock)
        ? ''
        : fallbackPlainText;
    const merged = mergeMessageBlocks(ruleBlocks, ensureAtLeastOneTextBlock(filteredLlm, fallback));
    return stripRedundantSummarizeTextBlocks(ruleBlocks, merged);
}
exports.mergeSummarizeBlocksForStorage = mergeSummarizeBlocksForStorage;
function mergeStreamedDeltaTextForStorage(ruleBlocks, llmBlocks, streamedMessageText) {
    const trimmed = sanitizeSummarizeUserFacingProse(stripBlocksJsonTailFromStreamedProse(streamedMessageText)).trim();
    if (!trimmed || isStreamedProseFenceGarbage(streamedMessageText)) {
        return llmBlocks;
    }
    const normalized = normalizeSupplementaryTextContent(trimmed, ruleBlocks);
    if (!normalized) {
        return llmBlocks;
    }
    const alreadyStored = llmBlocks.some((block) => block.type === 'text' &&
        block.content.trim().length > 0 &&
        (block.content.includes(normalized.slice(0, 64)) ||
            normalized.includes(block.content.trim().slice(0, 64))));
    if (alreadyStored) {
        return llmBlocks;
    }
    const deltaBlocks = filterLlmBlocksAvoidDuplicatingRule(ruleBlocks, [
        textBlock(normalized, 'markdown'),
    ]);
    if (deltaBlocks.length === 0) {
        return llmBlocks;
    }
    return [...llmBlocks, ...deltaBlocks];
}
exports.mergeStreamedDeltaTextForStorage = mergeStreamedDeltaTextForStorage;
function filterLlmBlocksAvoidDuplicatingRule(ruleBlocks, llmBlocks) {
    const ruleStructuredTypes = new Set(ruleBlocks.filter(isStructuredMessageBlock).map((block) => block.type));
    const hasRuleTable = ruleBlocks.some((block) => block.type === 'table');
    return llmBlocks.filter((block) => {
        if (block.type === 'text' && hasRuleTable) {
            return !isRedundantSummarizeTextBlock(block.content, ruleBlocks);
        }
        if (!isStructuredMessageBlock(block)) {
            return true;
        }
        return !ruleStructuredTypes.has(block.type);
    });
}
exports.filterLlmBlocksAvoidDuplicatingRule = filterLlmBlocksAvoidDuplicatingRule;
function planStructuredBlockStreaming(runId, blocks) {
    const placeholders = [];
    const patches = [];
    let index = 0;
    for (const block of normalizeMessageBlocks(blocks)) {
        if (!isStructuredMessageBlock(block)) {
            continue;
        }
        const replaceId = `blk-${runId}-${index}`;
        index += 1;
        placeholders.push({
            type: 'loading',
            id: replaceId,
            hint: loadingHintForStructuredBlock(block),
        });
        patches.push({ replaceId, block });
    }
    return { placeholders, patches };
}
exports.planStructuredBlockStreaming = planStructuredBlockStreaming;
const TABLE_KEYWORDS = /表格|列表|明细|一览|清单|排行|对比表/i;
const CHART_KEYWORDS = /图表|趋势|折线|柱状|饼图|可视化|曲线/i;
const METRIC_KEYWORDS = /指标|kpi|概览|总览|汇总数据/i;
function inferRenderHint(userMessage) {
    const text = userMessage.trim();
    if (CHART_KEYWORDS.test(text)) {
        return 'chart';
    }
    if (TABLE_KEYWORDS.test(text)) {
        return 'table';
    }
    if (METRIC_KEYWORDS.test(text)) {
        return 'metric';
    }
    return 'text';
}
exports.inferRenderHint = inferRenderHint;
function normalizeMessageBlocks(blocks) {
    const out = [];
    for (const raw of blocks) {
        const parsed = message_blocks_schema_1.messageBlockSchema.safeParse(raw);
        if (parsed.success) {
            out.push(parsed.data);
        }
    }
    return out;
}
exports.normalizeMessageBlocks = normalizeMessageBlocks;
function parseMessageBlocksPayload(value) {
    const parsed = message_blocks_schema_1.messageBlocksPayloadSchema.safeParse(value);
    if (parsed.success) {
        return parsed.data.blocks;
    }
    return null;
}
exports.parseMessageBlocksPayload = parseMessageBlocksPayload;
function tryParseStoredMessageBlocks(value) {
    const trimmed = value.trim();
    if (!trimmed.startsWith('{')) {
        return null;
    }
    try {
        return parseMessageBlocksPayload(JSON.parse(trimmed));
    }
    catch (_a) {
        return null;
    }
}
exports.tryParseStoredMessageBlocks = tryParseStoredMessageBlocks;
function tryParseLlmBlocksFromSummarizeOutput(value) {
    const trimmed = value.trim();
    if (!trimmed) {
        return null;
    }
    const candidates = new Set();
    const fenced = stripMarkdownFenceForBlocksParse(trimmed);
    candidates.add(fenced);
    if (fenced !== trimmed) {
        candidates.add(trimmed);
    }
    const embedded = trimmed.match(/\{[\s\S]*"blocks"\s*:\s*\[[\s\S]*\]\s*\}/);
    if (embedded === null || embedded === void 0 ? void 0 : embedded[0]) {
        candidates.add(embedded[0]);
    }
    for (const candidate of candidates) {
        const parsed = tryParseStoredMessageBlocks(candidate);
        if (parsed === null || parsed === void 0 ? void 0 : parsed.length) {
            return parsed;
        }
    }
    return null;
}
exports.tryParseLlmBlocksFromSummarizeOutput = tryParseLlmBlocksFromSummarizeOutput;
function extractProseFromSummarizeLlmRaw(raw) {
    const trimmed = raw.trim();
    if (!trimmed) {
        return null;
    }
    const quoteStart = findSingleTextBlockContentValueStart(trimmed);
    if (quoteStart != null) {
        const { decoded } = decodePartialJsonStringAt(trimmed, quoteStart);
        const prose = sanitizeSummarizeUserFacingProse(decoded).trim();
        if (prose) {
            return prose;
        }
    }
    const markdownBeforeJson = stripBlocksJsonTailFromStreamedProse(trimmed).trim();
    if (markdownBeforeJson &&
        !looksLikeBlocksJsonOutput(markdownBeforeJson) &&
        markdownBeforeJson.length < trimmed.length) {
        const prose = sanitizeSummarizeUserFacingProse(markdownBeforeJson).trim();
        if (prose) {
            return prose;
        }
    }
    const parsed = tryParseLlmBlocksFromSummarizeOutput(trimmed);
    if (parsed === null || parsed === void 0 ? void 0 : parsed.length) {
        const textContents = parsed
            .filter((block) => block.type === 'text')
            .map((block) => sanitizeSummarizeUserFacingProse(block.content).trim())
            .filter((content) => content.length > 0);
        const longest = textContents.sort((left, right) => right.length - left.length)[0];
        if (longest) {
            return longest;
        }
    }
    if (!looksLikeBlocksJsonOutput(trimmed)) {
        const prose = sanitizeSummarizeUserFacingProse(trimmed).trim();
        return prose || null;
    }
    return null;
}
exports.extractProseFromSummarizeLlmRaw = extractProseFromSummarizeLlmRaw;
function sanitizeMessageBlock(block) {
    switch (block.type) {
        case 'text':
            return Object.assign(Object.assign({}, block), { content: sanitizeSummarizeUserFacingProse((0, llm_output_sanitize_util_1.sanitizeTextForStorage)(block.content)) });
        case 'quote':
            return Object.assign(Object.assign({}, block), { content: (0, llm_output_sanitize_util_1.sanitizeTextForStorage)(block.content) });
        case 'code':
            return Object.assign(Object.assign({}, block), { content: (0, llm_output_sanitize_util_1.sanitizeTextForStorage)(block.content) });
        case 'alert':
            return Object.assign(Object.assign({}, block), { message: (0, llm_output_sanitize_util_1.sanitizeTextForStorage)(block.message), title: block.title
                    ? (0, llm_output_sanitize_util_1.sanitizeTextForStorage)(block.title)
                    : block.title });
        case 'list':
            return Object.assign(Object.assign({}, block), { title: block.title
                    ? (0, llm_output_sanitize_util_1.sanitizeTextForStorage)(block.title)
                    : block.title, items: block.items.map((item) => (Object.assign(Object.assign({}, item), { text: (0, llm_output_sanitize_util_1.sanitizeTextForStorage)(item.text) }))) });
        default:
            return block;
    }
}
function sanitizeMessageBlocks(blocks) {
    return normalizeMessageBlocks(blocks).map(sanitizeMessageBlock);
}
exports.sanitizeMessageBlocks = sanitizeMessageBlocks;
function serializeMessageBlocksForStorage(blocks) {
    const sanitized = sanitizeMessageBlocks(blocks);
    return JSON.stringify({ blocks: sanitized });
}
exports.serializeMessageBlocksForStorage = serializeMessageBlocksForStorage;
function sanitizeStoredFinalOutput(value) {
    const trimmed = value.trim();
    if (!trimmed) {
        return '';
    }
    const blocks = tryParseStoredMessageBlocks(trimmed);
    if (blocks === null || blocks === void 0 ? void 0 : blocks.length) {
        return serializeMessageBlocksForStorage(blocks);
    }
    return (0, llm_output_sanitize_util_1.sanitizeTextForStorage)(trimmed);
}
exports.sanitizeStoredFinalOutput = sanitizeStoredFinalOutput;
function nextSanitizedSummarizeStreamDelta(proseSnapshot, previouslyEmitted) {
    const sanitized = sanitizeSummarizeUserFacingProse((0, llm_output_sanitize_util_1.sanitizeTextForStorage)(proseSnapshot));
    if (!sanitized) {
        return { delta: '', emitted: previouslyEmitted };
    }
    if (sanitized.startsWith(previouslyEmitted)) {
        return {
            delta: sanitized.slice(previouslyEmitted.length),
            emitted: sanitized,
        };
    }
    return { delta: '', emitted: previouslyEmitted };
}
exports.nextSanitizedSummarizeStreamDelta = nextSanitizedSummarizeStreamDelta;
function extractStreamableProseFromBlocks(blocks) {
    var _a;
    const parts = [];
    for (const block of blocks) {
        if (block.type === 'text' && block.content.trim()) {
            parts.push(block.content.trim());
        }
        else if (block.type === 'alert' && ((_a = block.message) === null || _a === void 0 ? void 0 : _a.trim())) {
            parts.push(block.message.trim());
        }
    }
    return parts.join('\n\n').trim();
}
exports.extractStreamableProseFromBlocks = extractStreamableProseFromBlocks;
function messageBlocksToPlainText(blocks) {
    var _a, _b, _c;
    const parts = [];
    for (const block of blocks) {
        switch (block.type) {
            case 'text':
                parts.push(block.content);
                break;
            case 'list': {
                const prefix = block.listType === 'ordered'
                    ? (i) => `${i + 1}. `
                    : () => '- ';
                block.items.forEach((item, i) => {
                    const mark = block.listType === 'checklist'
                        ? item.checked
                            ? '[x] '
                            : '[ ] '
                        : prefix(i);
                    parts.push(`${mark}${item.text}`);
                });
                break;
            }
            case 'quote':
                parts.push(`> ${block.content}`);
                break;
            case 'code':
                parts.push('```\n' + block.content + '\n```');
                break;
            case 'table': {
                if (block.title) {
                    parts.push(block.title);
                }
                const header = block.columns.map((c) => c.label).join(' | ');
                parts.push(header);
                for (const row of block.data.slice(0, 20)) {
                    parts.push(block.columns
                        .map((c) => { var _a; return String((_a = row[c.key]) !== null && _a !== void 0 ? _a : ''); })
                        .join(' | '));
                }
                break;
            }
            case 'chart':
                parts.push(block.title
                    ? `${block.title}: ${block.xAxis.join(', ')}`
                    : block.xAxis.join(', '));
                break;
            case 'metric':
                for (const item of block.items) {
                    parts.push(`${item.label}: ${item.value}${item.delta ? ` (${item.delta})` : ''}`);
                }
                break;
            case 'alert':
                parts.push([block.title, block.message].filter(Boolean).join(': '));
                break;
            case 'image':
                parts.push((_b = (_a = block.caption) !== null && _a !== void 0 ? _a : block.alt) !== null && _b !== void 0 ? _b : block.url);
                break;
            case 'loading':
                parts.push((_c = block.hint) !== null && _c !== void 0 ? _c : '加载中…');
                break;
            default:
                break;
        }
    }
    return parts.filter((p) => p.trim().length > 0).join('\n\n').trim();
}
exports.messageBlocksToPlainText = messageBlocksToPlainText;
function mergeMessageBlocks(primary, secondary) {
    const seen = new Set();
    const merged = [...primary, ...secondary].filter((block) => {
        const key = JSON.stringify(block);
        if (seen.has(key)) {
            return false;
        }
        seen.add(key);
        return true;
    });
    return normalizeMessageBlocks(merged);
}
exports.mergeMessageBlocks = mergeMessageBlocks;
const LIST_ROW_KEYS = ['data', 'list', 'items', 'records', 'rows'];
const LIST_META_KEYS = new Set([
    'total',
    'count',
    'page',
    'pageSize',
    'pages',
    'matchedCount',
]);
function isRecord(value) {
    return value != null && typeof value === 'object' && !Array.isArray(value);
}
function looksLikeListContainer(row) {
    return LIST_ROW_KEYS.some((key) => {
        const candidate = row[key];
        return Array.isArray(candidate) && candidate.length > 0;
    });
}
function normalizeListRowCandidate(item) {
    if (!isRecord(item)) {
        return [];
    }
    if (Object.keys(item).length === 0) {
        return [];
    }
    if (looksLikeListContainer(item)) {
        return extractListRows(item);
    }
    return [item];
}
function normalizeListRowObjects(items) {
    const merged = [];
    for (const item of items) {
        merged.push(...normalizeListRowCandidate(item));
    }
    return merged;
}
function extractDetailRecordFromToolOutput(output) {
    if (!isRecord(output) || looksLikeListContainer(output)) {
        return [];
    }
    if (isMapReduceToolOutput(output)) {
        return [];
    }
    if (Object.keys(output).length === 0) {
        return [];
    }
    return [output];
}
exports.extractDetailRecordFromToolOutput = extractDetailRecordFromToolOutput;
function extractListRowsFromToolOutput(output) {
    if (Array.isArray(output)) {
        return normalizeListRowObjects(output);
    }
    if (!isRecord(output)) {
        return [];
    }
    for (const key of LIST_ROW_KEYS) {
        const candidate = output[key];
        if (Array.isArray(candidate) && candidate.length > 0) {
            return normalizeListRowObjects(candidate);
        }
    }
    return [];
}
exports.extractListRowsFromToolOutput = extractListRowsFromToolOutput;
function isMapReduceToolOutput(output) {
    return isRecord(output) && isRecord(output.__mapReduce);
}
function mergeToolOutputsForSummary(outputs) {
    if (outputs.length === 0) {
        return null;
    }
    if (outputs.length === 1) {
        return outputs[0];
    }
    const mapReduceOutputs = outputs.filter(isMapReduceToolOutput);
    if (mapReduceOutputs.length > 0) {
        const mergedMapReduce = (0, list_map_reduce_util_1.mergeMapReduceObservationOutputs)(mapReduceOutputs);
        const nonMapReduce = outputs.filter((row) => !isMapReduceToolOutput(row));
        if (nonMapReduce.length === 0) {
            return mergedMapReduce !== null && mergedMapReduce !== void 0 ? mergedMapReduce : mapReduceOutputs[0];
        }
        const legacy = mergeToolOutputsForSummary(nonMapReduce);
        if (legacy == null) {
            return mergedMapReduce !== null && mergedMapReduce !== void 0 ? mergedMapReduce : mapReduceOutputs[0];
        }
        if (mergedMapReduce) {
            return Object.assign(Object.assign({}, mergedMapReduce), { relatedOutputs: nonMapReduce });
        }
        return legacy;
    }
    const rows = [];
    let total;
    for (const output of outputs) {
        const listRows = extractListRowsFromToolOutput(output);
        if (listRows.length > 0) {
            rows.push(...listRows);
        }
        else {
            rows.push(...extractDetailRecordFromToolOutput(output));
        }
        if (isRecord(output) && typeof output.total === 'number') {
            total = Math.max(total !== null && total !== void 0 ? total : 0, output.total);
        }
    }
    if (rows.length === 0) {
        return outputs;
    }
    return {
        data: rows,
        total: total !== null && total !== void 0 ? total : rows.length,
    };
}
exports.mergeToolOutputsForSummary = mergeToolOutputsForSummary;
function extractListRows(output) {
    return extractListRowsFromToolOutput(output);
}
function isContainerOnlyColumnKeys(keys) {
    const meaningful = keys.filter((key) => key !== 'data' && !LIST_META_KEYS.has(key));
    return meaningful.length === 0;
}
function labelForKey(key, fieldLabels) {
    var _a, _b;
    return (_b = (_a = fieldLabels[key]) !== null && _a !== void 0 ? _a : fieldLabels[`data.${key}`]) !== null && _b !== void 0 ? _b : key;
}
function formatTableCellValue(val) {
    if (val == null) {
        return '';
    }
    if (Array.isArray(val)) {
        if (val.length === 0) {
            return '';
        }
        if (val.every((item) => item != null &&
            typeof item === 'object' &&
            !Array.isArray(item) &&
            'type' in item)) {
            return String(val.length);
        }
        return JSON.stringify(val);
    }
    if (typeof val === 'object') {
        return JSON.stringify(val);
    }
    return String(val);
}
function tryBuildMapReduceMetricBlock(output) {
    const state = (0, list_map_reduce_util_1.readMapReduceFromObservation)(output);
    if (!state) {
        return null;
    }
    const items = [
        {
            label: '已分析条数',
            value: String(state.fetchedCount),
        },
    ];
    if (state.total != null) {
        items.push({ label: '全量总数', value: String(state.total) });
    }
    if (state.truncatedByMaxRows === true) {
        items.push({
            label: '分析上限',
            value: `${state.maxRows} 条（样本分析）`,
        });
    }
    items.push({
        label: '页内摘要',
        value: `${state.pageSummaries.filter((row) => row.summary != null).length}/${state.pageCount}`,
    });
    return { type: 'metric', items };
}
function tryBuildMapReduceExamplesTable(output) {
    const state = (0, list_map_reduce_util_1.readMapReduceFromObservation)(output);
    if (!state) {
        return null;
    }
    const rows = (0, list_map_reduce_util_1.collectNotableExamplesFromPageSummaries)(state.pageSummaries, 12);
    if (rows.length === 0) {
        return null;
    }
    return {
        type: 'table',
        title: '典型样例',
        columns: [
            { key: 'page', label: '页码' },
            { key: 'id', label: 'ID' },
            { key: 'note', label: '说明' },
        ],
        data: rows.map((row) => ({
            page: row.page != null ? String(row.page) : '',
            id: row.id != null ? String(row.id) : '',
            note: typeof row.note === 'string' ? row.note : '',
        })),
    };
}
function tryBuildTableBlockFromOutput(output, fieldLabels, maxRows = 50) {
    const mapReduceTable = tryBuildMapReduceExamplesTable(output);
    if (mapReduceTable) {
        return mapReduceTable;
    }
    const rows = extractListRows(output);
    if (rows.length < 1) {
        return null;
    }
    const keys = new Set();
    for (const row of rows.slice(0, 5)) {
        for (const key of Object.keys(row)) {
            if (!key.startsWith('_') && !LIST_META_KEYS.has(key)) {
                keys.add(key);
            }
        }
    }
    const columnKeys = [...keys].slice(0, 12);
    if (columnKeys.length === 0 || isContainerOnlyColumnKeys(columnKeys)) {
        return null;
    }
    const columns = columnKeys.map((key) => ({
        key,
        label: labelForKey(key, fieldLabels),
    }));
    const data = rows.slice(0, maxRows).map((row) => {
        const out = {};
        for (const key of columnKeys) {
            out[key] = formatTableCellValue(row[key]);
        }
        return out;
    });
    return {
        type: 'table',
        columns,
        data,
    };
}
exports.tryBuildTableBlockFromOutput = tryBuildTableBlockFromOutput;
function pickNumericSeries(rows) {
    var _a, _b, _c;
    if (rows.length < 2) {
        return null;
    }
    const labelKey = (_a = ['name', 'title', 'label', 'date', 'month', 'day', 'product'].find((k) => rows.every((r) => r[k] != null && String(r[k]).trim().length > 0))) !== null && _a !== void 0 ? _a : Object.keys((_b = rows[0]) !== null && _b !== void 0 ? _b : {})[0];
    if (!labelKey) {
        return null;
    }
    const numericKeys = Object.keys((_c = rows[0]) !== null && _c !== void 0 ? _c : {}).filter((key) => {
        if (key === labelKey) {
            return false;
        }
        return rows.every((r) => {
            const n = Number(r[key]);
            return !Number.isNaN(n);
        });
    });
    if (numericKeys.length === 0) {
        return null;
    }
    const key = numericKeys[0];
    const xAxis = rows.map((r) => { var _a; return String((_a = r[labelKey]) !== null && _a !== void 0 ? _a : ''); });
    const values = rows.map((r) => Number(r[key]));
    return {
        xAxis,
        series: [{ name: key, values }],
    };
}
function tryBuildChartBlockFromOutput(output, userMessage) {
    if (!CHART_KEYWORDS.test(userMessage)) {
        return null;
    }
    const rows = extractListRows(output);
    const series = pickNumericSeries(rows);
    if (!series) {
        return null;
    }
    return {
        type: 'chart',
        chartType: 'bar',
        xAxis: series.xAxis,
        series: series.series,
    };
}
exports.tryBuildChartBlockFromOutput = tryBuildChartBlockFromOutput;
function buildRuleBasedMessageBlocks(input) {
    if (input.toolErrorHint) {
        const blocks = [
            {
                type: 'alert',
                severity: 'error',
                title: '操作未成功',
                message: input.toolErrorHint,
            },
        ];
        if (input.downstreamResponseSource != null) {
            const sourceText = (0, agent_run_user_messages_util_1.formatResponseSourceForDisplay)(input.downstreamResponseSource);
            if (sourceText) {
                blocks.push({
                    type: 'text',
                    content: `下游响应源数据：\n\`\`\`json\n${sourceText}\n\`\`\``,
                    format: 'markdown',
                });
            }
        }
        return blocks;
    }
    const hint = inferRenderHint(input.userMessage);
    const blocks = [];
    const mapReduceMetric = tryBuildMapReduceMetricBlock(input.output);
    if (mapReduceMetric) {
        blocks.push(mapReduceMetric);
    }
    if (hint === 'table' || hint === 'text') {
        const table = tryBuildTableBlockFromOutput(input.output, input.fieldLabels);
        if (table) {
            blocks.push(table);
        }
    }
    if (hint === 'chart') {
        const chart = tryBuildChartBlockFromOutput(input.output, input.userMessage);
        if (chart) {
            blocks.push(chart);
        }
    }
    return blocks;
}
exports.buildRuleBasedMessageBlocks = buildRuleBasedMessageBlocks;
function textBlock(content, format = 'markdown') {
    return { type: 'text', content, format };
}
exports.textBlock = textBlock;
function ensureAtLeastOneTextBlock(blocks, fallbackText) {
    const normalized = normalizeMessageBlocks(blocks);
    if (normalized.length > 0) {
        return normalized;
    }
    return [textBlock(fallbackText)];
}
exports.ensureAtLeastOneTextBlock = ensureAtLeastOneTextBlock;
//# sourceMappingURL=message-blocks.util.js.map