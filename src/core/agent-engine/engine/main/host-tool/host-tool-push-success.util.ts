import type { TaskPlanSnapshot } from '../plan/task-plan.types';
import type { ToolObservation } from '../types/agent-engine.types';
import { textBlock } from '../../message/message-blocks.util';
import type { MessageBlock } from '../../message/message-blocks.types';
import { extractHostToolDispatchedFillText } from './host-tool-fill-alignment.util';
import {
  HOST_TOOL_INVOKE_OBSERVATION_NAME,
} from './host-tool-plan.util';

export const HOST_WRITE_CHANNEL_CONSTRAINT = 'host_write_channel';

export function planHasHostWriteChannel(
  plan: TaskPlanSnapshot | null | undefined,
): boolean {
  return (plan?.constraints ?? []).includes(HOST_WRITE_CHANNEL_CONSTRAINT);
}

export function findDispatchedHostToolObservation(
  observations: ToolObservation[],
): ToolObservation | null {
  for (let i = observations.length - 1; i >= 0; i -= 1) {
    const row = observations[i];
    if (row?.name !== HOST_TOOL_INVOKE_OBSERVATION_NAME) {
      continue;
    }
    const output = row.output;
    if (
      output != null &&
      typeof output === 'object' &&
      !Array.isArray(output) &&
      (output as Record<string, unknown>).outcome === 'dispatched'
    ) {
      return row;
    }
  }
  return null;
}

export type HostToolPushSuccessContent = {
  plainText: string;
  blocks: MessageBlock[];
  summaryStepName: string;
};

/** host 写通道：push 已 dispatch 则视为成功，生成确定性用户可见回复（不走 summarize LLM）。 */
export function resolveHostToolPushSuccessContent(input: {
  taskPlan: TaskPlanSnapshot | null | undefined;
  observations: ToolObservation[];
}): HostToolPushSuccessContent | null {
  if (!planHasHostWriteChannel(input.taskPlan)) {
    return null;
  }
  const dispatched = findDispatchedHostToolObservation(input.observations);
  if (!dispatched) {
    return null;
  }
  const output =
    dispatched.output != null &&
    typeof dispatched.output === 'object' &&
    !Array.isArray(dispatched.output)
      ? (dispatched.output as Record<string, unknown>)
      : {};
  const planStepId =
    typeof output.planStepId === 'string' ? output.planStepId : null;
  const toolName =
    typeof output.tool === 'string' && output.tool.trim().length > 0
      ? output.tool.trim()
      : '页面自动化';
  const fillText = extractHostToolDispatchedFillText({
    observations: input.observations,
    planStepId,
  });
  const plainText =
    fillText?.trim() ||
    `已通过 ${toolName} 推送到页面，请在当前页面查看效果。`;
  return {
    plainText,
    blocks: [textBlock(plainText, 'markdown')],
    summaryStepName: HOST_TOOL_INVOKE_OBSERVATION_NAME,
  };
}
