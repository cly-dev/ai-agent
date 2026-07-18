import { completeWorkflowNode, failWorkflowNode } from '../workflow-run.util';
import { buildWorkflowNodeOutputRef } from '../workflow-node-output.util';
import { applyDetectCluesRouting } from '../graph/workflow-run-advance.util';
import { listClueEdgesFrom } from '../graph/workflow-edge.util';
import type { DetectCluesNodeInput } from '../workflow-node-input.types';
import type { WorkflowClueDef } from '../workflow.types';
import { resolveExecutorPageContext } from '../executors/executor-host.util';
import { invokeDetectCluesLlm } from './detect-clues-llm.util';
import type { WorkflowExecutor } from '../executors/workflow-executor.types';
import { formatPriorOutputsForDetectClues } from '../workflow-node-outputs-summarize.util';
import { resolveWorkflowNodeRuntimeInput } from '../resolve-workflow-node-runtime-input.util';

function resolveDetectHint(input: unknown): string | undefined {
  if (input == null || typeof input !== 'object') {
    return undefined;
  }
  const hint = (input as DetectCluesNodeInput).hint;
  return typeof hint === 'string' && hint.trim() ? hint.trim() : undefined;
}

function summarizeForDetect(value: unknown, maxLen = 4000): string {
  try {
    const text = JSON.stringify(value);
    if (text.length <= maxLen) {
      return text;
    }
    return `${text.slice(0, maxLen)}…`;
  } catch {
    return String(value);
  }
}

function resolvePriorOutputs(host: Parameters<
  WorkflowExecutor['run']
>[0]['host']): Record<string, unknown> {
  if (host.profile === 'page') {
    return host.runtime.nodeOutputs;
  }
  return host.state.workflowNodeOutputs ?? {};
}

function resolveUserMessage(host: Parameters<
  WorkflowExecutor['run']
>[0]['host']): string {
  if (host.profile === 'page') {
    const lastUser = [...host.runtime.messages]
      .reverse()
      .find((row) => row.role === 'user');
    return typeof lastUser?.content === 'string' ? lastUser.content : '';
  }
  return host.bundle.ctx.input.latestUserMessage;
}

function resolveLlmService(host: Parameters<
  WorkflowExecutor['run']
>[0]['host']) {
  if (host.profile === 'page') {
    return host.runtime.llmService;
  }
  return host.bundle.deps.llmService;
}

/**
 * 状态识别门控：LLM 判定节点上配置的多个状态是否成立（可多选），
 * 写 DetectCluesOutput + run.routing，按命中边扇出。不调业务 API；失败则节点 failed。
 */
export const detectCluesExecutor: WorkflowExecutor = {
  action: 'detect_clues',
  async run(ctx) {
    const edges = ctx.workflowRun.edges ?? [];
    const clueEdges = listClueEdgesFrom(edges, ctx.nodeId);
    const clues: WorkflowClueDef[] = clueEdges
      .map((edge) => edge.clue)
      .filter((row): row is WorkflowClueDef => row != null);

    const pageContext = resolveExecutorPageContext(ctx.host);
    const priorOutputs = resolvePriorOutputs(ctx.host);
    const llmService = resolveLlmService(ctx.host);

    const output = await invokeDetectCluesLlm({
      llmService,
      objective: ctx.def.objective,
      hint: resolveDetectHint(resolveWorkflowNodeRuntimeInput(ctx.def)),
      clues,
      userMessage: resolveUserMessage(ctx.host),
      pageContextSummary: summarizeForDetect(pageContext ?? null),
      priorOutputsSummary: formatPriorOutputsForDetectClues(priorOutputs),
    });

    if (!output) {
      const failed = failWorkflowNode(ctx.workflowRun, ctx.nodeId, {
        code: 'DETECT_CLUES_LLM_FAILED',
        message: 'detect_clues LLM failed or returned invalid structured output',
      });
      return {
        kind: 'failed',
        workflowRun: failed,
        error: failed.nodes.find((row) => row.nodeId === ctx.nodeId)!.error!,
      };
    }

    // 零命中且无 default：校验期应已拦截；运行时再兜一层
    if (
      output.matchedClueKeys.length === 0 &&
      !edges.some(
        (edge) =>
          edge.from === ctx.nodeId && (edge.kind ?? 'always') === 'default',
      ) &&
      clues.length > 0
    ) {
      const failed = failWorkflowNode(ctx.workflowRun, ctx.nodeId, {
        code: 'DETECT_CLUES_NO_ROUTE',
        message:
          'detect_clues matched nothing and no default edge is configured',
      });
      return {
        kind: 'failed',
        workflowRun: failed,
        error: failed.nodes.find((row) => row.nodeId === ctx.nodeId)!.error!,
      };
    }

    const outputRef = buildWorkflowNodeOutputRef(ctx.def.action, ctx.nodeId);
    let workflowRun = completeWorkflowNode(
      ctx.workflowRun,
      ctx.nodeId,
      outputRef,
    );
    workflowRun = applyDetectCluesRouting({
      run: workflowRun,
      edges,
      fromNodeId: ctx.nodeId,
      output,
    });

    return {
      kind: 'completed',
      workflowRun,
      outputRef,
      nodeOutput: output,
    };
  },
};
