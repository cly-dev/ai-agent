import { AIMessage } from '@langchain/core/messages';
import type { LlmChatMessage } from '../../../../../llm/llm.types';
import {
  extractAgentPromptMessages,
  extractPageContextForDecision,
  extractSessionHistoryForDecision,
  extractSessionMemoryForDecision,
  joinAgentPromptText,
} from '../../../prompt-message.util';
import {
  formatSplitObservationsPromptBlock,
  toolObservationsToPayloads,
  type SplitToolObservationsOutput,
} from '../../../observation-format.util';
import { estimateMessagesTokens } from '../../../../../llm/message-token-budget.util';
import { summarizeToolsForLlmSchema } from '../../../tool/tool-schema-compact.util';
import { summarizeHostToolsForLlmSchema, type HostToolDecisionDefinition } from '../../../../../host-bridge';
import { PROMPT_KEYS } from '../../../../../prompt/prompt-template.keys';
import { normalizeToolCallArgs } from '../../../../../llm/tool-call-args.util';
import {
  buildDecisionUserFrame,
  getPendingPlanHostToolStep,
  getPendingPlanToolStep,
  isComposeMutationParameterStep,
  isPlanWriteExecutionStepInMutationFlow,
} from '../../plan/task-plan.util';
import { appendWorkflowNodeOutputsToLlmMessages } from '../../../../../workflow/workflow-node-outputs.util';
import type { TaskPlanSnapshot } from '../../plan/task-plan.types';
import type { GraphToolCall } from '../../types/agent-engine.types';
import type { AgentGraphDeps } from '../types/graph.types';

export interface AgentGraphDecisionHelpers {
  buildLlmInvokeMessages: typeof buildLlmInvokeMessages;
  buildDecisionPrompt: (
    promptMessages: LlmChatMessage[],
    tools: Parameters<typeof buildDecisionPrompt>[2],
    observationSplit: Parameters<typeof buildDecisionPrompt>[3],
    enableToolCall: Parameters<typeof buildDecisionPrompt>[4],
    scope: Parameters<typeof buildDecisionPrompt>[5],
    activeSkillPrompt?: Parameters<typeof buildDecisionPrompt>[6],
    taskPlan?: Parameters<typeof buildDecisionPrompt>[7],
    hostToolsForPrompt?: Parameters<typeof buildDecisionPrompt>[8],
  ) => ReturnType<typeof buildDecisionPrompt>;
  toLangChainInvokeMessage: typeof toLangChainInvokeMessage;
  buildTaskPlanTraceForLlmStep: typeof buildTaskPlanTraceForLlmStep;
  extractToolCalls: typeof extractToolCalls;
  extractAiMessageText: typeof extractAiMessageText;
  stringifyForPrompt: typeof stringifyForPrompt;
  renderToolDecisionTemplate: (
    scope: Parameters<typeof renderToolDecisionTemplate>[1],
    toolCallInstruction: Parameters<typeof renderToolDecisionTemplate>[2],
  ) => ReturnType<typeof renderToolDecisionTemplate>;
  appendPlanStepDecisionHint: typeof appendPlanStepDecisionHint;
  extractRequiredParamNames: typeof extractRequiredParamNames;
}

