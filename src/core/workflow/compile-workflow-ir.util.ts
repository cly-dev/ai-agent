import type {
  WorkflowIntent,
  WorkflowIntentDeliverStep,
  WorkflowIntentEdge,
  WorkflowIntentMutateStep,
  WorkflowIntentReadStep,
  WorkflowIntentStep,
} from './workflow-intent.types';
import type {
  WorkflowIrDocument,
  WorkflowIrNode,
} from './workflow-ir.types';

export type CompiledWorkflowIr = WorkflowIrDocument & {
  /** intent step id → 该步展开出的首个 IR node id */
  stepEntryNodeId: Record<string, string>;
  /** intent step id → 该步展开出的末个 IR node id */
  stepExitNodeId: Record<string, string>;
};

type CompileCtx = {
  nodes: WorkflowIrNode[];
  stepEntryNodeId: Record<string, string>;
  stepExitNodeId: Record<string, string>;
};

type IrEdge = WorkflowIrDocument['edges'][number];

/**
 * 策略编译：Intent → 新 IR 词表（机器语言）。
 * - 无 load_page_context（Runtime Context）
 * - 识图 → llm + vision capability
 * - judge → structured_output（边用 router when/default）
 * - deliver fill → llm? + host_effect；speak → message_send / llm
 * - mutate → data_transform? + human_task(+optional present) + tool_call + optional message_send
 *   产品标准：组参→审批→执行（无 present / 写后 speak）。
 *   explainBeforeConfirm / summarizeAfter 仅 `=== true` 兼容旧 Intent；Preset/FE 勿再写。
 */
export function compileWorkflowIr(intent: WorkflowIntent): CompiledWorkflowIr {
  const ctx: CompileCtx = {
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
    throw new Error(
      `compileWorkflowIr: missing IR entry for intent step ${intent.entryStepId}`,
    );
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

function compileStep(step: WorkflowIntentStep, ctx: CompileCtx): void {
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
      const _exhaustive: never = step;
      void _exhaustive;
      throw new Error('compileWorkflowIr: unknown operation');
    }
  }
}

function compileRead(step: WorkflowIntentReadStep, ctx: CompileCtx): void {
  const produced: WorkflowIrNode[] = [];
  const toolIds = step.slots?.readToolIds ?? [];
  const images = step.capabilities?.images;

  if (toolIds.length > 0) {
    produced.push({
      id: `${step.id}__query`,
      type: 'data_query',
      name: step.name ?? '获取数据',
      config: {
        toolIds,
        completeWhen: 'first_success',
        objective: step.objective,
      },
    });
  }

  if (images?.enabled) {
    produced.push({
      id: `${step.id}__vision`,
      type: 'llm',
      name: '图片识别',
      config: {
        capabilities: { vision: true },
        from: images.from ?? (toolIds.length ? 'upstream' : 'page_context'),
        hint: images.hint,
        objective: 'Recognize images into textual evidence.',
      },
    });
  }

  if (produced.length === 0) {
    throw new Error(
      `compileWorkflowIr: read step "${step.id}" needs readToolIds and/or evidence.images`,
    );
  }

  appendChain(step.id, produced, ctx);
}

function compileJudge(
  step: Extract<WorkflowIntentStep, { operation: 'judge' }>,
  ctx: CompileCtx,
): void {
  appendChain(step.id, [
    {
      id: `${step.id}__structured`,
      type: 'structured_output',
      name: step.name ?? '状态识别',
      config: {
        hint: step.capabilities?.policyHint,
        objective: step.objective,
      },
    },
  ], ctx);
}

function compileDeliver(step: WorkflowIntentDeliverStep, ctx: CompileCtx): void {
  if (step.channel === 'fill') {
    const hostToolIds = step.slots?.fillHostToolIds ?? [];
    // 页内填：host_effect；内容生成仍由现有 host fill executor 内聚（降低桥接复杂度）
    appendChain(step.id, [
      {
        id: `${step.id}__host`,
        type: 'host_effect',
        name: step.name ?? '生成并推送到页面',
        config: {
          hostToolIds,
          objective:
            step.objective ??
            'Generate user-facing content and push to the page via the bound host tool.',
        },
      },
    ], ctx);
    return;
  }

  appendChain(step.id, [
    {
      id: `${step.id}__speak`,
      type: 'message_send',
      name: step.name ?? '说明总结',
      config: {
        channel: 'chat',
        mode: 'final',
        stream: true,
        objective: step.objective,
      },
    },
  ], ctx);
}

function compileMutate(step: WorkflowIntentMutateStep, ctx: CompileCtx): void {
  const writeToolId = step.slots.writeToolId;
  const produced: WorkflowIrNode[] = [];

  const readIds = step.slots.readToolIds ?? [];
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

  produced.push(
    {
      id: `${step.id}__compose`,
      type: 'data_transform',
      name: '组装变更参数',
      config: {
        purpose: 'compose_mutation',
        toolId: writeToolId,
        objective:
          'Compose write parameters only from observations; do not execute write yet.',
      },
    },
    {
      id: `${step.id}__human`,
      type: 'human_task',
      name: '等待用户确认',
      config: {
        kind: 'mutation',
        presentMode: 'brief',
        // 产品永不传 true；仅存量 Intent ===true 时 materialize/native 插 present
        explainBeforeConfirm: step.explainBeforeConfirm === true,
        objective: 'Wait for user confirmation before executing the write.',
      },
    },
    {
      id: `${step.id}__write`,
      type: 'tool_call',
      name: '提交变更',
      config: {
        toolId: writeToolId,
        useComposedArgs: true,
        objective: 'Execute the bound write tool using composed parameters.',
      },
    },
  );

  // 标准无写后总结；仅 summarizeAfter===true 时追加
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

function appendChain(
  stepId: string,
  produced: WorkflowIrNode[],
  ctx: CompileCtx,
): void {
  const first = produced[0]!;
  const last = produced[produced.length - 1]!;
  ctx.stepEntryNodeId[stepId] = first.id;
  ctx.stepExitNodeId[stepId] = last.id;
  ctx.nodes.push(...produced);
}

function mapIntentEdges(
  intentEdges: WorkflowIntentEdge[],
  ctx: CompileCtx,
): IrEdge[] {
  const edges: IrEdge[] = [];

  for (const stepId of Object.keys(ctx.stepEntryNodeId)) {
    const ordered = ctx.nodes.filter((n) => n.id.startsWith(`${stepId}__`));
    for (let i = 0; i < ordered.length - 1; i++) {
      edges.push({
        id: `ir:${ordered[i]!.id}->${ordered[i + 1]!.id}`,
        from: ordered[i]!.id,
        to: ordered[i + 1]!.id,
        kind: 'always',
      });
    }
  }

  for (const e of intentEdges) {
    const fromIr = ctx.stepExitNodeId[e.from];
    const toIr = ctx.stepEntryNodeId[e.to];
    if (!fromIr || !toIr) {
      throw new Error(
        `compileWorkflowIr: cannot map edge ${e.id} (${e.from}→${e.to})`,
      );
    }
    const kind = e.kind ?? 'always';
    if (kind === 'state') {
      edges.push({
        id: e.id,
        from: fromIr,
        to: toIr,
        kind: 'when',
        when: e.state?.key,
        whenDescription: e.state?.description,
      });
    } else if (kind === 'default') {
      edges.push({
        id: e.id,
        from: fromIr,
        to: toIr,
        kind: 'default',
      });
    } else {
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
