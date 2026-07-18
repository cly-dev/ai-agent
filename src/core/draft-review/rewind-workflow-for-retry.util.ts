import type { WorkflowIrDocument } from '../workflow/workflow-ir.types';
import type { WorkflowNodeDef, WorkflowRunState } from '../workflow/workflow.types';
import {
  materializeWorkflowIrNodeForPhase,
  resolveWorkflowIrNativePhases,
} from '../workflow/workflow-ir-native-phase.util';
import { startWorkflowNode } from '../workflow/workflow-run.util';

function cloneRun(run: WorkflowRunState): WorkflowRunState {
  return {
    ...run,
    nodes: run.nodes.map((node) => ({ ...node })),
  };
}

function findRetryTargetNodeId(
  nodes: WorkflowNodeDef[],
  run: WorkflowRunState,
): string | null {
  const ordered = nodes.map((row) => row.id);
  const awaitIndex = ordered.findIndex(
    (id) => nodes.find((row) => row.id === id)?.action === 'await_user_confirm',
  );
  const searchEnd = awaitIndex >= 0 ? awaitIndex : ordered.length;
  const candidates = ordered.slice(0, searchEnd);
  for (const action of ['compose_mutation', 'present_mutation', 'summarize'] as const) {
    const match = [...candidates]
      .reverse()
      .find((id) => nodes.find((row) => row.id === id)?.action === action);
    if (match) {
      return match;
    }
  }
  return candidates[candidates.length - 1] ?? run.currentNodeId;
}

export type RewindWorkflowForRetryResult = {
  workflowRun: WorkflowRunState;
  retryNodeId: string | null;
  clearedOutputKeys: string[];
};

export function rewindWorkflowForDraftRetry(input: {
  workflowRun: WorkflowRunState;
  workflowNodeDefs: WorkflowNodeDef[];
  nodeOutputs: Record<string, unknown>;
  /** Plan A：native 多相位时用于恢复入口 phase（避免卡在 await 跳过 re-present） */
  ir?: WorkflowIrDocument | null;
}): RewindWorkflowForRetryResult {
  const retryNodeId = findRetryTargetNodeId(
    input.workflowNodeDefs,
    input.workflowRun,
  );
  if (!retryNodeId) {
    return {
      workflowRun: input.workflowRun,
      retryNodeId: null,
      clearedOutputKeys: [],
    };
  }

  const retryIndex = input.workflowNodeDefs.findIndex(
    (row) => row.id === retryNodeId,
  );
  const next = cloneRun(input.workflowRun);
  next.status = 'running';

  for (let index = 0; index < next.nodes.length; index += 1) {
    const node = next.nodes[index];
    if (index < retryIndex) {
      continue;
    }
    node.status = 'pending';
    delete node.startedAt;
    delete node.finishedAt;
    delete node.outputRef;
    delete node.error;

    const def = input.workflowNodeDefs.find((row) => row.id === node.nodeId);
    if (def) {
      node.action = def.action;
      node.name = def.name;
    }
    // native present→await：挂起时 phase=await；retry 须回到入口 present，否则跳过草稿再生。
    if (node.phase != null && input.ir) {
      const irNode = input.ir.nodes.find((n) => n.id === node.nodeId);
      if (irNode) {
        const entry = resolveWorkflowIrNativePhases(irNode)[0]!;
        const phaseDef = materializeWorkflowIrNodeForPhase(irNode, entry);
        node.phase = entry;
        node.action = phaseDef.action;
        node.name = phaseDef.name;
      }
    } else if (node.phase === 'await' && def?.action === 'present_mutation') {
      node.phase = 'present';
    }
  }

  const started = startWorkflowNode(next, retryNodeId);
  const clearedOutputKeys: string[] = [];
  const outputs = { ...input.nodeOutputs };
  for (const def of input.workflowNodeDefs.slice(retryIndex)) {
    for (const key of [
      def.id,
      `obs:${def.action}:${def.id}`,
      `obs:present_mutation:${def.id}`,
      `obs:compose_mutation:${def.id}`,
      `obs:summarize:${def.id}`,
    ]) {
      if (key in outputs) {
        delete outputs[key];
        clearedOutputKeys.push(key);
      }
    }
    if (def.action === 'compose_mutation') {
      const composeKey = 'page_compose_mutation';
      for (const key of Object.keys(outputs)) {
        const raw = outputs[key];
        if (
          raw &&
          typeof raw === 'object' &&
          !Array.isArray(raw) &&
          composeKey in (raw as Record<string, unknown>)
        ) {
          delete outputs[key];
          clearedOutputKeys.push(key);
        }
      }
    }
  }

  return {
    workflowRun: started,
    retryNodeId,
    clearedOutputKeys,
  };
}

export function stripNodeOutputsForRetry(
  nodeOutputs: Record<string, unknown>,
  clearedKeys: string[],
): Record<string, unknown> {
  const next = { ...nodeOutputs };
  for (const key of clearedKeys) {
    delete next[key];
  }
  return next;
}
