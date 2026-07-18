"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inferWorkflowIntentFromLegacyNodes = void 0;
const workflow_intent_types_1 = require("./workflow-intent.types");
const validate_workflow_intent_util_1 = require("./validate-workflow-intent.util");
function inferWorkflowIntentFromLegacyNodes(input) {
    var _a, _b, _c, _d;
    const warnings = [];
    const nodes = (_a = input.nodes) !== null && _a !== void 0 ? _a : [];
    if (nodes.length === 0) {
        throw Object.assign(new Error('Legacy workflow has empty nodes'), {
            code: 'LEGACY_WORKFLOW_EMPTY_NODES',
        });
    }
    const actions = new Set(nodes.map((n) => n.action));
    if (actions.has('load_page_context')) {
        warnings.push('load_page_context ignored: pageContext is Runtime Context, not an Intent step');
    }
    const isMutation = actions.has('write_data') ||
        actions.has('compose_mutation') ||
        actions.has('await_user_confirm') ||
        actions.has('present_mutation');
    let steps;
    let matchedPattern;
    if (isMutation) {
        const writeNode = nodes.find((n) => n.action === 'write_data');
        const writeToolId = positiveInt((_b = writeNode === null || writeNode === void 0 ? void 0 : writeNode.input) === null || _b === void 0 ? void 0 : _b.toolId);
        if (writeToolId == null) {
            throw Object.assign(new Error('Cannot migrate mutation workflow without write_data.input.toolId'), { code: 'LEGACY_MUTATION_WRITE_TOOL_MISSING' });
        }
        const readToolIds = collectReadToolIds(nodes);
        const present = nodes.find((n) => n.action === 'present_mutation');
        const summarize = nodes.find((n) => n.action === 'summarize');
        steps = [
            {
                id: 'mutate',
                operation: 'mutate',
                name: (_c = writeNode === null || writeNode === void 0 ? void 0 : writeNode.name) !== null && _c !== void 0 ? _c : '变更提交',
                objective: writeNode === null || writeNode === void 0 ? void 0 : writeNode.objective,
                slots: Object.assign({ writeToolId }, (readToolIds.length > 0 ? { readToolIds } : {})),
                explainBeforeConfirm: present != null,
                summarizeAfter: summarize != null,
            },
        ];
        matchedPattern = 'mutation';
        if (actions.has('detect_clues')) {
            warnings.push('detect_clues collapsed into mutate-era Intent; branching edges are not preserved');
        }
    }
    else {
        steps = [];
        let stepIdx = 0;
        for (const node of nodes) {
            if (node.action === 'load_page_context') {
                continue;
            }
            if (node.action === 'fetch_data') {
                const readToolIds = collectReadToolIdsFromNode(node);
                if (readToolIds.length === 0) {
                    warnings.push(`fetch_data node "${node.id}" has no toolId(s); skipped`);
                    continue;
                }
                steps.push({
                    id: `read_${++stepIdx}`,
                    operation: 'read',
                    name: node.name,
                    objective: node.objective,
                    slots: { readToolIds },
                });
                continue;
            }
            if (node.action === 'summarize_images') {
                const imagesInput = node.input;
                steps.push({
                    id: `read_images_${++stepIdx}`,
                    operation: 'read',
                    name: node.name,
                    objective: node.objective,
                    capabilities: {
                        images: Object.assign(Object.assign({ enabled: true }, (typeof imagesInput.hint === 'string'
                            ? { hint: imagesInput.hint }
                            : {})), (imagesInput.from === 'upstream' ||
                            imagesInput.from === 'page_context' ||
                            imagesInput.from === 'all'
                            ? { from: imagesInput.from }
                            : {})),
                    },
                });
                continue;
            }
            if (node.action === 'detect_clues') {
                const hint = (_d = node.input) === null || _d === void 0 ? void 0 : _d.hint;
                steps.push(Object.assign({ id: `judge_${++stepIdx}`, operation: 'judge', name: node.name, objective: node.objective }, (typeof hint === 'string'
                    ? { capabilities: { policyHint: hint } }
                    : {})));
                warnings.push('detect_clues migrated as judge; clue branching edges are not preserved');
                continue;
            }
            if (node.action === 'generate_and_push') {
                const hostToolIds = collectHostToolIdsFromNode(node);
                if (hostToolIds.length === 0) {
                    warnings.push(`generate_and_push node "${node.id}" has no hostToolId(s); skipped`);
                    continue;
                }
                steps.push({
                    id: `fill_${++stepIdx}`,
                    operation: 'deliver',
                    channel: 'fill',
                    name: node.name,
                    objective: node.objective,
                    slots: { fillHostToolIds: hostToolIds },
                });
                continue;
            }
            if (node.action === 'summarize') {
                steps.push({
                    id: `speak_${++stepIdx}`,
                    operation: 'deliver',
                    channel: 'speak',
                    name: node.name,
                    objective: node.objective,
                });
                continue;
            }
            warnings.push(`Unsupported legacy action "${node.action}" on node "${node.id}" skipped`);
        }
        if (steps.length === 0) {
            throw Object.assign(new Error('Could not infer any Intent steps from legacy nodes'), { code: 'LEGACY_INTENT_INFER_EMPTY' });
        }
        const ops = steps.map((s) => s.operation);
        const hasRead = ops.includes('read');
        const hasFill = steps.some((s) => s.operation === 'deliver' && s.channel === 'fill');
        const hasSpeak = steps.some((s) => s.operation === 'deliver' && s.channel === 'speak');
        const hasJudge = ops.includes('judge');
        if (hasJudge || ops.filter((o) => o === 'read').length > 1) {
            matchedPattern = 'custom';
        }
        else if (hasRead && hasFill && hasSpeak) {
            matchedPattern = 'fetch_fill_speak';
        }
        else if (hasFill && hasSpeak && !hasRead) {
            matchedPattern = 'fill_speak';
        }
        else if (hasRead && hasSpeak && !hasFill) {
            matchedPattern = 'fetch_speak';
        }
        else if (hasSpeak && !hasRead && !hasFill) {
            matchedPattern = 'speak_only';
        }
        else {
            matchedPattern = 'custom';
        }
    }
    const intent = {
        version: workflow_intent_types_1.WORKFLOW_INTENT_VERSION,
        profile: input.profile,
        entryStepId: steps[0].id,
        steps,
        edges: linearAlwaysEdges(steps.map((s) => s.id)),
    };
    const issues = (0, validate_workflow_intent_util_1.validateWorkflowIntent)(intent);
    if (issues.length > 0) {
        throw Object.assign(new Error(`Inferred Intent invalid: ${issues.map((i) => i.message).join('; ')}`), { code: 'LEGACY_INTENT_INFER_INVALID', issues });
    }
    return { intent, warnings, matchedPattern };
}
exports.inferWorkflowIntentFromLegacyNodes = inferWorkflowIntentFromLegacyNodes;
function linearAlwaysEdges(stepIds) {
    const edges = [];
    for (let i = 0; i < stepIds.length - 1; i++) {
        edges.push({
            id: `e_${stepIds[i]}_${stepIds[i + 1]}`,
            from: stepIds[i],
            to: stepIds[i + 1],
            kind: 'always',
        });
    }
    return edges;
}
function positiveInt(value) {
    return typeof value === 'number' && Number.isInteger(value) && value > 0
        ? value
        : null;
}
function collectReadToolIds(nodes) {
    const ids = [];
    for (const node of nodes) {
        if (node.action !== 'fetch_data') {
            continue;
        }
        ids.push(...collectReadToolIdsFromNode(node));
    }
    return [...new Set(ids)];
}
function collectReadToolIdsFromNode(node) {
    const input = node.input;
    const ids = [];
    const single = positiveInt(input.toolId);
    if (single != null) {
        ids.push(single);
    }
    if (Array.isArray(input.toolIds)) {
        for (const id of input.toolIds) {
            const n = positiveInt(id);
            if (n != null) {
                ids.push(n);
            }
        }
    }
    return [...new Set(ids)];
}
function collectHostToolIdsFromNode(node) {
    const input = node.input;
    const ids = [];
    const single = positiveInt(input.hostToolId);
    if (single != null) {
        ids.push(single);
    }
    if (Array.isArray(input.hostToolIds)) {
        for (const id of input.hostToolIds) {
            const n = positiveInt(id);
            if (n != null) {
                ids.push(n);
            }
        }
    }
    return [...new Set(ids)];
}
//# sourceMappingURL=infer-intent-from-legacy-nodes.util.js.map