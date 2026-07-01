import type { LlmChatMessage } from '../../../../llm/llm.types';
import type { PromptRegistryService } from '../../../../prompt/prompt-registry.service';
import { PROMPT_KEYS } from '../../../../prompt/prompt-template.keys';
import type { AgentChatPageContext } from '../../../../host-bridge/page-context.types';
import { formatPageContextPromptBlock } from '../../../../host-bridge/page-context.prompt.util';
import type { HostToolDecisionDefinition } from '../../../../host-bridge/host-tool-decision.types';
import {
  formatSplitToolObservationsForSummarize,
  isSplitToolObservationsOutput,
  resolvePrimaryObservationForSummarize,
} from '../../observation-format.util';
import type { ToolObservation } from '../types/agent-engine.types';
import { summarizeHostToolsForReasonFillPrompt } from './plan-host-fill.util';

export function buildPlanReasonHostFillUserContent(input: {
  userMessage: string;
  planContext: string | null;
  pageContext?: AgentChatPageContext | null;
  hostTools: HostToolDecisionDefinition[];
  splitObservationsText: string | null;
  serializedOutput: string;
}): string {
  const pageContextBlock = formatPageContextPromptBlock(input.pageContext);
  return [
    `User request: ${input.userMessage}`,
    input.planContext
      ? `<plan_context>\n${input.planContext}\n</plan_context>`
      : null,
    pageContextBlock,
    `<host_tools>\n${summarizeHostToolsForReasonFillPrompt(input.hostTools)}\n</host_tools>`,
    input.splitObservationsText
      ? `Tool observations (prefer current_run_observations for the latest request):\n${input.splitObservationsText}`
      : `Context: ${input.serializedOutput}`,
  ]
    .filter((line): line is string => line != null && line.length > 0)
    .join('\n');
}

/** 机器层 stream prompt 消息。 */
export async function buildPlanReasonHostMachineStreamMessages(input: {
  agentPrompts: LlmChatMessage[];
  promptRegistry: PromptRegistryService;
  scope: { appClientId: number; agentId: number };
  userContext: string;
}): Promise<LlmChatMessage[]> {
  const systemContent = await input.promptRegistry.render(
    PROMPT_KEYS.AGENT_SUMMARIZE_PLAN_REASON_HOST_FILL_STREAM,
    input.scope,
  );
  return [
    ...input.agentPrompts,
    { role: 'system', content: systemContent },
    { role: 'user', content: input.userContext },
  ];
}

export function resolveReasonHostFillObservationPayload(input: {
  mergedObservation: ToolObservation;
  toolObservations: ToolObservation[];
}): {
  splitObservationsText: string | null;
  serializedOutput: string;
} {
  const splitOutput = isSplitToolObservationsOutput(input.mergedObservation.output)
    ? input.mergedObservation.output
    : null;
  const primaryObservation = splitOutput
    ? resolvePrimaryObservationForSummarize(splitOutput)
    : null;
  const primaryOutput = primaryObservation?.output ?? input.mergedObservation.output;
  return {
    splitObservationsText: splitOutput
      ? formatSplitToolObservationsForSummarize(splitOutput)
      : null,
    serializedOutput: JSON.stringify(primaryOutput),
  };
}
