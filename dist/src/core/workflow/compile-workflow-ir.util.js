"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compileWorkflowIr = void 0;
function compileWorkflowIr(intent) {
    const ctx = {
        nodes: [],
        stepEntryNodeId: {},
        stepExitNodeId: {},
    };
    for (const step of intent.steps) {
        compileStep(step, ctx);
    }
    const edges = mapIntentEdges(intent.edges, ctx);
    const entryNodeId = ctx.stepEntryNodeId[intent.entryStepId];
    if (!entryNodeId) {
        throw new Error(`compileWorkflowIr: missing IR entry for intent step ${intent.entryStepId}`);
    }
    return {
        version: 1,
        nodes: ctx.nodes,
        edges,
        entryNodeId,
        stepEntryNodeId: ctx.stepEntryNodeId,
        stepExitNodeId: ctx.stepExitNodeId,
    };
}
exports.compileWorkflowIr = compileWorkflowIr;
function compileStep(step, ctx) {
    switch (step.operation) {
        case 'read':
            compileRead(step, ctx);
            return;
        case 'judge':
            compileJudge(step, ctx);
            return;
        case 'deliver':
            compileDeliver(step, ctx);
            return;
        case 'mutate':
            compileMutate(step, ctx);
            return;
        default: {
            const _exhaustive = step;
            void _exhaustive;
            throw new Error('compileWorkflowIr: unknown operation');
        }
    }
}
function compileRead(step, ctx) {
    var _a, _b, _c, _d, _e;
    const produced = [];
    const toolIds = (_b = (_a = step.slots) === null || _a === void 0 ? void 0 : _a.readToolIds) !== null && _b !== void 0 ? _b : [];
    const images = (_c = step.capabilities) === null || _c === void 0 ? void 0 : _c.images;
    if (toolIds.length > 0) {
        produced.push({
            id: `${step.id}__query`,
            type: 'data_query',
            name: (_d = step.name) !== null && _d !== void 0 ? _d : '获取数据',
            config: {
                toolIds,
                completeWhen: 'first_success',
                objective: step.objective,
            },
        });
    }
    if (images === null || images === void 0 ? void 0 : images.enabled) {
        produced.push({
            id: `${step.id}__vision`,
            type: 'llm',
            name: '图片识别',
            config: {
                capabilities: { vision: true },
                from: (_e = images.from) !== null && _e !== void 0 ? _e : (toolIds.length ? 'upstream' : 'page_context'),
                hint: images.hint,
                objective: 'Recognize images into textual evidence.',
            },
        });
    }
    if (produced.length === 0) {
        throw new Error(`compileWorkflowIr: read step "${step.id}" needs readToolIds and/or evidence.images`);
    }
    appendChain(step.id, produced, ctx);
}
function compileJudge(step, ctx) {
    var _a, _b;
    appendChain(step.id, [
        {
            id: `${step.id}__structured`,
            type: 'structured_output',
            name: (_a = step.name) !== null && _a !== void 0 ? _a : '状态识别',
            config: {
                hint: (_b = step.capabilities) === null || _b === void 0 ? void 0 : _b.policyHint,
                objective: step.objective,
            },
        },
    ], ctx);
}
function compileDeliver(step, ctx) {
    var _a, _b, _c, _d, _e;
    if (step.channel === 'fill') {
        const hostToolIds = (_b = (_a = step.slots) === null || _a === void 0 ? void 0 : _a.fillHostToolIds) !== null && _b !== void 0 ? _b : [];
        appendChain(step.id, [
            {
                id: `${step.id}__host`,
                type: 'host_effect',
                name: (_c = step.name) !== null && _c !== void 0 ? _c : '生成并推送到页面',
                config: {
                    hostToolIds,
                    objective: (_d = step.objective) !== null && _d !== void 0 ? _d : 'Generate user-facing content and push to the page via the bound host tool.',
                },
            },
        ], ctx);
        return;
    }
    appendChain(step.id, [
        {
            id: `${step.id}__speak`,
            type: 'message_send',
            name: (_e = step.name) !== null && _e !== void 0 ? _e : '说明总结',
            config: {
                channel: 'chat',
                mode: 'final',
                stream: true,
                objective: step.objective,
            },
        },
    ], ctx);
}
function compileMutate(step, ctx) {
    var _a;
    const writeToolId = step.slots.writeToolId;
    const produced = [];
    const readIds = (_a = step.slots.readToolIds) !== null && _a !== void 0 ? _a : [];
    if (readIds.length > 0) {
        produced.push({
            id: `${step.id}__query`,
            type: 'data_query',
            name: '获取数据',
            config: {
                toolIds: readIds,
                completeWhen: 'first_success',
            },
        });
    }
    produced.push({
        id: `${step.id}__compose`,
        type: 'data_transform',
        name: '组装变更参数',
        config: {
            purpose: 'compose_mutation',
            toolId: writeToolId,
            objective: 'Compose write parameters only from observations; do not execute write yet.',
        },
    }, {
        id: `${step.id}__human`,
        type: 'human_task',
        name: '等待用户确认',
        config: {
            kind: 'mutation',
            presentMode: 'brief',
            explainBeforeConfirm: step.explainBeforeConfirm === true,
            objective: 'Wait for user confirmation before executing the write.',
        },
    }, {
        id: `${step.id}__write`,
        type: 'tool_call',
        name: '提交变更',
        config: {
            toolId: writeToolId,
            useComposedArgs: true,
            objective: 'Execute the bound write tool using composed parameters.',
        },
    });
    if (step.summarizeAfter === true) {
        produced.push({
            id: `${step.id}__speak`,
            type: 'message_send',
            name: '说明总结',
            config: {
                channel: 'chat',
                mode: 'final',
                objective: 'Summarize the mutation outcome for the user.',
            },
        });
    }
    appendChain(step.id, produced, ctx);
}
function appendChain(stepId, produced, ctx) {
    const first = produced[0];
    const last = produced[produced.length - 1];
    ctx.stepEntryNodeId[stepId] = first.id;
    ctx.stepExitNodeId[stepId] = last.id;
    ctx.nodes.push(...produced);
}
function mapIntentEdges(intentEdges, ctx) {
    var _a, _b, _c;
    const edges = [];
    for (const stepId of Object.keys(ctx.stepEntryNodeId)) {
        const ordered = ctx.nodes.filter((n) => n.id.startsWith(`${stepId}__`));
        for (let i = 0; i < ordered.length - 1; i++) {
            edges.push({
                id: `ir:${ordered[i].id}->${ordered[i + 1].id}`,
                from: ordered[i].id,
                to: ordered[i + 1].id,
                kind: 'always',
            });
        }
    }
    for (const e of intentEdges) {
        const fromIr = ctx.stepExitNodeId[e.from];
        const toIr = ctx.stepEntryNodeId[e.to];
        if (!fromIr || !toIr) {
            throw new Error(`compileWorkflowIr: cannot map edge ${e.id} (${e.from}→${e.to})`);
        }
        const kind = (_a = e.kind) !== null && _a !== void 0 ? _a : 'always';
        if (kind === 'state') {
            edges.push({
                id: e.id,
                from: fromIr,
                to: toIr,
                kind: 'when',
                when: (_b = e.state) === null || _b === void 0 ? void 0 : _b.key,
                whenDescription: (_c = e.state) === null || _c === void 0 ? void 0 : _c.description,
            });
        }
        else if (kind === 'default') {
            edges.push({
                id: e.id,
                from: fromIr,
                to: toIr,
                kind: 'default',
            });
        }
        else {
            edges.push({
                id: e.id,
                from: fromIr,
                to: toIr,
                kind: 'always',
            });
        }
    }
    return edges;
}
//# sourceMappingURL=compile-workflow-ir.util.js.map