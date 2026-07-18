"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseWorkflowIntentJson = exports.validateWorkflowIntent = void 0;
const workflow_intent_types_1 = require("./workflow-intent.types");
function isPositiveInt(value) {
    return typeof value === 'number' && Number.isInteger(value) && value > 0;
}
function isRecord(value) {
    return value != null && typeof value === 'object' && !Array.isArray(value);
}
function validateWorkflowIntent(intent) {
    var _a, _b, _c;
    const issues = [];
    if (intent.version !== workflow_intent_types_1.WORKFLOW_INTENT_VERSION) {
        issues.push({
            path: 'intent.version',
            code: 'unsupported_intent_version',
            message: `intent.version must be ${workflow_intent_types_1.WORKFLOW_INTENT_VERSION}`,
        });
    }
    if (!((_a = intent.steps) === null || _a === void 0 ? void 0 : _a.length)) {
        issues.push({
            path: 'intent.steps',
            code: 'empty_steps',
            message: 'intent.steps must be non-empty',
        });
        return issues;
    }
    const ids = new Set();
    for (let i = 0; i < intent.steps.length; i++) {
        const step = intent.steps[i];
        const base = `intent.steps[${i}]`;
        if (!((_b = step.id) === null || _b === void 0 ? void 0 : _b.trim())) {
            issues.push({
                path: `${base}.id`,
                code: 'missing_id',
                message: 'step.id is required',
            });
            continue;
        }
        if (ids.has(step.id)) {
            issues.push({
                path: `${base}.id`,
                code: 'duplicate_id',
                message: `duplicate step id: ${step.id}`,
            });
        }
        ids.add(step.id);
        issues.push(...validateStep(step, base));
    }
    if (!ids.has(intent.entryStepId)) {
        issues.push({
            path: 'intent.entryStepId',
            code: 'invalid_entry',
            message: `entryStepId "${intent.entryStepId}" not in steps`,
        });
    }
    if (!((_c = intent.edges) === null || _c === void 0 ? void 0 : _c.length)) {
        if (intent.steps.length > 1) {
            issues.push({
                path: 'intent.edges',
                code: 'missing_edges',
                message: 'intent.edges must be non-empty when there are multiple steps (linear flows need always edges)',
            });
        }
    }
    else {
        for (let i = 0; i < intent.edges.length; i++) {
            issues.push(...validateEdge(intent.edges[i], ids, `intent.edges[${i}]`));
        }
        issues.push(...validateJudgeFanout(intent));
    }
    return issues;
}
exports.validateWorkflowIntent = validateWorkflowIntent;
function validateStep(step, path) {
    var _a, _b, _c, _d, _e, _f, _g;
    const issues = [];
    if (step.operation === 'mutate') {
        if (!isPositiveInt((_a = step.slots) === null || _a === void 0 ? void 0 : _a.writeToolId)) {
            issues.push({
                path: `${path}.slots.writeToolId`,
                code: 'missing_write_tool',
                message: 'mutate requires slots.writeToolId',
            });
        }
    }
    if (step.operation === 'deliver') {
        if (step.channel !== 'speak' && step.channel !== 'fill') {
            issues.push({
                path: `${path}.channel`,
                code: 'invalid_channel',
                message: 'deliver.channel must be speak | fill',
            });
        }
        if (step.channel === 'fill') {
            const ids = (_c = (_b = step.slots) === null || _b === void 0 ? void 0 : _b.fillHostToolIds) !== null && _c !== void 0 ? _c : [];
            if (!ids.length || !ids.every(isPositiveInt)) {
                issues.push({
                    path: `${path}.slots.fillHostToolIds`,
                    code: 'missing_host_tools',
                    message: 'deliver.channel=fill requires fillHostToolIds',
                });
            }
        }
    }
    if (step.operation === 'read') {
        const toolIds = (_e = (_d = step.slots) === null || _d === void 0 ? void 0 : _d.readToolIds) !== null && _e !== void 0 ? _e : [];
        const imagesOn = ((_g = (_f = step.capabilities) === null || _f === void 0 ? void 0 : _f.images) === null || _g === void 0 ? void 0 : _g.enabled) === true;
        if (toolIds.length > 0 && !toolIds.every(isPositiveInt)) {
            issues.push({
                path: `${path}.slots.readToolIds`,
                code: 'invalid_read_tools',
                message: 'readToolIds must be positive integers',
            });
        }
        if (!toolIds.length && !imagesOn) {
        }
    }
    return issues;
}
function validateEdge(edge, stepIds, path) {
    var _a, _b, _c, _d, _e, _f;
    const issues = [];
    if (!((_a = edge.id) === null || _a === void 0 ? void 0 : _a.trim())) {
        issues.push({
            path: `${path}.id`,
            code: 'missing_id',
            message: 'edge.id is required',
        });
    }
    if (!stepIds.has(edge.from)) {
        issues.push({
            path: `${path}.from`,
            code: 'unknown_from',
            message: `edge.from "${edge.from}" not in steps`,
        });
    }
    if (!stepIds.has(edge.to)) {
        issues.push({
            path: `${path}.to`,
            code: 'unknown_to',
            message: `edge.to "${edge.to}" not in steps`,
        });
    }
    const kind = (_b = edge.kind) !== null && _b !== void 0 ? _b : 'always';
    if (kind === 'state') {
        if (!((_d = (_c = edge.state) === null || _c === void 0 ? void 0 : _c.key) === null || _d === void 0 ? void 0 : _d.trim()) || !((_f = (_e = edge.state) === null || _e === void 0 ? void 0 : _e.description) === null || _f === void 0 ? void 0 : _f.trim())) {
            issues.push({
                path: `${path}.state`,
                code: 'missing_state',
                message: 'state edges require state.key and state.description',
            });
        }
    }
    return issues;
}
function validateJudgeFanout(intent) {
    var _a;
    const issues = [];
    const judgeIds = new Set(intent.steps.filter((s) => s.operation === 'judge').map((s) => s.id));
    for (const edge of intent.edges) {
        const kind = (_a = edge.kind) !== null && _a !== void 0 ? _a : 'always';
        if (kind !== 'state' && kind !== 'default') {
            continue;
        }
        if (!judgeIds.has(edge.from)) {
            issues.push({
                path: `intent.edges(id=${edge.id})`,
                code: 'branch_edge_not_from_judge',
                message: `${kind} edges must originate from a judge step`,
            });
        }
    }
    for (const judgeId of judgeIds) {
        const outs = intent.edges.filter((e) => e.from === judgeId);
        const states = outs.filter((e) => { var _a; return ((_a = e.kind) !== null && _a !== void 0 ? _a : 'always') === 'state'; });
        const defaults = outs.filter((e) => e.kind === 'default');
        if (states.length > 0 && defaults.length !== 1) {
            issues.push({
                path: `intent.edges(from=${judgeId})`,
                code: 'judge_missing_default',
                message: `judge "${judgeId}" with state edges must have exactly one default edge`,
            });
        }
        if (states.length === 0 && defaults.length > 0) {
            issues.push({
                path: `intent.edges(from=${judgeId})`,
                code: 'judge_default_without_state',
                message: `judge "${judgeId}" has default edge but no state edges`,
            });
        }
    }
    return issues;
}
function parseWorkflowIntentJson(value) {
    if (!isRecord(value))
        return null;
    if (value.version !== workflow_intent_types_1.WORKFLOW_INTENT_VERSION)
        return null;
    if (typeof value.profile !== 'string')
        return null;
    if (typeof value.entryStepId !== 'string')
        return null;
    if (!Array.isArray(value.steps) || !Array.isArray(value.edges))
        return null;
    return value;
}
exports.parseWorkflowIntentJson = parseWorkflowIntentJson;
//# sourceMappingURL=validate-workflow-intent.util.js.map