export function buildLlmInvokeMessages(
    promptMessages: LlmChatMessage[],
    observationSplit: SplitToolObservationsOutput,
    latestUserMessage: string,
    toolSchemaJson: string,
    hostToolSchemaJson: string,
    toolDecisionPrompt: string,
    messageTokenBudget: number,
    taskPlan?: TaskPlanSnapshot | null,
    workflowNodeOutputs?: Record<string, unknown>,
  ): {
    messages: Array<{ role: string; content: string; toolCallId?: string }>;
    trimMeta: {
      configuredBudget: number;
      effectiveBudget: number;
      estimatedTokensBefore: number;
      estimatedTokensAfter: number;
      trimmed: boolean;
      droppedMessageIndexes: number[];
      truncatedMessageIndexes: number[];
    };
  } {
    const messages: LlmChatMessage[] = [];

    for (const item of extractAgentPromptMessages(promptMessages)) {
      messages.push({ role: item.role, content: item.content });
    }

    for (const item of extractPageContextForDecision(promptMessages)) {
      messages.push({ role: item.role, content: item.content });
    }

    for (const item of extractSessionMemoryForDecision(promptMessages)) {
      messages.push({ role: item.role, content: item.content });
    }

    for (const item of extractSessionHistoryForDecision(
      promptMessages,
      latestUserMessage,
    )) {
      messages.push({ role: item.role, content: item.content });
    }

    const withWorkflowOutputs = appendWorkflowNodeOutputsToLlmMessages(
      messages,
      workflowNodeOutputs,
    );
    messages.length = 0;
    messages.push(...withWorkflowOutputs);

    const observationBlock = formatSplitObservationsPromptBlock({
      workingMemory: toolObservationsToPayloads(
        observationSplit.workingMemory,
        'session',
      ),
      currentRun: toolObservationsToPayloads(
        observationSplit.currentRun,
        'current_run',
      ),
    });
    if (
      observationSplit.workingMemory.length > 0 ||
      observationSplit.currentRun.length > 0
    ) {
      messages.push({
        role: 'assistant',
        content: observationBlock,
      });
    }

    messages.push({
      role: 'tool',
      content: `<tool_schema>\n${toolSchemaJson}\n</tool_schema>`,
      toolCallId: 'decision_tool_schema',
    });
    if (hostToolSchemaJson && hostToolSchemaJson !== '[]') {
      messages.push({
        role: 'tool',
        content: `<host_tool_schema>\n${hostToolSchemaJson}\n</host_tool_schema>`,
        toolCallId: 'decision_host_tool_schema',
      });
    }
    messages.push({
      role: 'system',
      content: `<tool_decision>\n${toolDecisionPrompt}\n</tool_decision>`,
    });

    const pinnedUser = buildDecisionUserFrame({
      taskPlan,
      observationCount:
        observationSplit.workingMemory.length +
        observationSplit.currentRun.length,
      latestUserMessage,
    });
    if (pinnedUser) {
      messages.push(pinnedUser);
    }

    const estimatedTokens = estimateMessagesTokens(messages);

    return {
      messages: messages.map((item) => ({
        role: item.role,
        content: item.content,
        ...(item.toolCallId ? { toolCallId: item.toolCallId } : {}),
      })),
      trimMeta: {
        configuredBudget: messageTokenBudget,
        effectiveBudget: messageTokenBudget,
        estimatedTokensBefore: estimatedTokens,
        estimatedTokensAfter: estimatedTokens,
        trimmed: false,
        droppedMessageIndexes: [],
        truncatedMessageIndexes: [],
      },
    };
  }

export function toLangChainInvokeMessage(message: {
    role: string;
    content: string;
    toolCallId?: string;
  }): Record<string, string> {
    if (message.role === 'tool') {
      return {
        role: 'tool',
        content: message.content,
        tool_call_id: message.toolCallId ?? 'decision_tool_schema',
      };
    }
    return {
      role: message.role,
      content: message.content,
    };
  }

