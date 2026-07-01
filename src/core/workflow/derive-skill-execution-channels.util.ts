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
 */
export function deriveSkillExecutionChannels(input: {
  nodes?: WorkflowNodeDef[];
  deliverable?: WorkflowDeliverable | string | null;
  skillToolIds: readonly number[];
  hostToolIds: readonly number[];
}): SkillExecutionChannels {
  const nodes = input.nodes ?? [];
  if (nodes.length > 0) {
    const actions = new Set(nodes.map((node) => node.action));
    const httpMutation =
      input.deliverable === 'mutation' ||
      actions.has('write_data') ||
      (actions.has('compose_mutation') && actions.has('await_user_confirm'));
    const hostPush = actions.has('generate_and_push');
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
      httpRead:
        actions.has('fetch_data') || actions.has('load_page_context'),
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
