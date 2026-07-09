"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.truncateObservationPayloads = exports.dedupeObservationPayloads = exports.isSameObservationPayload = exports.resolvePrimaryObservationForSummarize = exports.formatSplitToolObservationsForSummarize = exports.isSplitToolObservationsOutput = exports.formatSplitObservationsPromptBlock = exports.filterWorkingMemorySupersededByCurrentRun = exports.toolObservationsToPayloads = exports.observationCallSignature = exports.serializeObservationsBlock = exports.formatObservationForLlm = exports.compactArgsForObservation = exports.SPLIT_TOOL_OBSERVATIONS_NAME = void 0;
const agent_run_user_messages_util_1 = require("./agent-run-user-messages.util");
const plan_draft_reply_util_1 = require("./main/plan-present/plan-draft-reply.util");
const plan_compose_write_util_1 = require("./main/plan-present/plan-compose-write.util");
const tool_observation_util_1 = require("./tool/tool-observation.util");
const tool_pagination_params_util_1 = require("../../tool-engine/tool-pagination-params.util");
const list_map_reduce_util_1 = require("./gather/list-map-reduce.util");
const list_map_reduce_types_1 = require("./gather/list-map-reduce.types");
exports.SPLIT_TOOL_OBSERVATIONS_NAME = 'split_tool_observations';
const OBSERVATION_ARG_SKIP = new Set(['vo', 'X-SHOP-ID', 'page', 'size', 'sort']);
const OBSERVATION_REUSE_NOTE_SUCCESS = 'This tool already succeeded with the args shown. Do not call it again with the same arguments; answer from this observation.';
const OBSERVATION_REUSE_NOTE_ERROR = 'This tool already failed with the args shown. Do not repeat the same call; adjust parameters or use observations.';
const OBSERVATION_REUSE_NOTE_SESSION = 'Preloaded from session working memory. Prefer current_run_observations for the same tool+args when answering the latest request.';
function compactArgsForObservation(args) {
    if (!args) {
        return undefined;
    }
    const out = {};
    for (const [key, value] of Object.entries(args)) {
        if (OBSERVATION_ARG_SKIP.has(key)) {
            continue;
        }
        if (value === undefined || value === null || value === '') {
            continue;
        }
        if (typeof value === 'string' && value.length > 120) {
            out[key] = `${value.slice(0, 120)}…`;
            continue;
        }
        out[key] = value;
    }
    return Object.keys(out).length > 0 ? out : undefined;
}
exports.compactArgsForObservation = compactArgsForObservation;
function buildObservationEnvelope(input) {
    const compactArgs = compactArgsForObservation(input.args);
    const isError = (0, agent_run_user_messages_util_1.isAgentToolErrorObservation)(input.output);
    const reuseNote = input.source === 'session'
        ? isError
            ? OBSERVATION_REUSE_NOTE_ERROR
            : OBSERVATION_REUSE_NOTE_SESSION
        : isError
            ? OBSERVATION_REUSE_NOTE_ERROR
            : OBSERVATION_REUSE_NOTE_SUCCESS;
    return Object.assign(Object.assign(Object.assign({ executed: true }, (input.source ? { source: input.source } : {})), (compactArgs ? { args: compactArgs } : {})), { reuseNote });
}
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function normalizePayload(output) {
    if (typeof output !== 'string') {
        return output;
    }
    const trimmed = output.trim();
    if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
        return output;
    }
    try {
        return JSON.parse(trimmed);
    }
    catch (_a) {
        return output;
    }
}
function findListRows(payload) {
    if (!isRecord(payload)) {
        return null;
    }
    for (const key of ['data', 'list', 'items', 'records']) {
        const rows = payload[key];
        if (Array.isArray(rows)) {
            const total = typeof payload.total === 'number'
                ? payload.total
                : typeof payload.count === 'number'
                    ? payload.count
                    : undefined;
            return { rows, total };
        }
    }
    return null;
}
function simplifyScalar(value) {
    if (value == null) {
        return value;
    }
    if (typeof value === 'object' && !Array.isArray(value)) {
        const row = value;
        if (typeof row.cent === 'number' && typeof row.currency === 'string') {
            const precision = typeof row.precision === 'number' ? row.precision : 2;
            return Number((row.cent / 10 ** precision).toFixed(precision));
        }
    }
    return value;
}
function pathTail(path) {
    var _a;
    const segments = path.split('.').filter(Boolean);
    return (_a = segments[segments.length - 1]) !== null && _a !== void 0 ? _a : path;
}
function toObservationFieldKey(path) {
    var _a;
    const tail = pathTail(path);
    const aliases = {
        availableTotal: 'availableStock',
        extStock: 'extStock',
        barCode: 'barcode',
        imageUrl: 'image',
        gmtCreate: 'createdAt',
        gmtModify: 'updatedAt',
    };
    return (_a = aliases[tail]) !== null && _a !== void 0 ? _a : tail;
}
function getByPath(root, path) {
    const segments = path.split('.').filter(Boolean);
    let current = root;
    for (const segment of segments) {
        if (current == null) {
            return undefined;
        }
        if (!isRecord(current)) {
            return undefined;
        }
        current = current[segment];
    }
    return current;
}
function isScalarObservationValue(value) {
    if (value == null) {
        return false;
    }
    const kind = typeof value;
    if (kind === 'string' || kind === 'number' || kind === 'boolean') {
        return true;
    }
    if (kind === 'object' && !Array.isArray(value)) {
        const row = value;
        return typeof row.cent === 'number';
    }
    return false;
}
function shouldSkipFieldLabelPath(path) {
    const normalized = path.toLowerCase();
    return (normalized.includes('skus') ||
        normalized.includes('inventories') ||
        normalized === 'data' ||
        normalized === 'items' ||
        normalized === 'list');
}
function flattenRecordForLlm(row, fieldLabels) {
    const out = {};
    for (const path of Object.keys(fieldLabels)) {
        if (shouldSkipFieldLabelPath(path)) {
            continue;
        }
        const value = getByPath(row, path);
        if (!isScalarObservationValue(value)) {
            continue;
        }
        out[toObservationFieldKey(path)] = simplifyScalar(value);
    }
    if (row.id != null && out.id == null) {
        out.id = String(row.id);
    }
    if (typeof row.title === 'string' && out.title == null) {
        out.title = row.title;
    }
    if (row.status != null && out.status == null) {
        out.status = row.status;
    }
    if (typeof row.brand === 'string' && out.brand == null) {
        out.brand = row.brand;
    }
    if (typeof row.supplier === 'string' && out.supplier == null) {
        out.supplier = row.supplier;
    }
    const skus = row.skus;
    if (Array.isArray(skus) && skus.length > 0) {
        const sku = skus[0];
        if (isRecord(sku)) {
            if (sku.barCode != null && out.barcode == null) {
                out.barcode = sku.barCode;
            }
            const inventories = sku.inventories;
            if (Array.isArray(inventories) && inventories.length > 0) {
                const inv = inventories[0];
                if (isRecord(inv)) {
                    if (inv.availableTotal != null && out.availableStock == null) {
                        out.availableStock = inv.availableTotal;
                    }
                    if (inv.total != null && out.stock == null) {
                        out.stock = inv.total;
                    }
                    if (inv.extStock != null && out.extStock == null) {
                        out.extStock = inv.extStock;
                    }
                }
            }
            const discountPrice = sku.discountPrice;
            if (out.price == null && discountPrice != null) {
                out.price = simplifyScalar(discountPrice);
            }
        }
    }
    return out;
}
function formatObservationForLlm(input) {
    var _a, _b, _c;
    if (input.toolName === plan_compose_write_util_1.PLAN_COMPOSE_WRITE_OBSERVATION_NAME) {
        const output = input.output;
        const pendingTool = typeof (output === null || output === void 0 ? void 0 : output.tool) === 'string' ? output.tool.trim() : '';
        const args = output === null || output === void 0 ? void 0 : output.arguments;
        return Object.assign(Object.assign({ tool: input.toolName, executed: true, success: true, internal: true }, (input.source ? { source: input.source } : {})), { reuseNote: 'Runtime compose payload (NOT a callable tool). For write fallback, copy pendingWriteTool + arguments verbatim to the bound write tool in <tool_schema>.', summary: Object.assign({ pendingWriteTool: pendingTool || undefined }, (args && typeof args === 'object' && !Array.isArray(args)
                ? { arguments: args }
                : {})) });
    }
    if (input.toolName === plan_draft_reply_util_1.PLAN_DRAFT_REPLY_OBSERVATION_NAME) {
        const output = input.output;
        const draftReply = typeof (output === null || output === void 0 ? void 0 : output.draftReply) === 'string' ? output.draftReply.trim() : '';
        const submitText = typeof (output === null || output === void 0 ? void 0 : output.submitText) === 'string'
            ? output.submitText.trim()
            : draftReply;
        return Object.assign(Object.assign({ tool: input.toolName, executed: true, success: true, internal: true }, (input.source ? { source: input.source } : {})), { reuseNote: 'Runtime draft from plan present (NOT a callable tool). Use submitText / pendingWriteToolCall for write body; never emit tool_calls to this name.', summary: Object.assign({ draftReply,
                submitText }, (((_a = output === null || output === void 0 ? void 0 : output.pendingWriteToolCall) === null || _a === void 0 ? void 0 : _a.tool)
                ? { pendingWriteTool: output.pendingWriteToolCall.tool }
                : {})) });
    }
    const fieldLabels = (_b = input.fieldLabels) !== null && _b !== void 0 ? _b : {};
    const envelope = buildObservationEnvelope({
        output: input.output,
        args: input.args,
        source: input.source,
    });
    if ((0, agent_run_user_messages_util_1.isAgentToolErrorObservation)(input.output)) {
        const responseSource = typeof input.output.responseSource === 'string' ||
            (input.output.responseSource != null &&
                typeof input.output.responseSource === 'object')
            ? input.output.responseSource
            : undefined;
        return Object.assign(Object.assign(Object.assign(Object.assign({ tool: input.toolName }, envelope), { success: false, error: (_c = (0, agent_run_user_messages_util_1.extractToolErrorUserHint)(input.output)) !== null && _c !== void 0 ? _c : 'Tool call failed' }), (input.output.httpStatus != null
            ? { httpStatus: input.output.httpStatus }
            : {})), (responseSource !== undefined ? { responseSource } : {}));
    }
    if ((0, tool_observation_util_1.isEmptyListToolObservation)(input.output)) {
        return Object.assign(Object.assign({ tool: input.toolName }, envelope), { success: true, summary: { matchedCount: 0 }, records: [] });
    }
    const payload = normalizePayload(input.output);
    if (isRecord(payload) && isRecord(payload[list_map_reduce_types_1.MAP_REDUCE_OUTPUT_KEY])) {
        const mapReduce = payload[list_map_reduce_types_1.MAP_REDUCE_OUTPUT_KEY];
        const fetchNote = (0, list_map_reduce_util_1.formatMapReduceFetchStatusNote)(input.output);
        const pageSummaries = Array.isArray(mapReduce.pageSummaries)
            ? mapReduce.pageSummaries.filter((row) => isRecord(row))
            : [];
        const summary = {
            matchedCount: typeof mapReduce.fetchedCount === 'number'
                ? mapReduce.fetchedCount
                : 0,
            mapReduce: true,
            complete: mapReduce.complete === true,
            mapComplete: mapReduce.mapComplete === true,
            pageSummaryCount: pageSummaries.length,
        };
        if (typeof mapReduce.total === 'number') {
            summary.total = mapReduce.total;
        }
        if (typeof mapReduce.maxRows === 'number') {
            summary.maxRows = mapReduce.maxRows;
        }
        if (mapReduce.truncated === true) {
            summary.truncated = true;
        }
        if (mapReduce.truncatedByMaxRows === true) {
            summary.truncatedByMaxRows = true;
        }
        if (mapReduce.mapPartial === true) {
            summary.mapPartial = true;
        }
        if (mapReduce.mapResumeStalled === true) {
            summary.mapResumeStalled = true;
        }
        if (mapReduce.resumeStalled === true) {
            summary.resumeStalled = true;
        }
        if (mapReduce.httpBudgetExhausted === true) {
            summary.httpBudgetExhausted = true;
        }
        if (fetchNote) {
            summary.fetchStatusNote = fetchNote;
        }
        const pageFindings = (0, list_map_reduce_util_1.collectPageFindingsBrief)(pageSummaries.map((row) => ({
            page: typeof row.page === 'number' ? row.page : 0,
            rowCount: typeof row.rowCount === 'number' ? row.rowCount : 0,
            summary: isRecord(row.summary) ? row.summary : undefined,
            error: typeof row.error === 'string' ? row.error : undefined,
        })));
        if (pageFindings.length > 0) {
            summary.pageFindings = pageFindings;
        }
        const records = (0, list_map_reduce_util_1.collectNotableExamplesFromPageSummaries)(pageSummaries.map((row) => ({
            page: typeof row.page === 'number' ? row.page : 0,
            rowCount: typeof row.rowCount === 'number' ? row.rowCount : 0,
            summary: isRecord(row.summary) ? row.summary : undefined,
            error: typeof row.error === 'string' ? row.error : undefined,
        })))
            .map((row) => flattenRecordForLlm(row, fieldLabels))
            .filter((row) => Object.keys(row).length > 0);
        return Object.assign(Object.assign({ tool: input.toolName }, envelope), { success: true, summary,
            records });
    }
    const list = findListRows(payload);
    if (list) {
        const records = list.rows
            .filter((row) => isRecord(row))
            .map((row) => flattenRecordForLlm(row, fieldLabels))
            .filter((row) => Object.keys(row).length > 0);
        const summary = {
            matchedCount: records.length,
        };
        if (list.total != null) {
            summary.total = list.total;
        }
        return Object.assign(Object.assign({ tool: input.toolName }, envelope), { success: true, summary,
            records });
    }
    if (isRecord(payload)) {
        const record = flattenRecordForLlm(payload, fieldLabels);
        if (Object.keys(record).length > 0) {
            return Object.assign(Object.assign({ tool: input.toolName }, envelope), { success: true, summary: { matchedCount: 1 }, records: [record] });
        }
    }
    return Object.assign(Object.assign({ tool: input.toolName }, envelope), { success: true, summary: { matchedCount: 0 }, records: [] });
}
exports.formatObservationForLlm = formatObservationForLlm;
function serializeObservationsBlock(payloads) {
    return JSON.stringify(dedupeObservationPayloads(payloads), null, 0);
}
exports.serializeObservationsBlock = serializeObservationsBlock;
function observationCallSignature(payload) {
    var _a;
    return JSON.stringify({
        tool: payload.tool,
        args: (_a = payload.args) !== null && _a !== void 0 ? _a : null,
    });
}
exports.observationCallSignature = observationCallSignature;
function observationPayloadSignature(payload) {
    var _a, _b, _c;
    return JSON.stringify({
        tool: payload.tool,
        success: payload.success,
        args: (_a = payload.args) !== null && _a !== void 0 ? _a : null,
        summary: (_b = payload.summary) !== null && _b !== void 0 ? _b : null,
        recordIds: ((_c = payload.records) !== null && _c !== void 0 ? _c : []).map((row) => { var _a; return String((_a = row.id) !== null && _a !== void 0 ? _a : ''); }),
    });
}
function toolObservationsToPayloads(observations, source) {
    return observations.map((observation) => {
        const existing = observation.llmPayload;
        const payload = existing !== null && existing !== void 0 ? existing : formatObservationForLlm({
            toolName: observation.name,
            output: observation.output,
            fieldLabels: observation.fieldLabels,
            source,
        });
        if (!source || payload.source === source) {
            return payload;
        }
        const reuseNote = source === 'session'
            ? payload.success === false
                ? OBSERVATION_REUSE_NOTE_ERROR
                : OBSERVATION_REUSE_NOTE_SESSION
            : payload.reuseNote;
        return Object.assign(Object.assign({}, payload), { source, reuseNote });
    });
}
exports.toolObservationsToPayloads = toolObservationsToPayloads;
function filterWorkingMemorySupersededByCurrentRun(workingMemory, currentRun) {
    const currentSignatures = new Set(currentRun.map((row) => observationCallSignature(row)));
    return workingMemory.filter((row) => !currentSignatures.has(observationCallSignature(row)));
}
exports.filterWorkingMemorySupersededByCurrentRun = filterWorkingMemorySupersededByCurrentRun;
function formatSplitObservationsPromptBlock(input) {
    const working = dedupeObservationPayloads(filterWorkingMemorySupersededByCurrentRun(input.workingMemory, input.currentRun));
    const current = dedupeObservationPayloads(input.currentRun);
    const parts = [
        'Answer the latest request from current_run_observations first; working_memory_observations is session context only.',
    ];
    parts.push(`<working_memory_observations>\n${working.length > 0 ? serializeObservationsBlock(working) : '[]'}\n</working_memory_observations>`);
    parts.push(`<current_run_observations>\n${current.length > 0 ? serializeObservationsBlock(current) : '[]'}\n</current_run_observations>`);
    return parts.join('\n');
}
exports.formatSplitObservationsPromptBlock = formatSplitObservationsPromptBlock;
function isSplitToolObservationsOutput(output) {
    if (output == null || typeof output !== 'object' || Array.isArray(output)) {
        return false;
    }
    const row = output;
    return Array.isArray(row.workingMemory) && Array.isArray(row.currentRun);
}
exports.isSplitToolObservationsOutput = isSplitToolObservationsOutput;
function readScopedObservations(output, source) {
    var _a, _b;
    const scoped = ((_a = output.memoryScope) === null || _a === void 0 ? void 0 : _a.primarySource) === 'current_run'
        ? output.currentRun
        : ((_b = output.memoryScope) === null || _b === void 0 ? void 0 : _b.primarySource) === 'working_memory'
            ? output.workingMemory
            : null;
    if (scoped != null) {
        return scoped;
    }
    return source === 'current_run' ? output.currentRun : output.workingMemory;
}
function formatSplitToolObservationsForSummarize(output) {
    return formatSplitObservationsPromptBlock({
        workingMemory: toolObservationsToPayloads(output.workingMemory, 'session'),
        currentRun: toolObservationsToPayloads(output.currentRun, 'current_run'),
    });
}
exports.formatSplitToolObservationsForSummarize = formatSplitToolObservationsForSummarize;
function resolvePrimaryObservationForSummarize(output) {
    var _a, _b, _c, _d, _e;
    if (!isSplitToolObservationsOutput(output)) {
        return null;
    }
    const primarySource = (_a = output.memoryScope) === null || _a === void 0 ? void 0 : _a.primarySource;
    if (primarySource === 'none') {
        return null;
    }
    if (primarySource === 'working_memory') {
        const scoped = readScopedObservations(output, 'working_memory');
        return (_b = scoped[scoped.length - 1]) !== null && _b !== void 0 ? _b : null;
    }
    if (primarySource === 'current_run') {
        const scoped = readScopedObservations(output, 'current_run');
        return (_c = scoped[scoped.length - 1]) !== null && _c !== void 0 ? _c : null;
    }
    if (output.currentRun.length > 0) {
        return (_d = output.currentRun[output.currentRun.length - 1]) !== null && _d !== void 0 ? _d : null;
    }
    if (output.workingMemory.length > 0) {
        return (_e = output.workingMemory[output.workingMemory.length - 1]) !== null && _e !== void 0 ? _e : null;
    }
    return null;
}
exports.resolvePrimaryObservationForSummarize = resolvePrimaryObservationForSummarize;
function isSameObservationPayload(left, right) {
    return observationPayloadSignature(left) === observationPayloadSignature(right);
}
exports.isSameObservationPayload = isSameObservationPayload;
function dedupeObservationPayloads(payloads) {
    const seen = new Set();
    const result = [];
    for (const payload of payloads) {
        const signature = observationPayloadSignature(payload);
        if (seen.has(signature)) {
            continue;
        }
        seen.add(signature);
        result.push(payload);
    }
    return result;
}
exports.dedupeObservationPayloads = dedupeObservationPayloads;
function truncateObservationPayloads(payloads, maxRecordsPerTool = (0, tool_pagination_params_util_1.resolveDefaultListArrayLimit)()) {
    return payloads.map((payload) => {
        var _a;
        if (!payload.records || payload.records.length <= maxRecordsPerTool) {
            return payload;
        }
        const records = payload.records.slice(0, maxRecordsPerTool);
        return Object.assign(Object.assign({}, payload), { records, summary: Object.assign(Object.assign({}, ((_a = payload.summary) !== null && _a !== void 0 ? _a : {})), { matchedCount: records.length, truncated: true, totalRecords: payload.records.length }) });
    });
}
exports.truncateObservationPayloads = truncateObservationPayloads;
//# sourceMappingURL=observation-format.util.js.map