export function appendPlanStepDecisionHint(
    toolDecisionPrompt: string,
    taskPlan: TaskPlanSnapshot | null | undefined,
  ): string {
    const step = getPendingPlanToolStep(taskPlan);
    if (isComposeMutationParameterStep(step)) {
      return `${toolDecisionPrompt}\n\n<plan_step_override>
COMPOSE_WRITE step: emit exactly ONE bound write tool_call with all required parameters from <tool_schema> (identifiers, headers, enums) and the full submit body from read observations.
This overrides skill "wait for draft" and generic "empty tool_calls when no draft" rules.
plan_compose_write / plan_draft_reply are runtime observations — NOT callable tools.
</plan_step_override>`;
    }
    if (isPlanWriteExecutionStepInMutationFlow(step)) {
      return `${toolDecisionPrompt}\n\n<plan_step_override>
WRITE fallback step: call ONLY tools listed in <tool_schema>.
If plan_compose_write summary exists, copy its pendingWriteTool + arguments verbatim — do not invent new reply text.
NEVER emit tool_calls to plan_compose_write, plan_draft_reply, or any observation name.
</plan_step_override>`;
    }
    const hostStep = getPendingPlanHostToolStep(taskPlan);
    if (hostStep) {
      const names = hostStep.hostToolNames?.join(', ') ?? 'scoped host tools';
      return `${toolDecisionPrompt}\n\n<plan_step_override>
HOST_TOOL step: emit tool_calls ONLY for browser host tools (${names}) listed in <host_tool_schema>.
Do NOT call HTTP tools from <tool_schema>. Args are executed in the user's browser, not on the server.
</plan_step_override>`;
    }
    if (
      step?.kind === 'tool' &&
      step.phase === 'gather' &&
      step.toolRole === 'read-list'
    ) {
      const pinned = step.pinnedToolNames?.length
        ? step.pinnedToolNames.join(', ')
        : 'a read-list tool from <tool_schema>';
      return `${toolDecisionPrompt}\n\n<plan_step_override>
GATHER read-list step: emit exactly ONE HTTP tool_call for ${pinned} from <tool_schema>.
Derive filters from <current_objective>, <user_intent>, and observations; omit optional query params when unspecified.
Do NOT return empty tool_calls while this gather step is pending unless schema-required parameters cannot be inferred (param_gate runs after tool_calls).
</plan_step_override>`;
    }
    return toolDecisionPrompt;
  }

export function stringifyForPrompt(value: unknown): string {
    try {
      return typeof value === 'string' ? value : JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

export function extractRequiredParamNames(inputSchema: unknown): string[] {
    if (!inputSchema || typeof inputSchema !== 'object' || Array.isArray(inputSchema)) {
      return [];
    }
    const row = inputSchema as Record<string, unknown>;
    const params = row.parameters;
    if (!Array.isArray(params)) {
      return [];
    }
    return params
      .map((item) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
          return null;
        }
        const param = item as Record<string, unknown>;
        const required = param.required === true;
        const name =
          typeof param.name === 'string' && param.name.trim().length > 0
            ? param.name.trim()
            : null;
        if (!required || !name) {
          return null;
        }
        return name;
      })
      .filter((name): name is string => name != null);
  }

export function buildTaskPlanTraceForLlmStep(
    taskPlan: TaskPlanSnapshot | null | undefined,
  ): Record<string, unknown> | null {
    if (!taskPlan) {
      return null;
    }
    return {
      source: taskPlan.source,
      deliverable: taskPlan.deliverable,
      goal: taskPlan.goal,
      currentStepId: taskPlan.currentStepId,
      currentObjective: taskPlan.currentObjective,
      taskPhase: taskPlan.taskPhase,
      pendingStepIds: taskPlan.pendingStepIds,
      completedStepIds: taskPlan.completedStepIds,
      steps: taskPlan.steps.map((step) => ({
        id: step.id,
        phase: step.phase,
        kind: step.kind,
        skillId: step.skillId ?? null,
        toolRole: step.toolRole ?? null,
        objective: step.objective,
        stopWhen: step.stopWhen ?? 'observation_non_empty',
      })),
      activeFrameIndex: taskPlan.activeFrameIndex,
      frameCount: taskPlan.frames.length,
    };
  }

export function extractAiMessageText(message: AIMessage): string {
    if (typeof message.content === 'string') {
      return message.content;
    }
    if (Array.isArray(message.content)) {
      return message.content
        .map((item) =>
          item && typeof item === 'object' && 'text' in item
            ? String(item.text ?? '')
            : '',
        )
        .join('');
    }
    return '';
  }

export function extractToolCalls(message: AIMessage): GraphToolCall[] {
    const value = (message.tool_calls ??
      message.additional_kwargs?.tool_calls ??
      []) as unknown[];
    if (!Array.isArray(value)) {
      return [];
    }
    return value
      .map((item) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
          return null;
        }
        const row = item as Record<string, unknown>;
        const directName = row.name;
        const directArgs = row.args;
        if (typeof directName === 'string') {
          return {
            name: directName,
            arguments: normalizeToolCallArgs(directArgs),
          };
        }
        const fn = row.function;
        if (!fn || typeof fn !== 'object' || Array.isArray(fn)) {
          return null;
        }
        const fnRow = fn as Record<string, unknown>;
        const name = fnRow.name;
        if (typeof name !== 'string') {
          return null;
        }
        return {
          name,
          arguments: normalizeToolCallArgs(fnRow.arguments),
        };
      })
      .filter((item) => item !== null) as GraphToolCall[];
  }

