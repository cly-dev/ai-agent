"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runPageWorkflowMutationReact = void 0;
const common_1 = require("@nestjs/common");
const workflow_run_util_1 = require("../workflow/workflow-run.util");
const workflow_node_output_util_1 = require("../workflow/workflow-node-output.util");
const page_workflow_pending_write_util_1 = require("./page-workflow-pending-write.util");
async function resolveWriteTool(prisma, appClientId, toolId) {
    const tool = await prisma.tool.findFirst({
        where: { id: toolId, appClientId, isActive: true },
    });
    if (!tool) {
        throw new common_1.NotFoundException({
            code: 'WRITE_TOOL_NOT_FOUND',
            message: `Write tool id=${toolId} not found`,
        });
    }
    return tool;
}
async function runPageWorkflowMutationReact(input) {
    var _a, _b, _c, _d, _e, _f;
    const { def, nodeId, runtime } = input;
    if (def.action === 'compose_mutation') {
        const nodeInput = def.input;
        const toolId = (0, page_workflow_pending_write_util_1.readComposeMutationToolId)(nodeInput);
        if (toolId == null) {
            const failed = (0, workflow_run_util_1.failWorkflowNode)(input.workflowRun, nodeId, {
                code: 'COMPOSE_TOOL_ID_MISSING',
                message: 'compose_mutation requires toolId',
            });
            return {
                ok: false,
                workflowRun: failed,
                errorCode: 'COMPOSE_TOOL_ID_MISSING',
                errorMessage: 'compose_mutation requires toolId',
            };
        }
        if (!input.allowedToolIds.includes(toolId)) {
            const failed = (0, workflow_run_util_1.failWorkflowNode)(input.workflowRun, nodeId, {
                code: 'COMPOSE_TOOL_NOT_ALLOWED',
                message: `toolId ${toolId} not in user allowed tools`,
            });
            return {
                ok: false,
                workflowRun: failed,
                errorCode: 'COMPOSE_TOOL_NOT_ALLOWED',
                errorMessage: `toolId ${toolId} not in user allowed tools`,
            };
        }
        try {
            const tool = await resolveWriteTool(runtime.prisma, runtime.appClientId, toolId);
            const composedArgs = (_b = (_a = input.pendingWrite) === null || _a === void 0 ? void 0 : _a.arguments) !== null && _b !== void 0 ? _b : (await buildComposeArgumentsFromFetchOutputs({
                runtime,
                toolName: tool.name,
            }));
            const composeOutput = {
                tool: tool.name,
                toolId: tool.id,
                arguments: composedArgs,
                riskLevel: tool.riskLevel,
            };
            runtime.nodeOutputs[nodeId] = (0, page_workflow_pending_write_util_1.buildPageComposeNodeOutput)(composeOutput);
            runtime.stepRecorder.record({
                type: 'workflow',
                name: `${nodeId}:compose`,
                detail: {
                    toolId: tool.id,
                    toolName: tool.name,
                },
            });
            const outputRef = (0, workflow_node_output_util_1.buildWorkflowNodeOutputRef)(def.action, nodeId);
            return {
                ok: true,
                workflowRun: (0, workflow_run_util_1.completeWorkflowNode)(input.workflowRun, nodeId, outputRef),
                outputRef,
                nodeOutput: runtime.nodeOutputs[nodeId],
            };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            const failed = (0, workflow_run_util_1.failWorkflowNode)(input.workflowRun, nodeId, {
                code: 'COMPOSE_FAILED',
                message,
            });
            return {
                ok: false,
                workflowRun: failed,
                errorCode: 'COMPOSE_FAILED',
                errorMessage: message,
            };
        }
    }
    if (def.action === 'write_data') {
        const nodeInput = def.input;
        const toolId = (0, page_workflow_pending_write_util_1.readWriteDataToolId)(nodeInput);
        const pending = (_c = input.pendingWrite) !== null && _c !== void 0 ? _c : resolvePendingWriteFromRuntime(runtime, input.allowedToolIds);
        if (!pending) {
            const failed = (0, workflow_run_util_1.failWorkflowNode)(input.workflowRun, nodeId, {
                code: 'WRITE_PENDING_MISSING',
                message: 'No composed write arguments for write_data',
            });
            return {
                ok: false,
                workflowRun: failed,
                errorCode: 'WRITE_PENDING_MISSING',
                errorMessage: 'No composed write arguments for write_data',
            };
        }
        if (toolId != null && pending.name) {
            const tool = await runtime.prisma.tool.findFirst({
                where: { id: toolId, appClientId: runtime.appClientId, isActive: true },
            });
            if (tool && tool.name !== pending.name) {
                const failed = (0, workflow_run_util_1.failWorkflowNode)(input.workflowRun, nodeId, {
                    code: 'WRITE_TOOL_MISMATCH',
                    message: `write_data toolId=${toolId} does not match composed tool ${pending.name}`,
                });
                return {
                    ok: false,
                    workflowRun: failed,
                    errorCode: 'WRITE_TOOL_MISMATCH',
                    errorMessage: (_f = (_e = (_d = failed.nodes.find((row) => row.nodeId === nodeId)) === null || _d === void 0 ? void 0 : _d.error) === null || _e === void 0 ? void 0 : _e.message) !== null && _f !== void 0 ? _f : 'write tool mismatch',
                };
            }
        }
        try {
            const result = await runtime.toolEngine.executeByName(pending.name, pending.arguments, input.allowedToolIds, runtime.userId);
            runtime.stepRecorder.record({
                type: 'workflow',
                name: `${nodeId}:write`,
                detail: {
                    toolName: pending.name,
                },
                status: 'ok',
            });
            const outputRef = (0, workflow_node_output_util_1.buildWorkflowNodeOutputRef)(def.action, nodeId);
            const nodeOutput = { tool: pending.name, output: result.output };
            runtime.nodeOutputs[nodeId] = nodeOutput;
            return {
                ok: true,
                workflowRun: (0, workflow_run_util_1.completeWorkflowNode)(input.workflowRun, nodeId, outputRef),
                outputRef,
                nodeOutput,
            };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            const failed = (0, workflow_run_util_1.failWorkflowNode)(input.workflowRun, nodeId, {
                code: 'WRITE_EXEC_ERROR',
                message,
            });
            return {
                ok: false,
                workflowRun: failed,
                errorCode: 'WRITE_EXEC_ERROR',
                errorMessage: message,
            };
        }
    }
    const failed = (0, workflow_run_util_1.failWorkflowNode)(input.workflowRun, nodeId, {
        code: 'REACT_UNSUPPORTED_ACTION',
        message: `Page react does not support action ${def.action}`,
    });
    return {
        ok: false,
        workflowRun: failed,
        errorCode: 'REACT_UNSUPPORTED_ACTION',
        errorMessage: `Page react does not support action ${def.action}`,
    };
}
exports.runPageWorkflowMutationReact = runPageWorkflowMutationReact;
async function buildComposeArgumentsFromFetchOutputs(input) {
    const fetchOutputs = Object.values(input.runtime.nodeOutputs).filter((row) => row && typeof row === 'object' && !Array.isArray(row));
    const lastFetch = fetchOutputs[fetchOutputs.length - 1];
    const fetchBody = (lastFetch === null || lastFetch === void 0 ? void 0 : lastFetch.output) && typeof lastFetch.output === 'object'
        ? lastFetch.output
        : {};
    return Object.assign(Object.assign({}, fetchBody), { _composedFor: input.toolName });
}
function resolvePendingWriteFromRuntime(runtime, allowedToolIds) {
    var _a;
    for (const output of Object.values(runtime.nodeOutputs)) {
        if (!output || typeof output !== 'object' || Array.isArray(output)) {
            continue;
        }
        const row = output;
        const nested = row.page_compose_mutation;
        if ((nested === null || nested === void 0 ? void 0 : nested.tool) && nested.arguments) {
            if (nested.toolId && !allowedToolIds.includes(nested.toolId)) {
                return null;
            }
            return {
                name: nested.tool,
                arguments: nested.arguments,
                riskLevel: (_a = nested.riskLevel) !== null && _a !== void 0 ? _a : 'L2',
            };
        }
    }
    return null;
}
//# sourceMappingURL=page-workflow-mutation-react.util.js.map