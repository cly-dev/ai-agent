import type { WorkflowDeliverable } from '../../../generated/prisma/client';
import type { WorkflowIrDocument } from './workflow-ir.types';
import type { SkillExecutionChannels } from './derive-skill-execution-channels.util';

/**
 * 从 Flow.ir 直接推导 Skill 通道（§4.1e：免 lower）。
 * 与 deriveSkillExecutionChannels(nodes) 语义对齐，真源为 IR type。
 */
export function deriveSkillExecutionChannelsFromIr(input: {
  ir: WorkflowIrDocument;
  deliverable?: WorkflowDeliverable | string | null;
}): SkillExecutionChannels {
  const { ir } = input;
  if (ir.nodes.length === 0) {
    return {
      httpRead: false,
      httpMutation: false,
      hostPush: false,
      primaryWriteChannel: null,
    };
  }
  const types = new Set(ir.nodes.map((n) => n.type));

  const httpRead = types.has('data_query');
  const hostPush = types.has('host_effect');
  const hasWriteTool = types.has('tool_call');
  const hasCompose =
    types.has('data_transform') &&
    ir.nodes.some(
      (n) =>
        n.type === 'data_transform' &&
        n.config?.purpose === 'compose_mutation',
    );
  const hasHumanConfirm = types.has('human_task');
  const httpMutation =
    hasWriteTool || (hasCompose && hasHumanConfirm);

  const primaryWriteChannel = ((): SkillExecutionChannels['primaryWriteChannel'] => {
    if (httpMutation) {
      return 'http';
    }
    if (hostPush) {
      return 'host';
    }
    return null;
  })();

  return {
    httpRead,
    httpMutation,
    hostPush,
    primaryWriteChannel,
  };
}
