"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.summarizeImagesExecutor = void 0;
const workflow_run_util_1 = require("../workflow-run.util");
const workflow_node_output_util_1 = require("../workflow-node-output.util");
const resolve_workflow_node_runtime_input_util_1 = require("../resolve-workflow-node-runtime-input.util");
const executor_host_util_1 = require("../executors/executor-host.util");
const entity_materialization_1 = require("../../entity-materialization");
const image_panel_env_util_1 = require("../../image-panel/image-panel-env.util");
const image_panel_service_1 = require("../../image-panel/image-panel.service");
function resolvePriorOutputs(host) {
    var _a;
    if (host.profile === 'page') {
        return host.runtime.nodeOutputs;
    }
    return (_a = host.state.workflowNodeOutputs) !== null && _a !== void 0 ? _a : {};
}
function resolveMaterializedEntities(host) {
    var _a;
    if (host.profile === 'page') {
        return host.runtime.materializedEntities;
    }
    return (_a = host.state.materializedEntities) !== null && _a !== void 0 ? _a : [];
}
function parseInput(raw) {
    const input = raw != null && typeof raw === 'object' && !Array.isArray(raw)
        ? raw
        : {};
    const from = input.from === 'page_context' || input.from === 'all' || input.from === 'upstream'
        ? input.from
        : 'upstream';
    const maxCells = typeof input.maxCells === 'number' &&
        Number.isInteger(input.maxCells) &&
        input.maxCells >= 1 &&
        input.maxCells <= 6
        ? input.maxCells
        : 6;
    const cellPx = typeof input.cellPx === 'number' &&
        Number.isInteger(input.cellPx) &&
        input.cellPx >= 128 &&
        input.cellPx <= 1024
        ? input.cellPx
        : 512;
    const onFailure = input.onFailure === 'fail' ? 'fail' : 'degrade';
    const cacheTtlSec = typeof input.cacheTtlSec === 'number' &&
        Number.isInteger(input.cacheTtlSec) &&
        input.cacheTtlSec >= 0 &&
        input.cacheTtlSec <= 604800
        ? input.cacheTtlSec
        : 86400;
    const hint = typeof input.hint === 'string' && input.hint.trim()
        ? input.hint.trim()
        : undefined;
    return { from, maxCells, cellPx, onFailure, cacheTtlSec, hint };
}
function emitRecognizeProgress(ctx, urlCount) {
    if (ctx.host.profile !== 'chat' || urlCount <= 0) {
        return;
    }
    const { bundle } = ctx.host;
    bundle.deps.sse.emitThink(bundle.ctx.input.sessionId, bundle.ctx.input.runId, `正在识别图片（${urlCount} 张）…\n`, 'delta');
}
function emptyDisabledOutput(reason) {
    return {
        panelVersion: 1,
        cells: [],
        omittedCount: 0,
        omittedUrls: [],
        visionError: reason,
        timing: { fetchMs: 0, renderMs: 0, visionMs: 0, totalMs: 0 },
    };
}
exports.summarizeImagesExecutor = {
    action: 'summarize_images',
    async run(ctx) {
        const parsed = parseInput((0, resolve_workflow_node_runtime_input_util_1.resolveWorkflowNodeRuntimeInput)(ctx.def));
        const outputRef = (0, workflow_node_output_util_1.buildWorkflowNodeOutputRef)(ctx.def.action, ctx.nodeId);
        const service = (0, image_panel_service_1.getImagePanelService)();
        if (!service) {
            if (parsed.onFailure === 'fail') {
                const failed = (0, workflow_run_util_1.failWorkflowNode)(ctx.workflowRun, ctx.nodeId, {
                    code: 'SUMMARIZE_IMAGES_UNAVAILABLE',
                    message: 'ImagePanelService is not bound (module not ready)',
                });
                return {
                    kind: 'failed',
                    workflowRun: failed,
                    error: failed.nodes.find((row) => row.nodeId === ctx.nodeId).error,
                };
            }
            const workflowRun = (0, workflow_run_util_1.completeWorkflowNode)(ctx.workflowRun, ctx.nodeId, outputRef);
            return {
                kind: 'completed',
                workflowRun,
                outputRef,
                nodeOutput: emptyDisabledOutput('SHARP_OR_SERVICE_UNAVAILABLE'),
            };
        }
        const urls = (0, entity_materialization_1.resolveImageUrlsForVision)({
            from: parsed.from,
            entities: resolveMaterializedEntities(ctx.host),
            upstreamOutputs: resolvePriorOutputs(ctx.host),
            pageContext: (0, executor_host_util_1.resolveExecutorPageContext)(ctx.host),
        });
        if ((0, image_panel_env_util_1.isImagePanelVisionEnabled)()) {
            emitRecognizeProgress(ctx, Math.min(urls.length, parsed.maxCells));
        }
        if (urls.length > 0 && ctx.host.profile === 'chat') {
            ctx.host.bundle.deps.logger.log(`summarize_images nodeId=${ctx.nodeId} urls=${urls.length} maxCells=${parsed.maxCells} vision=${(0, image_panel_env_util_1.isImagePanelVisionEnabled)()}`);
        }
        const result = await service.recognizeFromUrls({
            urls,
            maxCells: parsed.maxCells,
            cellPx: parsed.cellPx,
            hint: parsed.hint,
            objective: ctx.def.objective,
            cacheTtlSec: parsed.cacheTtlSec,
        });
        if (result.visionError && parsed.onFailure === 'fail' && urls.length > 0) {
            const failed = (0, workflow_run_util_1.failWorkflowNode)(ctx.workflowRun, ctx.nodeId, {
                code: 'SUMMARIZE_IMAGES_VISION_FAILED',
                message: result.visionError,
            });
            return {
                kind: 'failed',
                workflowRun: failed,
                error: failed.nodes.find((row) => row.nodeId === ctx.nodeId).error,
            };
        }
        const workflowRun = (0, workflow_run_util_1.completeWorkflowNode)(ctx.workflowRun, ctx.nodeId, outputRef);
        return {
            kind: 'completed',
            workflowRun,
            outputRef,
            nodeOutput: result,
        };
    },
};
//# sourceMappingURL=summarize-images.executor.js.map