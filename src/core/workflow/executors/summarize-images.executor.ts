import { completeWorkflowNode, failWorkflowNode } from '../workflow-run.util';
import { buildWorkflowNodeOutputRef } from '../workflow-node-output.util';
import type { SummarizeImagesNodeInput } from '../workflow-node-input.types';
import { resolveExecutorPageContext } from '../executors/executor-host.util';
import type {
  WorkflowExecutor,
  WorkflowExecutorContext,
} from '../executors/workflow-executor.types';
import { collectImageUrlsFromSources } from '../../image-panel/collect-image-urls.util';
import { isImagePanelVisionEnabled } from '../../image-panel/image-panel-env.util';
import { getImagePanelService } from '../../image-panel/image-panel.service';

function resolvePriorOutputs(host: Parameters<
  WorkflowExecutor['run']
>[0]['host']): Record<string, unknown> {
  if (host.profile === 'page') {
    return host.runtime.nodeOutputs;
  }
  return host.state.workflowNodeOutputs ?? {};
}

function parseInput(raw: unknown): Required<
  Pick<
    SummarizeImagesNodeInput,
    'from' | 'maxCells' | 'cellPx' | 'onFailure' | 'cacheTtlSec'
  >
> &
  Pick<SummarizeImagesNodeInput, 'hint'> {
  const input =
    raw != null && typeof raw === 'object' && !Array.isArray(raw)
      ? (raw as SummarizeImagesNodeInput)
      : {};
  const from =
    input.from === 'page_context' || input.from === 'all' || input.from === 'upstream'
      ? input.from
      : 'upstream';
  const maxCells =
    typeof input.maxCells === 'number' &&
    Number.isInteger(input.maxCells) &&
    input.maxCells >= 1 &&
    input.maxCells <= 6
      ? input.maxCells
      : 6;
  const cellPx =
    typeof input.cellPx === 'number' &&
    Number.isInteger(input.cellPx) &&
    input.cellPx >= 128 &&
    input.cellPx <= 1024
      ? input.cellPx
      : 512;
  const onFailure = input.onFailure === 'fail' ? 'fail' : 'degrade';
  const cacheTtlSec =
    typeof input.cacheTtlSec === 'number' &&
    Number.isInteger(input.cacheTtlSec) &&
    input.cacheTtlSec >= 0 &&
    input.cacheTtlSec <= 604_800
      ? input.cacheTtlSec
      : 86_400;
  const hint =
    typeof input.hint === 'string' && input.hint.trim()
      ? input.hint.trim()
      : undefined;
  return { from, maxCells, cellPx, onFailure, cacheTtlSec, hint };
}

/** Chat：emitThink 进度；Page：节点 start SSE 已由 runner 写出，此处不再重复。 */
function emitRecognizeProgress(ctx: WorkflowExecutorContext, urlCount: number): void {
  if (ctx.host.profile !== 'chat' || urlCount <= 0) {
    return;
  }
  const { bundle } = ctx.host;
  bundle.deps.sse.emitThink(
    bundle.ctx.input.sessionId,
    bundle.ctx.input.runId,
    `正在识别图片（${urlCount} 张）…\n`,
    'delta',
  );
}

function emptyDisabledOutput(reason: string): Record<string, unknown> {
  return {
    panelVersion: 1,
    cells: [],
    omittedCount: 0,
    omittedUrls: [],
    visionError: reason,
    timing: { fetchMs: 0, renderMs: 0, visionMs: 0, totalMs: 0 },
  };
}

/**
 * 显式图片识别节点：仅当画布配置才执行。
 * 环境 catch / sharp 缺失由 ImagePanelService degrade；本处处理服务未绑定与 onFailure=fail。
 */
export const summarizeImagesExecutor: WorkflowExecutor = {
  action: 'summarize_images',
  async run(ctx) {
    const parsed = parseInput(ctx.def.input);
    const outputRef = buildWorkflowNodeOutputRef(ctx.def.action, ctx.nodeId);

    const service = getImagePanelService();
    if (!service) {
      if (parsed.onFailure === 'fail') {
        const failed = failWorkflowNode(ctx.workflowRun, ctx.nodeId, {
          code: 'SUMMARIZE_IMAGES_UNAVAILABLE',
          message: 'ImagePanelService is not bound (module not ready)',
        });
        return {
          kind: 'failed',
          workflowRun: failed,
          error: failed.nodes.find((row) => row.nodeId === ctx.nodeId)!.error!,
        };
      }
      const workflowRun = completeWorkflowNode(
        ctx.workflowRun,
        ctx.nodeId,
        outputRef,
      );
      return {
        kind: 'completed',
        workflowRun,
        outputRef,
        nodeOutput: emptyDisabledOutput('SHARP_OR_SERVICE_UNAVAILABLE'),
      };
    }

    const urls = collectImageUrlsFromSources({
      from: parsed.from,
      upstreamOutputs: resolvePriorOutputs(ctx.host),
      pageContext: resolveExecutorPageContext(ctx.host),
    });

    // 环境未关且确有图才发进度，避免 DISABLED 时误报「正在识别」
    if (isImagePanelVisionEnabled()) {
      emitRecognizeProgress(ctx, Math.min(urls.length, parsed.maxCells));
    }

    if (urls.length > 0 && ctx.host.profile === 'chat') {
      ctx.host.bundle.deps.logger.log(
        `summarize_images nodeId=${ctx.nodeId} urls=${urls.length} maxCells=${parsed.maxCells} vision=${isImagePanelVisionEnabled()}`,
      );
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
      const failed = failWorkflowNode(ctx.workflowRun, ctx.nodeId, {
        code: 'SUMMARIZE_IMAGES_VISION_FAILED',
        message: result.visionError,
      });
      return {
        kind: 'failed',
        workflowRun: failed,
        error: failed.nodes.find((row) => row.nodeId === ctx.nodeId)!.error!,
      };
    }

    const workflowRun = completeWorkflowNode(
      ctx.workflowRun,
      ctx.nodeId,
      outputRef,
    );
    return {
      kind: 'completed',
      workflowRun,
      outputRef,
      nodeOutput: result,
    };
  },
};