export async function buildDecisionPrompt(deps: AgentGraphDeps, 
    promptMessages: LlmChatMessage[],
    tools: Array<{
      id: number;
      name: string;
      description: string;
      inputSchema: unknown;
      schema: unknown;
      responseProfile: unknown;
      agentMetadata: unknown;
      method: string;
    }>,
    observationSplit: SplitToolObservationsOutput,
    enableToolCall: boolean,
    scope: { appClientId: number; agentId: number },
    activeSkillPrompt?: string | null,
    taskPlan?: TaskPlanSnapshot | null,
    hostToolsForPrompt: HostToolDecisionDefinition[] = [],
  ): Promise<{
    toolDecisionPrompt: string;
    toolSchemaJson: string;
    hostToolSchemaJson: string;
    observationsJson: string;
    agentPrompt: string | null;
  }> {
    const agentPrompt = joinAgentPromptText(promptMessages);
    const toolSchema = summarizeToolsForLlmSchema(
      tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
        schema: tool.schema,
        responseProfile: tool.responseProfile,
        agentMetadata: tool.agentMetadata,
        method: tool.method,
      })),
    );
    const hostToolSchema = summarizeHostToolsForLlmSchema(hostToolsForPrompt);
    const toolCallInstruction = enableToolCall
      ? hostToolsForPrompt.length > 0
        ? 'If HTTP tools are needed, use <tool_schema>. If host/browser tools are needed, use <host_tool_schema>. Otherwise answer in message content with empty tool_calls.'
        : 'If a tool is needed, use native tool_calls. If not needed, answer in message content with empty tool_calls.'
      : 'Tool calling is disabled. Reply directly in message content with empty tool_calls.';
    let toolDecisionPrompt = await renderToolDecisionTemplate(
      deps,
      scope,
      toolCallInstruction,
    );
    const skillPrompt = activeSkillPrompt?.trim();
    if (skillPrompt) {
      toolDecisionPrompt = `<active_skill>\n${skillPrompt}\n</active_skill>\n\n${toolDecisionPrompt}`;
    }
    toolDecisionPrompt = appendPlanStepDecisionHint(
      toolDecisionPrompt,
      taskPlan,
    );
    return {
      toolDecisionPrompt,
      toolSchemaJson: JSON.stringify(toolSchema),
      hostToolSchemaJson: JSON.stringify(hostToolSchema),
      observationsJson: formatSplitObservationsPromptBlock({
        workingMemory: toolObservationsToPayloads(
          observationSplit.workingMemory,
          'session',
        ),
        currentRun: toolObservationsToPayloads(
          observationSplit.currentRun,
          'current_run',
        ),
      }),
      agentPrompt,
    };
  }

export async function renderToolDecisionTemplate(deps: AgentGraphDeps, 
    scope: { appClientId: number; agentId: number },
    toolCallInstruction: string,
  ): Promise<string> {
    const variables = { toolCallInstruction };
    return deps.promptRegistry.render(
      PROMPT_KEYS.AGENT_TOOL_DECISION,
      scope,
      variables,
    );
  }

export function createAgentGraphDecisionHelpers(deps: AgentGraphDeps): AgentGraphDecisionHelpers {
  return {
    buildLlmInvokeMessages,
    buildDecisionPrompt: buildDecisionPrompt.bind(null, deps) as AgentGraphDecisionHelpers['buildDecisionPrompt'],
    toLangChainInvokeMessage,
    buildTaskPlanTraceForLlmStep,
    extractToolCalls,
    extractAiMessageText,
    stringifyForPrompt,
    renderToolDecisionTemplate: renderToolDecisionTemplate.bind(null, deps) as AgentGraphDecisionHelpers['renderToolDecisionTemplate'],
    appendPlanStepDecisionHint,
    extractRequiredParamNames,
  };
}
