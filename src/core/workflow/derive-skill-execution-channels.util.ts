import type { WorkflowDeliverable } from '../../../generated/prisma/client';
import type { WorkflowNodeDef } from './workflow.types';

/** Skill 可走的执行通道（由 Workflow 资产 + Tool 绑定推导）。 */
export type SkillExecutionChannels = {
  httpRead: boolean;
  httpMutation: boolean;
  hostPush: boolean;
  /** Workflow deliverable / 节点组合推导的主写通道；显式 Skill 锚定用。 */
  primaryWriteChannel: 'http' | 'host' | null;
};

export const EMPTY_SKILL_EXECUTION_CHANNELS: SkillExecutionChannels = {
  httpRead: false,
  httpMutation: false,
  hostPush: false,
  primaryWriteChannel: null,
};

/**
 * 从 Workflow 节点 + deliverable 推导 Skill 执行通道（SSOT）。
 * 无 Workflow 节点时，仅根据 SkillTool / SkillHostTool 做最小推断（无 httpMutation）。
 * 优先认 `irType`（Flow IR 双分发）；无标时回退 legacy `action`。
 */
export function deriveSkillExecutionChannels(input: {
  nodes?: WorkflowNodeDef[];
  deliverable?: WorkflowDeliverable | string | null;
  skillToolIds: readonly number[];
  hostToolIds: readonly number[];
}): SkillExecutionChannels {
  const nodes = input.nodes ?? [];
  if (nodes.length > 0) {
    const httpRead = nodes.some(
      (n) => n.irType === 'data_query' || n.action === 'fetch_data',
    );
    const hostPush = nodes.some(
      (n) => n.irType === 'host_effect' || n.action === 'generate_and_push',
    );
    const httpMutation =
      input.deliverable === 'mutation' ||
      nodes.some(
        (n) => n.irType === 'tool_call' || n.action === 'write_data',
      ) ||
      (nodes.some(
        (n) =>
          n.irType === 'data_transform' || n.action === 'compose_mutation',
      ) &&
        nodes.some(
          (n) =>
            n.irType === 'human_task' || n.action === 'await_user_confirm',
        ));
    const primaryWriteChannel = ((): SkillExecutionChannels['primaryWriteChannel'] => {
      if (input.deliverable === 'mutation' || httpMutation) {
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
  return {
    httpRead: input.skillToolIds.length > 0,
    httpMutation: false,
    hostPush: input.hostToolIds.length > 0,
    primaryWriteChannel: input.hostToolIds.length > 0 ? 'host' : null,
  };
}
