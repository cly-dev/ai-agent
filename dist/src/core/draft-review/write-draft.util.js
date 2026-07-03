"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildWriteDraftPublicListFromChatGate = exports.buildWriteDraftListFromChatGate = exports.toWriteDraftPublicListFromChatToolCalls = exports.resolveWriteDraftFromChatGate = exports.resolveWriteDraftForChatPending = exports.toWriteDraftPublic = exports.applyDraftReviewToWriteDraft = exports.attachWriteDraftToApprovalSnapshot = exports.resolveWriteDraftFromApprovalSnapshot = exports.resolvePrimaryWriteDraftFromChatToolCalls = exports.writeDraftFromChatToolCall = exports.writeDraftFromPendingWrite = exports.applyDraftReviewToChatGateToolCalls = exports.resolveChatGateToolCalls = exports.syncChatGateToolCallsFromWriteDraft = exports.writeDraftToPendingWriteToolCall = exports.writeDraftToPendingWrite = exports.syncWriteDraftPresentation = exports.buildPageWriteDraft = exports.renderWriteDraftPresentation = void 0;
const message_blocks_util_1 = require("../agent-engine/engine/message/message-blocks.util");
const plan_compose_write_util_1 = require("../agent-engine/engine/main/plan-present/plan-compose-write.util");
const message_blocks_util_2 = require("../agent-engine/engine/message/message-blocks.util");
const apply_edited_pending_write_util_1 = require("./apply-edited-pending-write.util");
const draft_review_retry_limit_util_1 = require("./draft-review-retry-limit.util");
const INTERNAL_COMPOSE_MARKER = '_composedFor';
function stripInternalComposeMarkers(args) {
    if (!(INTERNAL_COMPOSE_MARKER in args)) {
        return args;
    }
    const next = Object.assign({}, args);
    delete next[INTERNAL_COMPOSE_MARKER];
    return next;
}
function resolveSummaryText(input) {
    var _a, _b;
    const summary = (_a = input.summaryText) === null || _a === void 0 ? void 0 : _a.trim();
    if (summary) {
        return summary;
    }
    const fill = (_b = input.fillText) === null || _b === void 0 ? void 0 : _b.trim();
    return fill && fill.length > 0 ? fill : null;
}
function renderWriteDraftPresentation(draft) {
    var _a, _b;
    const blocks = [];
    const summary = (_b = (_a = draft.presentation.summaryText) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : resolveSummaryText({ summaryText: draft.presentation.summaryText });
    if (summary) {
        blocks.push((0, message_blocks_util_1.textBlock)(summary, 'markdown'));
    }
    const preview = JSON.stringify(stripInternalComposeMarkers(draft.arguments), null, 2);
    blocks.push((0, message_blocks_util_1.textBlock)(`待执行写操作 \`${draft.tool.name}\`：\n\`\`\`json\n${preview}\n\`\`\``, 'markdown'));
    const sanitized = blocks.length > 0 ? blocks : [(0, message_blocks_util_1.textBlock)('(无预览)', 'markdown')];
    return {
        previewBlocks: sanitized,
        serialized: (0, message_blocks_util_1.serializeMessageBlocksForStorage)(sanitized),
    };
}
exports.renderWriteDraftPresentation = renderWriteDraftPresentation;
function buildPageWriteDraft(input) {
    var _a, _b, _c, _d;
    const summaryText = resolveSummaryText(input);
    const draft = {
        schemaVersion: 1,
        version: (_a = input.version) !== null && _a !== void 0 ? _a : 1,
        tool: {
            name: input.tool.name.trim(),
            toolId: input.tool.toolId,
            riskLevel: input.tool.riskLevel,
        },
        arguments: stripInternalComposeMarkers(input.tool.arguments),
        presentation: {
            summaryText,
            previewBlocks: [],
        },
        provenance: {
            draftRetryCount: Math.max(0, (_b = input.draftRetryCount) !== null && _b !== void 0 ? _b : 0),
            composedAt: (_c = input.composedAt) !== null && _c !== void 0 ? _c : new Date().toISOString(),
            lastEvent: (_d = input.lastEvent) !== null && _d !== void 0 ? _d : 'composed',
        },
    };
    return syncWriteDraftPresentation(draft);
}
exports.buildPageWriteDraft = buildPageWriteDraft;
function syncWriteDraftPresentation(draft) {
    const rendered = renderWriteDraftPresentation(draft);
    return Object.assign(Object.assign({}, draft), { presentation: Object.assign(Object.assign({}, draft.presentation), { previewBlocks: rendered.previewBlocks }) });
}
exports.syncWriteDraftPresentation = syncWriteDraftPresentation;
function writeDraftToPendingWrite(draft) {
    return {
        name: draft.tool.name,
        arguments: Object.assign({}, draft.arguments),
        riskLevel: draft.tool.riskLevel,
    };
}
exports.writeDraftToPendingWrite = writeDraftToPendingWrite;
function writeDraftToPendingWriteToolCall(draft, reason = 'awaiting_user_confirmation') {
    return {
        name: draft.tool.name,
        arguments: stripInternalComposeMarkers(Object.assign({}, draft.arguments)),
        riskLevel: draft.tool.riskLevel,
        reason,
    };
}
exports.writeDraftToPendingWriteToolCall = writeDraftToPendingWriteToolCall;
function syncChatGateToolCallsFromWriteDraft(input) {
    var _a, _b;
    if (!input.writeDraft) {
        return input.toolCalls;
    }
    const primary = writeDraftToPendingWriteToolCall(input.writeDraft, (_b = (_a = input.toolCalls[0]) === null || _a === void 0 ? void 0 : _a.reason) !== null && _b !== void 0 ? _b : 'awaiting_user_confirmation');
    if (input.toolCalls.length <= 1) {
        return [primary];
    }
    return [primary, ...input.toolCalls.slice(1)];
}
exports.syncChatGateToolCallsFromWriteDraft = syncChatGateToolCallsFromWriteDraft;
function resolveChatGateToolCalls(input) {
    return syncChatGateToolCallsFromWriteDraft({
        toolCalls: input.toolCalls,
        writeDraft: input.writeDraft,
    });
}
exports.resolveChatGateToolCalls = resolveChatGateToolCalls;
function applyDraftReviewToChatGateToolCalls(input) {
    const base = resolveChatGateToolCalls(input.pending);
    return (0, apply_edited_pending_write_util_1.applyDraftReviewToToolCalls)({
        toolCalls: base,
        decision: input.decision,
        scopedTools: input.scopedTools,
    });
}
exports.applyDraftReviewToChatGateToolCalls = applyDraftReviewToChatGateToolCalls;
function writeDraftFromPendingWrite(input) {
    var _a, _b, _c;
    const draft = buildPageWriteDraft({
        tool: {
            name: input.pendingWrite.name,
            toolId: input.toolId,
            riskLevel: input.pendingWrite.riskLevel,
            arguments: input.pendingWrite.arguments,
        },
        summaryText: input.summaryText,
        draftRetryCount: input.draftRetryCount,
        version: (_a = input.version) !== null && _a !== void 0 ? _a : 1,
        lastEvent: (_b = input.lastEvent) !== null && _b !== void 0 ? _b : 'suspended',
        composedAt: input.composedAt,
    });
    if ((_c = input.previewBlocks) === null || _c === void 0 ? void 0 : _c.length) {
        return Object.assign(Object.assign({}, draft), { presentation: Object.assign(Object.assign({}, draft.presentation), { previewBlocks: input.previewBlocks }) });
    }
    return draft;
}
exports.writeDraftFromPendingWrite = writeDraftFromPendingWrite;
function writeDraftFromChatToolCall(input) {
    var _a, _b;
    return buildPageWriteDraft({
        tool: {
            name: input.toolCall.name,
            toolId: input.toolId,
            riskLevel: input.toolCall.riskLevel,
            arguments: input.toolCall.arguments,
        },
        summaryText: input.summaryText,
        draftRetryCount: input.draftRetryCount,
        version: (_a = input.version) !== null && _a !== void 0 ? _a : 1,
        lastEvent: (_b = input.lastEvent) !== null && _b !== void 0 ? _b : 'suspended',
    });
}
exports.writeDraftFromChatToolCall = writeDraftFromChatToolCall;
function resolvePrimaryWriteDraftFromChatToolCalls(input) {
    var _a;
    const primary = input.toolCalls[0];
    if (!((_a = primary === null || primary === void 0 ? void 0 : primary.name) === null || _a === void 0 ? void 0 : _a.trim())) {
        return null;
    }
    return writeDraftFromChatToolCall({
        toolCall: primary,
        summaryText: input.summaryText,
        previewBlocks: input.previewBlocks,
        draftRetryCount: input.draftRetryCount,
        version: input.version,
        lastEvent: 'suspended',
    });
}
exports.resolvePrimaryWriteDraftFromChatToolCalls = resolvePrimaryWriteDraftFromChatToolCalls;
function resolveWriteDraftFromApprovalSnapshot(snapshot, fallback) {
    var _a, _b, _c, _d;
    if (((_a = snapshot.writeDraft) === null || _a === void 0 ? void 0 : _a.schemaVersion) === 1) {
        return syncWriteDraftPresentation(snapshot.writeDraft);
    }
    return writeDraftFromPendingWrite({
        pendingWrite: snapshot.pendingWrite,
        summaryText: (_b = fallback === null || fallback === void 0 ? void 0 : fallback.summary) !== null && _b !== void 0 ? _b : null,
        previewBlocks: (_c = fallback === null || fallback === void 0 ? void 0 : fallback.previewBlocks) !== null && _c !== void 0 ? _c : null,
        draftRetryCount: (_d = snapshot.draftRetryCount) !== null && _d !== void 0 ? _d : 0,
        version: 1,
        lastEvent: 'suspended',
    });
}
exports.resolveWriteDraftFromApprovalSnapshot = resolveWriteDraftFromApprovalSnapshot;
function attachWriteDraftToApprovalSnapshot(snapshot, draft) {
    const synced = syncWriteDraftPresentation(draft);
    return Object.assign(Object.assign({}, snapshot), { pendingWrite: writeDraftToPendingWrite(synced), writeDraft: synced, draftRetryCount: synced.provenance.draftRetryCount });
}
exports.attachWriteDraftToApprovalSnapshot = attachWriteDraftToApprovalSnapshot;
function applyDraftReviewToWriteDraft(input) {
    var _a, _b;
    if (input.decision.action !== 'confirm_with_edits') {
        return input.draft;
    }
    const pendingLike = {
        name: input.draft.tool.name,
        arguments: input.draft.arguments,
        riskLevel: String(input.draft.tool.riskLevel),
    };
    const merged = (0, apply_edited_pending_write_util_1.applyDraftReviewToPendingWrite)({
        pending: pendingLike,
        decision: input.decision,
        writeTool: (_a = input.writeTool) !== null && _a !== void 0 ? _a : null,
    });
    const next = Object.assign(Object.assign({}, input.draft), { version: input.draft.version + 1, arguments: merged.arguments, provenance: Object.assign(Object.assign({}, input.draft.provenance), { lastEvent: 'user_edit' }) });
    if ((_b = input.decision.editedPreviewSerialized) === null || _b === void 0 ? void 0 : _b.trim()) {
        const blocks = tryParsePreviewBlocksFromDecision(input.decision.editedPreviewSerialized);
        if (blocks === null || blocks === void 0 ? void 0 : blocks.length) {
            next.presentation = Object.assign(Object.assign({}, next.presentation), { previewBlocks: blocks });
        }
    }
    return syncWriteDraftPresentation(next);
}
exports.applyDraftReviewToWriteDraft = applyDraftReviewToWriteDraft;
function tryParsePreviewBlocksFromDecision(serialized) {
    const trimmed = serialized.trim();
    if (!trimmed.startsWith('{')) {
        return null;
    }
    try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed.blocks) ? parsed.blocks : null;
    }
    catch (_a) {
        return null;
    }
}
function toWriteDraftPublic(draft, input) {
    var _a, _b;
    const budget = (0, draft_review_retry_limit_util_1.resolveDraftRetryBudget)(draft.provenance.draftRetryCount);
    return {
        version: draft.version,
        tool: Object.assign(Object.assign({ name: draft.tool.name }, (draft.tool.toolId != null ? { toolId: draft.tool.toolId } : {})), { riskLevel: String(draft.tool.riskLevel) }),
        arguments: stripInternalComposeMarkers(draft.arguments),
        presentation: {
            summaryText: (_a = draft.presentation.summaryText) !== null && _a !== void 0 ? _a : null,
            previewBlocks: draft.presentation.previewBlocks,
        },
        provenance: {
            draftRetryCount: budget.used,
            draftRetryMax: (_b = input === null || input === void 0 ? void 0 : input.draftRetryMax) !== null && _b !== void 0 ? _b : budget.max,
            canRetry: budget.canRetry,
            composedAt: draft.provenance.composedAt,
            lastEvent: draft.provenance.lastEvent,
        },
    };
}
exports.toWriteDraftPublic = toWriteDraftPublic;
function resolveWriteDraftForChatPending(input) {
    var _a, _b, _c;
    const draftRetryCount = (_a = input.draftRetryCount) !== null && _a !== void 0 ? _a : 0;
    if (((_b = input.writeDraft) === null || _b === void 0 ? void 0 : _b.schemaVersion) === 1) {
        const synced = syncWriteDraftPresentation(input.writeDraft);
        return Object.assign(Object.assign({}, synced), { provenance: Object.assign(Object.assign({}, synced.provenance), { draftRetryCount: Math.max((_c = synced.provenance.draftRetryCount) !== null && _c !== void 0 ? _c : 0, draftRetryCount) }) });
    }
    return resolveWriteDraftFromChatGate({
        toolCalls: resolveChatGateToolCalls({
            toolCalls: input.toolCalls,
            writeDraft: input.writeDraft,
        }),
        observations: input.observations,
        confirmedPreviewSerialized: input.confirmedPreviewSerialized,
        draftRetryCount,
    });
}
exports.resolveWriteDraftForChatPending = resolveWriteDraftForChatPending;
function resolveWriteDraftFromChatGate(input) {
    var _a, _b;
    if (input.toolCalls.length > 0) {
        const previewBlocks = parsePreviewBlocksFromSerialized(input.confirmedPreviewSerialized);
        return resolvePrimaryWriteDraftFromChatToolCalls({
            toolCalls: input.toolCalls,
            previewBlocks: previewBlocks !== null && previewBlocks !== void 0 ? previewBlocks : undefined,
            draftRetryCount: input.draftRetryCount,
            version: input.version,
        });
    }
    const observations = (_a = input.observations) !== null && _a !== void 0 ? _a : [];
    for (let i = observations.length - 1; i >= 0; i -= 1) {
        const row = observations[i];
        if ((row === null || row === void 0 ? void 0 : row.name) !== plan_compose_write_util_1.PLAN_COMPOSE_WRITE_OBSERVATION_NAME) {
            continue;
        }
        const output = row.output;
        const tool = (_b = output === null || output === void 0 ? void 0 : output.tool) === null || _b === void 0 ? void 0 : _b.trim();
        const args = output === null || output === void 0 ? void 0 : output.arguments;
        if (!tool || !args || typeof args !== 'object' || Array.isArray(args)) {
            continue;
        }
        const previewBlocks = parsePreviewBlocksFromSerialized(input.confirmedPreviewSerialized);
        const draft = buildPageWriteDraft({
            tool: {
                name: tool,
                riskLevel: 'L2',
                arguments: args,
            },
            draftRetryCount: input.draftRetryCount,
            version: input.version,
            lastEvent: 'suspended',
        });
        if (previewBlocks === null || previewBlocks === void 0 ? void 0 : previewBlocks.length) {
            return Object.assign(Object.assign({}, draft), { presentation: Object.assign(Object.assign({}, draft.presentation), { previewBlocks }) });
        }
        return draft;
    }
    return null;
}
exports.resolveWriteDraftFromChatGate = resolveWriteDraftFromChatGate;
function parsePreviewBlocksFromSerialized(serialized) {
    if (!(serialized === null || serialized === void 0 ? void 0 : serialized.trim())) {
        return null;
    }
    return (0, message_blocks_util_2.tryParseStoredMessageBlocks)(serialized);
}
function toWriteDraftPublicListFromChatToolCalls(input) {
    return buildWriteDraftPublicListFromChatGate({
        toolCalls: input.toolCalls,
        draftRetryCount: input.draftRetryCount,
        previewBlocks: input.previewBlocks,
        summaryText: input.summaryText,
    });
}
exports.toWriteDraftPublicListFromChatToolCalls = toWriteDraftPublicListFromChatToolCalls;
function buildWriteDraftListFromChatGate(input) {
    var _a, _b;
    const draftRetryCount = (_a = input.draftRetryCount) !== null && _a !== void 0 ? _a : 0;
    if ((_b = input.writeDrafts) === null || _b === void 0 ? void 0 : _b.length) {
        return input.writeDrafts.map((draft) => {
            var _a;
            const synced = syncWriteDraftPresentation(draft);
            return Object.assign(Object.assign({}, synced), { provenance: Object.assign(Object.assign({}, synced.provenance), { draftRetryCount: Math.max((_a = synced.provenance.draftRetryCount) !== null && _a !== void 0 ? _a : 0, draftRetryCount) }) });
        });
    }
    const toolCallsForGate = syncChatGateToolCallsFromWriteDraft({
        toolCalls: input.toolCalls,
        writeDraft: input.writeDraft,
    });
    const primary = resolveWriteDraftForChatPending({
        toolCalls: input.toolCalls,
        writeDraft: input.writeDraft,
        observations: input.observations,
        confirmedPreviewSerialized: input.confirmedPreviewSerialized,
        draftRetryCount,
    });
    if (toolCallsForGate.length === 0) {
        return primary ? [primary] : [];
    }
    return toolCallsForGate.map((toolCall, index) => {
        if (index === 0 && primary) {
            return primary;
        }
        return writeDraftFromChatToolCall({
            toolCall,
            summaryText: index === 0 ? input.summaryText : null,
            previewBlocks: index === 0 ? input.previewBlocks : undefined,
            draftRetryCount: input.draftRetryCount,
            version: input.version,
            lastEvent: 'suspended',
        });
    });
}
exports.buildWriteDraftListFromChatGate = buildWriteDraftListFromChatGate;
function buildWriteDraftPublicListFromChatGate(input) {
    return buildWriteDraftListFromChatGate(input).map((draft) => toWriteDraftPublic(draft));
}
exports.buildWriteDraftPublicListFromChatGate = buildWriteDraftPublicListFromChatGate;
//# sourceMappingURL=write-draft.util.js.map